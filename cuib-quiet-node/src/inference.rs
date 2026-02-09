use std::fmt::{Display, Formatter};
use std::fs::File;
use std::io::Read;
use std::path::Path;

use anyhow::{Context, Result, anyhow};
use csv::ReaderBuilder;

use crate::buffer::AudioWindow;

#[cfg_attr(not(any(feature = "tflite-inference", test)), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SoundCategory {
    Organic,
    Fade,
    Neutral,
}

impl Display for SoundCategory {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            SoundCategory::Organic => write!(f, "organic"),
            SoundCategory::Fade => write!(f, "fade"),
            SoundCategory::Neutral => write!(f, "neutral"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ClassifiedLabel {
    pub index: usize,
    pub label: String,
    pub score: f32,
    pub category: SoundCategory,
}

#[derive(Debug, Clone)]
pub struct Prediction {
    pub top: Vec<ClassifiedLabel>,
}

impl Prediction {
    pub fn summary(&self) -> String {
        let mut out = String::new();
        for (i, label) in self.top.iter().enumerate() {
            if i > 0 {
                out.push_str(", ");
            }
            out.push_str(&format!("{}:{:.3}", label.label, label.score));
        }
        out
    }
}

pub struct InferenceEngine {
    inner: runtime::EngineRuntime,
}

impl InferenceEngine {
    pub fn new<P: AsRef<Path>>(model_path: P, labels_path: P, top_k: usize) -> Result<Self> {
        let labels = load_labels(labels_path)?;
        let inner = runtime::EngineRuntime::new(model_path, labels, top_k)?;
        Ok(Self { inner })
    }

    pub fn expected_input_samples(&self) -> usize {
        self.inner.expected_input_samples()
    }

    pub fn predict(&mut self, window: &AudioWindow) -> Result<Prediction> {
        self.inner.predict(window)
    }
}

#[cfg(feature = "tflite-inference")]
mod runtime {
    use std::cmp::Ordering;
    use std::sync::Arc;

    use tflite::ops::builtin::BuiltinOpResolver;
    use tflite::{FlatBufferModel, Interpreter, InterpreterBuilder};

    use super::*;

    type TfInterpreter = Interpreter<'static, Arc<BuiltinOpResolver>>;

    #[derive(Debug, Clone, Copy)]
    enum TensorEncoding {
        F32,
        U8,
    }

    pub struct EngineRuntime {
        interpreter: TfInterpreter,
        labels: Vec<String>,
        input_index: i32,
        output_index: i32,
        input_len: usize,
        output_len: usize,
        input_encoding: TensorEncoding,
        output_encoding: TensorEncoding,
        top_k: usize,
    }

    impl EngineRuntime {
        pub fn new<P: AsRef<Path>>(
            model_path: P,
            labels: Vec<String>,
            top_k: usize,
        ) -> Result<Self> {
            let model =
                FlatBufferModel::build_from_file(model_path.as_ref()).with_context(|| {
                    format!("failed to load model {}", model_path.as_ref().display())
                })?;
            let resolver = Arc::new(BuiltinOpResolver::default());
            let builder = InterpreterBuilder::new(model, resolver)
                .context("failed to construct tflite interpreter builder")?;
            let mut interpreter = builder
                .build()
                .context("failed to build tflite interpreter")?;
            interpreter
                .allocate_tensors()
                .context("failed to allocate tflite tensors")?;

            let input_index = *interpreter
                .inputs()
                .first()
                .ok_or_else(|| anyhow!("model has no input tensor"))?;
            let output_index = *interpreter
                .outputs()
                .first()
                .ok_or_else(|| anyhow!("model has no output tensor"))?;

            let (input_len, input_encoding) = detect_input_encoding(&mut interpreter, input_index)?;
            let (output_len, output_encoding) = detect_output_encoding(&interpreter, output_index)?;

            let mut labels = labels;
            if labels.len() < output_len {
                for idx in labels.len()..output_len {
                    labels.push(format!("class_{idx}"));
                }
            }

            Ok(EngineRuntime {
                interpreter,
                labels,
                input_index,
                output_index,
                input_len,
                output_len,
                input_encoding,
                output_encoding,
                top_k: top_k.max(1),
            })
        }

        pub fn expected_input_samples(&self) -> usize {
            self.input_len
        }

        pub fn predict(&mut self, window: &AudioWindow) -> Result<Prediction> {
            self.write_input(window)?;
            self.interpreter
                .invoke()
                .context("failed invoking tflite interpreter")?;
            let scores = self.read_scores()?;

            let count = scores.len().min(self.output_len);
            if count == 0 {
                return Err(anyhow!("output tensor is empty"));
            }

            let mut indices: Vec<usize> = (0..count).collect();
            indices.sort_by(|a, b| {
                scores[*b]
                    .partial_cmp(&scores[*a])
                    .unwrap_or(Ordering::Equal)
            });

            let mut top = Vec::new();
            for idx in indices.into_iter().take(self.top_k.min(count)) {
                let label = self
                    .labels
                    .get(idx)
                    .cloned()
                    .unwrap_or_else(|| format!("class_{idx}"));
                let category = categorize_label(&label);
                top.push(ClassifiedLabel {
                    index: idx,
                    label,
                    score: scores[idx],
                    category,
                });
            }

            Ok(Prediction { top })
        }

        fn write_input(&mut self, window: &AudioWindow) -> Result<()> {
            match self.input_encoding {
                TensorEncoding::F32 => {
                    let input = self
                        .interpreter
                        .tensor_data_mut::<f32>(self.input_index)
                        .context("failed getting mutable f32 input tensor")?;
                    fill_f32_input(input, &window.samples, self.input_len);
                }
                TensorEncoding::U8 => {
                    let input = self
                        .interpreter
                        .tensor_data_mut::<u8>(self.input_index)
                        .context("failed getting mutable u8 input tensor")?;
                    fill_u8_input(input, &window.samples, self.input_len);
                }
            }
            Ok(())
        }

        fn read_scores(&self) -> Result<Vec<f32>> {
            match self.output_encoding {
                TensorEncoding::F32 => {
                    let data = self
                        .interpreter
                        .tensor_data::<f32>(self.output_index)
                        .context("failed reading f32 output tensor")?;
                    Ok(data.to_vec())
                }
                TensorEncoding::U8 => {
                    let data = self
                        .interpreter
                        .tensor_data::<u8>(self.output_index)
                        .context("failed reading u8 output tensor")?;
                    Ok(data.iter().map(|&v| v as f32 / 255.0).collect())
                }
            }
        }
    }

    fn detect_input_encoding(
        interpreter: &mut TfInterpreter,
        index: i32,
    ) -> Result<(usize, TensorEncoding)> {
        if let Ok(input) = interpreter.tensor_data_mut::<f32>(index) {
            return Ok((input.len(), TensorEncoding::F32));
        }
        if let Ok(input) = interpreter.tensor_data_mut::<u8>(index) {
            return Ok((input.len(), TensorEncoding::U8));
        }

        Err(anyhow!(
            "unsupported input tensor type; expected f32 or u8 at index {index}"
        ))
    }

    fn detect_output_encoding(
        interpreter: &TfInterpreter,
        index: i32,
    ) -> Result<(usize, TensorEncoding)> {
        if let Ok(output) = interpreter.tensor_data::<f32>(index) {
            return Ok((output.len(), TensorEncoding::F32));
        }
        if let Ok(output) = interpreter.tensor_data::<u8>(index) {
            return Ok((output.len(), TensorEncoding::U8));
        }

        Err(anyhow!(
            "unsupported output tensor type; expected f32 or u8 at index {index}"
        ))
    }
}

#[cfg(not(feature = "tflite-inference"))]
mod runtime {
    use super::*;

    pub struct EngineRuntime;

    impl EngineRuntime {
        pub fn new<P: AsRef<Path>>(
            _model_path: P,
            _labels: Vec<String>,
            _top_k: usize,
        ) -> Result<Self> {
            Err(anyhow!(
                "inference support not compiled. rebuild with `--features tflite-inference`"
            ))
        }

        pub fn expected_input_samples(&self) -> usize {
            0
        }

        pub fn predict(&mut self, _window: &AudioWindow) -> Result<Prediction> {
            Err(anyhow!(
                "inference support not compiled. rebuild with `--features tflite-inference`"
            ))
        }
    }
}

#[cfg(feature = "tflite-inference")]
fn fill_f32_input(dst: &mut [f32], src: &[f32], required: usize) {
    let effective = required.min(dst.len());
    let copy_len = src.len().min(effective);
    dst[..copy_len].copy_from_slice(&src[..copy_len]);
    for item in &mut dst[copy_len..effective] {
        *item = 0.0;
    }
}

#[cfg(feature = "tflite-inference")]
fn fill_u8_input(dst: &mut [u8], src: &[f32], required: usize) {
    let effective = required.min(dst.len());
    let copy_len = src.len().min(effective);
    for (idx, sample) in src.iter().take(copy_len).enumerate() {
        let clamped = sample.clamp(-1.0, 1.0);
        let normalized = ((clamped + 1.0) * 0.5 * 255.0).round();
        dst[idx] = normalized.clamp(0.0, 255.0) as u8;
    }
    for item in &mut dst[copy_len..effective] {
        *item = 128;
    }
}

fn load_labels<P: AsRef<Path>>(path: P) -> Result<Vec<String>> {
    let mut content = String::new();
    File::open(path.as_ref())
        .with_context(|| format!("failed to open labels file {}", path.as_ref().display()))?
        .read_to_string(&mut content)
        .with_context(|| format!("failed reading labels file {}", path.as_ref().display()))?;

    parse_labels_csv(&content)
}

fn parse_labels_csv(content: &str) -> Result<Vec<String>> {
    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_reader(content.as_bytes());

    let mut labels: Vec<String> = Vec::new();
    for record in rdr.records() {
        let record = record.context("invalid csv record in class map")?;
        let label = select_label_field(&record);
        if label.is_empty() {
            continue;
        }

        if let Some(idx) = parse_index_field(&record) {
            if idx >= labels.len() {
                labels.resize_with(idx + 1, String::new);
            }
            labels[idx] = label;
        } else {
            labels.push(label);
        }
    }

    if labels.is_empty() {
        return Err(anyhow!("class map did not produce any labels"));
    }

    for (idx, label) in labels.iter_mut().enumerate() {
        if label.is_empty() {
            *label = format!("class_{idx}");
        }
    }

    Ok(labels)
}

fn parse_index_field(record: &csv::StringRecord) -> Option<usize> {
    record.get(0)?.trim().parse::<usize>().ok()
}

fn select_label_field(record: &csv::StringRecord) -> String {
    record
        .get(2)
        .or_else(|| record.get(1))
        .or_else(|| record.get(0))
        .map(|field| field.trim().to_string())
        .unwrap_or_default()
}

#[cfg_attr(not(any(feature = "tflite-inference", test)), allow(dead_code))]
pub fn categorize_label(label: &str) -> SoundCategory {
    let lowered = label.to_ascii_lowercase();

    const FADE_KEYWORDS: &[&str] = &[
        "slam", "knock", "shout", "scream", "engine", "siren", "horn", "alarm", "bang", "crash",
        "laughter", "yell", "screech", "clap",
    ];
    if FADE_KEYWORDS.iter().any(|needle| lowered.contains(needle)) {
        return SoundCategory::Fade;
    }

    const ORGANIC_KEYWORDS: &[&str] = &[
        "silence",
        "breath",
        "wind",
        "rain",
        "bird",
        "cricket",
        "insect",
        "rustle",
        "stream",
        "water",
        "fire",
        "frog",
        "purr",
        "heartbeat",
    ];
    if ORGANIC_KEYWORDS
        .iter()
        .any(|needle| lowered.contains(needle))
    {
        return SoundCategory::Organic;
    }

    SoundCategory::Neutral
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn categorizes_fade_and_organic_labels() {
        assert_eq!(categorize_label("Car horn"), SoundCategory::Fade);
        assert_eq!(categorize_label("Wind in trees"), SoundCategory::Organic);
        assert_eq!(categorize_label("Unknown class"), SoundCategory::Neutral);
    }

    #[test]
    fn parses_yamnet_style_class_map() {
        let csv = "index,mid,display_name\n0,/m/028v0c,Silence\n1,/m/07p6fty,Engine\n";
        let labels = parse_labels_csv(csv).expect("labels");
        assert_eq!(labels[0], "Silence");
        assert_eq!(labels[1], "Engine");
    }
}
