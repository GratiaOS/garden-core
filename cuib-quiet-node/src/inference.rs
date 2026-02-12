use std::fmt::{Display, Formatter};
use std::fs::File;
use std::io::Read;
use std::path::Path;

use anyhow::{Context, Result, anyhow};
use csv::ReaderBuilder;

use crate::buffer::AudioWindow;

#[cfg_attr(
    not(any(feature = "tflite-legacy", feature = "tflite-runtime-v2", test)),
    allow(dead_code)
)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BackendKind {
    Legacy,
    V2,
    Auto,
}

impl Display for BackendKind {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            BackendKind::Legacy => write!(f, "legacy"),
            BackendKind::V2 => write!(f, "v2"),
            BackendKind::Auto => write!(f, "auto"),
        }
    }
}

impl std::str::FromStr for BackendKind {
    type Err = anyhow::Error;

    fn from_str(value: &str) -> Result<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "legacy" => Ok(BackendKind::Legacy),
            "v2" => Ok(BackendKind::V2),
            "auto" => Ok(BackendKind::Auto),
            other => Err(anyhow!(
                "invalid backend '{other}'. expected one of: legacy, v2, auto"
            )),
        }
    }
}

pub struct InferenceEngine {
    inner: runtime::EngineRuntime,
}

impl InferenceEngine {
    pub fn new<P: AsRef<Path>>(
        model_path: P,
        labels_path: P,
        top_k: usize,
        backend: BackendKind,
    ) -> Result<Self> {
        let labels = load_labels(labels_path)?;
        let inner = runtime::EngineRuntime::new(model_path, labels, top_k, backend)?;
        Ok(Self { inner })
    }

    pub fn expected_input_samples(&self) -> usize {
        self.inner.expected_input_samples()
    }

    pub fn predict(&mut self, window: &AudioWindow) -> Result<Prediction> {
        self.inner.predict(window)
    }
}

#[cfg(any(feature = "tflite-legacy", feature = "tflite-runtime-v2"))]
mod runtime {
    use std::cmp::Ordering;

    use super::*;

    #[cfg(feature = "tflite-legacy")]
    use std::sync::Arc;
    #[cfg(feature = "tflite-legacy")]
    use tflite::ops::builtin::BuiltinOpResolver;
    #[cfg(feature = "tflite-legacy")]
    use tflite::{FlatBufferModel, Interpreter, InterpreterBuilder};
    #[cfg(feature = "tflite-legacy")]
    use tracing::warn;

    #[cfg(feature = "tflite-legacy")]
    type TfInterpreter = Interpreter<'static, Arc<BuiltinOpResolver>>;

    #[derive(Debug, Clone, Copy)]
    enum TensorEncoding {
        F32,
        U8,
    }

    pub enum EngineRuntime {
        #[cfg(feature = "tflite-legacy")]
        Legacy(LegacyRuntime),
        V2(V2Runtime),
    }

    #[cfg(feature = "tflite-legacy")]
    pub struct LegacyRuntime {
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
            backend: BackendKind,
        ) -> Result<Self> {
            let model_path = model_path.as_ref();

            match backend {
                BackendKind::Legacy => {
                    #[cfg(feature = "tflite-legacy")]
                    {
                        Ok(Self::Legacy(LegacyRuntime::new(model_path, labels, top_k)?))
                    }
                    #[cfg(not(feature = "tflite-legacy"))]
                    {
                        Err(anyhow!(
                            "legacy inference backend is not compiled. rebuild with `--features tflite-legacy`"
                        ))
                    }
                }
                BackendKind::V2 => Ok(Self::V2(V2Runtime::new(model_path, labels, top_k)?)),
                BackendKind::Auto => match V2Runtime::new(model_path, labels.clone(), top_k) {
                    Ok(v2) => Ok(Self::V2(v2)),
                    Err(v2_error) => {
                        #[cfg(feature = "tflite-legacy")]
                        {
                            warn!(
                                error = %v2_error,
                                "inference backend auto: v2 unavailable, falling back to legacy"
                            );
                            Ok(Self::Legacy(LegacyRuntime::new(model_path, labels, top_k)?))
                        }
                        #[cfg(not(feature = "tflite-legacy"))]
                        {
                            Err(anyhow!(
                                "inference backend auto failed; v2 unavailable and legacy not compiled: {v2_error}"
                            ))
                        }
                    }
                },
            }
        }

        pub fn expected_input_samples(&self) -> usize {
            match self {
                #[cfg(feature = "tflite-legacy")]
                Self::Legacy(runtime) => runtime.expected_input_samples(),
                Self::V2(runtime) => runtime.expected_input_samples(),
            }
        }

        pub fn predict(&mut self, window: &AudioWindow) -> Result<Prediction> {
            match self {
                #[cfg(feature = "tflite-legacy")]
                Self::Legacy(runtime) => runtime.predict(window),
                Self::V2(runtime) => runtime.predict(window),
            }
        }
    }

    #[cfg(feature = "tflite-legacy")]
    impl LegacyRuntime {
        pub fn new<P: AsRef<Path>>(
            model_path: P,
            labels: Vec<String>,
            top_k: usize,
        ) -> Result<Self> {
            validate_tflite_flatbuffer(model_path.as_ref())?;

            let model =
                FlatBufferModel::build_from_file(model_path.as_ref()).with_context(|| {
                    format!("failed to load model {}", model_path.as_ref().display())
                })?;
            let resolver = Arc::new(BuiltinOpResolver::default());
            let builder = InterpreterBuilder::new(model, resolver)
                .context("failed to construct tflite interpreter builder")?;
            let mut interpreter = builder
                .build()
                .map_err(|err| {
                    let detail = err.to_string();
                    if detail.contains("Op builtin_code out of range") {
                        anyhow!(
                            "{detail}. model likely requires newer TensorFlow Lite than bundled runtime (tflite crate 0.9.8)"
                        )
                    } else {
                        err.into()
                    }
                })
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

            Ok(LegacyRuntime {
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

            build_prediction(&self.labels, &scores, self.top_k, self.output_len)
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

    #[cfg(feature = "tflite-runtime-v2")]
    pub struct V2Runtime {
        _runtime: tflite_dyn::TfLite,
        interpreter: tflite_dyn::Interpreter,
        labels: Vec<String>,
        input_len: usize,
        output_len: usize,
        input_encoding: TensorEncoding,
        output_encoding: TensorEncoding,
        top_k: usize,
    }

    #[cfg(feature = "tflite-runtime-v2")]
    impl V2Runtime {
        pub fn new<P: AsRef<Path>>(
            model_path: P,
            labels: Vec<String>,
            top_k: usize,
        ) -> Result<Self> {
            use tflite_dyn::sys::TfLiteType;

            validate_tflite_flatbuffer(model_path.as_ref())?;

            let runtime = load_tflite_runtime()?;
            let model_bytes = std::fs::read(model_path.as_ref()).with_context(|| {
                format!("failed to read model {}", model_path.as_ref().display())
            })?;
            let model = runtime
                .model_create(model_bytes)
                .map_err(|err| anyhow!("failed to create tflite model: {err:?}"))?;

            let mut options = runtime.interpreter_options_create();
            options.set_num_threads(2);
            let mut interpreter = runtime.interpreter_create(model, options);
            interpreter
                .allocate_tensors()
                .map_err(|err| anyhow!("failed to allocate v2 tensors: {err:?}"))?;

            let input_tensor = interpreter
                .input_tensor(0)
                .ok_or_else(|| anyhow!("model has no input tensor at index 0"))?;
            let output_tensor = interpreter
                .output_tensor(0)
                .ok_or_else(|| anyhow!("model has no output tensor at index 0"))?;

            let input_encoding = match input_tensor.type_() {
                TfLiteType::Float32 => TensorEncoding::F32,
                TfLiteType::UInt8 => TensorEncoding::U8,
                other => {
                    return Err(anyhow!(
                        "unsupported v2 input tensor type: {other:?} (expected Float32 or UInt8)"
                    ));
                }
            };
            let output_encoding = match output_tensor.type_() {
                TfLiteType::Float32 => TensorEncoding::F32,
                TfLiteType::UInt8 => TensorEncoding::U8,
                other => {
                    return Err(anyhow!(
                        "unsupported v2 output tensor type: {other:?} (expected Float32 or UInt8)"
                    ));
                }
            };

            let input_len = dyn_tensor_element_count(&input_tensor, input_encoding)?;
            let output_len = dyn_tensor_element_count(&output_tensor, output_encoding)?;

            let mut labels = labels;
            if labels.len() < output_len {
                for idx in labels.len()..output_len {
                    labels.push(format!("class_{idx}"));
                }
            }

            tracing::info!(
                input_samples = input_len,
                output_classes = output_len,
                "v2 runtime ready"
            );

            Ok(Self {
                _runtime: runtime,
                interpreter,
                labels,
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
                .map_err(|err| anyhow!("failed invoking v2 interpreter: {err:?}"))?;
            let scores = self.read_scores()?;
            build_prediction(&self.labels, &scores, self.top_k, self.output_len)
        }

        fn write_input(&mut self, window: &AudioWindow) -> Result<()> {
            let mut input_tensor = self
                .interpreter
                .input_tensor(0)
                .ok_or_else(|| anyhow!("failed getting v2 input tensor at index 0"))?;
            let input = input_tensor
                .data_mut()
                .ok_or_else(|| anyhow!("failed getting mutable input bytes from v2 tensor"))?;

            match self.input_encoding {
                TensorEncoding::F32 => fill_f32_bytes(input, &window.samples, self.input_len),
                TensorEncoding::U8 => fill_u8_bytes(input, &window.samples, self.input_len),
            }
        }

        fn read_scores(&self) -> Result<Vec<f32>> {
            let output_tensor = self
                .interpreter
                .output_tensor(0)
                .ok_or_else(|| anyhow!("failed getting v2 output tensor at index 0"))?;
            let output = output_tensor
                .data()
                .ok_or_else(|| anyhow!("failed getting output bytes from v2 tensor"))?;

            match self.output_encoding {
                TensorEncoding::F32 => read_f32_bytes(output, self.output_len),
                TensorEncoding::U8 => {
                    let count = self.output_len.min(output.len());
                    Ok(output[..count].iter().map(|&v| v as f32 / 255.0).collect())
                }
            }
        }
    }

    #[cfg(not(feature = "tflite-runtime-v2"))]
    pub struct V2Runtime;

    #[cfg(not(feature = "tflite-runtime-v2"))]
    impl V2Runtime {
        pub fn new<P: AsRef<Path>>(
            _model_path: P,
            _labels: Vec<String>,
            _top_k: usize,
        ) -> Result<Self> {
            Err(anyhow!(
                "inference backend v2 is not compiled. rebuild with `--features tflite-runtime-v2`"
            ))
        }

        pub fn expected_input_samples(&self) -> usize {
            0
        }

        pub fn predict(&mut self, _window: &AudioWindow) -> Result<Prediction> {
            Err(anyhow!(
                "inference backend v2 is not compiled. rebuild with `--features tflite-runtime-v2`"
            ))
        }
    }

    fn build_prediction(
        labels: &[String],
        scores: &[f32],
        top_k: usize,
        output_len: usize,
    ) -> Result<Prediction> {
        let count = scores.len().min(output_len);
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
        for idx in indices.into_iter().take(top_k.min(count)) {
            let label = labels
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

    #[cfg(feature = "tflite-legacy")]
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

    #[cfg(feature = "tflite-legacy")]
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

    fn validate_tflite_flatbuffer(path: &Path) -> Result<()> {
        let mut header = [0u8; 8];
        let mut file =
            File::open(path).with_context(|| format!("failed to open model {}", path.display()))?;
        file.read_exact(&mut header)
            .with_context(|| format!("failed to read model header {}", path.display()))?;

        if &header[4..8] != b"TFL3" {
            return Err(anyhow!(
                "model file is not a valid .tflite flatbuffer (missing TFL3 magic at bytes 4..8)"
            ));
        }

        Ok(())
    }

    #[cfg(feature = "tflite-runtime-v2")]
    fn load_tflite_runtime() -> Result<tflite_dyn::TfLite> {
        let mut candidates: Vec<String> = Vec::new();
        if let Ok(path) = std::env::var("TFLITE_C_LIB_PATH") {
            let trimmed = path.trim();
            if !trimmed.is_empty() {
                candidates.push(trimmed.to_string());
            }
        }

        #[cfg(target_os = "linux")]
        {
            // Prefer absolute paths discovered by ldconfig to avoid fragile soname lookups.
            if let Ok(output) = std::process::Command::new("sh")
                .arg("-c")
                .arg("ldconfig -p 2>/dev/null | awk '/libtensorflowlite_c\\.so|libtensorflowlite\\.so|libtensorflow-lite\\.so|libedgetpu\\.so/{print $NF}'")
                .output()
            {
                if output.status.success() {
                    let discovered = String::from_utf8_lossy(&output.stdout);
                    for line in discovered.lines() {
                        let path = line.trim();
                        if !path.is_empty() {
                            candidates.push(path.to_string());
                        }
                    }
                }
            }
        }

        if cfg!(target_os = "linux") {
            candidates.extend([
                "libtensorflowlite_c.so".to_string(),
                "libtensorflowlite_c.so.2".to_string(),
                "libtensorflowlite.so".to_string(),
                "libtensorflowlite.so.2".to_string(),
                "libtensorflow-lite.so".to_string(),
                "libtensorflow-lite.so.2".to_string(),
                "libtensorflow-lite.so.2.14.1".to_string(),
                "libedgetpu.so.1".to_string(),
                "/usr/lib/aarch64-linux-gnu/libtensorflowlite_c.so".to_string(),
                "/usr/lib/aarch64-linux-gnu/libtensorflowlite.so".to_string(),
                "/usr/lib/aarch64-linux-gnu/libtensorflow-lite.so".to_string(),
                "/usr/lib/aarch64-linux-gnu/libtensorflow-lite.so.2".to_string(),
                "/usr/lib/aarch64-linux-gnu/libtensorflow-lite.so.2.14.1".to_string(),
                "/usr/lib/aarch64-linux-gnu/libedgetpu.so.1".to_string(),
                "/usr/local/lib/libtensorflowlite_c.so".to_string(),
                "/usr/local/lib/libtensorflowlite.so".to_string(),
                "/usr/local/lib/libtensorflow-lite.so".to_string(),
            ]);
        } else if cfg!(target_os = "macos") {
            candidates.extend([
                "libtensorflowlite_c.dylib".to_string(),
                "libtensorflowlite.dylib".to_string(),
                "/usr/local/lib/libtensorflowlite_c.dylib".to_string(),
                "/usr/local/lib/libtensorflowlite.dylib".to_string(),
                "/opt/homebrew/lib/libtensorflowlite_c.dylib".to_string(),
                "/opt/homebrew/lib/libtensorflowlite.dylib".to_string(),
            ]);
        } else {
            candidates.push("libtensorflowlite_c.so".to_string());
            candidates.push("libtensorflowlite.so".to_string());
        }

        // De-duplicate while preserving first-hit preference.
        {
            let mut seen = std::collections::HashSet::<String>::new();
            candidates.retain(|entry| seen.insert(entry.clone()));
        }

        let mut errors: Vec<String> = Vec::new();
        for candidate in &candidates {
            // tflite-dyn currently unwraps internally on some load paths; guard it.
            let attempt = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                tflite_dyn::TfLite::load(candidate)
            }));
            match attempt {
                Ok(Ok(runtime)) => return Ok(runtime),
                Ok(Err(err)) => errors.push(format!("{candidate}: {err:?}")),
                Err(_) => errors.push(format!("{candidate}: panic while loading runtime")),
            }
        }

        Err(anyhow!(
            "failed to load TensorFlow Lite runtime. set TFLITE_C_LIB_PATH or install libtensorflowlite_c/libtensorflowlite/libtensorflow-lite. tried: {}. errors: {}",
            candidates.join(", "),
            errors.join(" | ")
        ))
    }

    #[cfg(feature = "tflite-runtime-v2")]
    fn dyn_tensor_element_count(
        tensor: &tflite_dyn::Tensor<'_>,
        encoding: TensorEncoding,
    ) -> Result<usize> {
        let byte_len = tensor
            .data()
            .map(|bytes| bytes.len())
            .ok_or_else(|| anyhow!("tensor data pointer is null"))?;

        let from_bytes = match encoding {
            TensorEncoding::F32 => {
                if byte_len % std::mem::size_of::<f32>() != 0 {
                    return Err(anyhow!(
                        "tensor byte length {byte_len} is not aligned to f32 size"
                    ));
                }
                byte_len / std::mem::size_of::<f32>()
            }
            TensorEncoding::U8 => byte_len,
        };

        let dims = (0..tensor.num_dims())
            .map(|idx| tensor.dim(idx))
            .collect::<Vec<_>>();
        let from_dims = dims
            .iter()
            .try_fold(1usize, |acc, dim| {
                if *dim <= 0 {
                    return None;
                }
                acc.checked_mul(*dim as usize)
            })
            .unwrap_or(from_bytes);

        Ok(from_dims.max(1))
    }

    #[cfg(feature = "tflite-runtime-v2")]
    fn fill_f32_bytes(dst: &mut [u8], src: &[f32], required: usize) -> Result<()> {
        let needed = required
            .checked_mul(std::mem::size_of::<f32>())
            .ok_or_else(|| anyhow!("input size overflow while preparing f32 tensor"))?;
        if dst.len() < needed {
            return Err(anyhow!(
                "input tensor too small for f32 data: have {} bytes, need {needed}",
                dst.len()
            ));
        }

        let copy_len = src.len().min(required);
        for (idx, sample) in src.iter().take(copy_len).enumerate() {
            let offset = idx * 4;
            dst[offset..offset + 4].copy_from_slice(&sample.to_ne_bytes());
        }
        for idx in copy_len..required {
            let offset = idx * 4;
            dst[offset..offset + 4].copy_from_slice(&0.0f32.to_ne_bytes());
        }

        Ok(())
    }

    #[cfg(feature = "tflite-runtime-v2")]
    fn fill_u8_bytes(dst: &mut [u8], src: &[f32], required: usize) -> Result<()> {
        if dst.len() < required {
            return Err(anyhow!(
                "input tensor too small for u8 data: have {} bytes, need {required}",
                dst.len()
            ));
        }

        let copy_len = src.len().min(required);
        for (idx, sample) in src.iter().take(copy_len).enumerate() {
            let clamped = sample.clamp(-1.0, 1.0);
            let normalized = ((clamped + 1.0) * 0.5 * 255.0).round();
            dst[idx] = normalized.clamp(0.0, 255.0) as u8;
        }
        for item in &mut dst[copy_len..required] {
            *item = 128;
        }

        Ok(())
    }

    #[cfg(feature = "tflite-runtime-v2")]
    fn read_f32_bytes(src: &[u8], expected_len: usize) -> Result<Vec<f32>> {
        let needed = expected_len
            .checked_mul(std::mem::size_of::<f32>())
            .ok_or_else(|| anyhow!("output size overflow while parsing f32 tensor"))?;
        if src.len() < needed {
            return Err(anyhow!(
                "output tensor too small for f32 data: have {} bytes, need {needed}",
                src.len()
            ));
        }

        let mut out = Vec::with_capacity(expected_len);
        for chunk in src[..needed].chunks_exact(4) {
            out.push(f32::from_ne_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]));
        }
        Ok(out)
    }
}

#[cfg(not(any(feature = "tflite-legacy", feature = "tflite-runtime-v2")))]
mod runtime {
    use super::*;

    pub struct EngineRuntime;

    impl EngineRuntime {
        pub fn new<P: AsRef<Path>>(
            _model_path: P,
            _labels: Vec<String>,
            _top_k: usize,
            _backend: BackendKind,
        ) -> Result<Self> {
            Err(anyhow!(
                "inference support not compiled. rebuild with `--features tflite-inference` or `--features tflite-legacy`"
            ))
        }

        pub fn expected_input_samples(&self) -> usize {
            0
        }

        pub fn predict(&mut self, _window: &AudioWindow) -> Result<Prediction> {
            Err(anyhow!(
                "inference support not compiled. rebuild with `--features tflite-inference` or `--features tflite-legacy`"
            ))
        }
    }
}

#[cfg(feature = "tflite-legacy")]
fn fill_f32_input(dst: &mut [f32], src: &[f32], required: usize) {
    let effective = required.min(dst.len());
    let copy_len = src.len().min(effective);
    dst[..copy_len].copy_from_slice(&src[..copy_len]);
    for item in &mut dst[copy_len..effective] {
        *item = 0.0;
    }
}

#[cfg(feature = "tflite-legacy")]
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

#[cfg_attr(
    not(any(feature = "tflite-legacy", feature = "tflite-runtime-v2", test)),
    allow(dead_code)
)]
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
    fn parses_backend_kind() {
        assert_eq!(
            "legacy".parse::<BackendKind>().expect("legacy backend"),
            BackendKind::Legacy
        );
        assert_eq!(
            "v2".parse::<BackendKind>().expect("v2 backend"),
            BackendKind::V2
        );
        assert_eq!(
            "auto".parse::<BackendKind>().expect("auto backend"),
            BackendKind::Auto
        );
        assert!("wat".parse::<BackendKind>().is_err());
    }

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
