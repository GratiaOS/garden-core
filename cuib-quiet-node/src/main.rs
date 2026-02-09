mod buffer;
mod fade;
mod inference;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{Context, Result, anyhow};
use buffer::{AudioWindow, CircularAudioBuffer};
use clap::Parser;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat, SampleRate, Stream, StreamConfig};
use fade::{FadeConfig, FadeEngine, FadeState};
use inference::InferenceEngine;
use tracing::{info, warn};

#[derive(Debug, Parser)]
#[command(name = "cuib-quiet-node")]
#[command(about = "Local audio ingester for Cuib Quiet Node")]
struct Args {
    /// Select input device by substring match (case-insensitive).
    #[arg(long)]
    device: Option<String>,

    /// Requested sample rate in Hz. Default targets 16000 for YAMNet path.
    #[arg(long)]
    sample_rate: Option<u32>,

    /// Force channel count. If omitted, first compatible input config is used.
    #[arg(long)]
    channels: Option<u16>,

    /// Report interval for level telemetry in milliseconds.
    #[arg(long, default_value_t = 1000)]
    report_ms: u64,

    /// Fixed window length in seconds for classifier-ready chunks.
    #[arg(long, default_value_t = 0.975)]
    window_secs: f32,

    /// Calibration duration in seconds. Set 0 to disable.
    #[arg(long, default_value_t = 300)]
    calibration_secs: u64,

    /// Sigma multiplier for abrupt-event threshold after calibration.
    #[arg(long, default_value_t = 3.0)]
    abrupt_sigma: f32,

    /// Minimum dB margin above baseline RMS for abrupt-event threshold.
    #[arg(long, default_value_t = 6.0)]
    min_margin_db: f32,

    /// Path to .tflite model. Requires --labels-path.
    #[arg(long)]
    model_path: Option<String>,

    /// Path to class-map csv. Requires --model-path.
    #[arg(long)]
    labels_path: Option<String>,

    /// Number of top classes to report.
    #[arg(long, default_value_t = 3)]
    top_k: usize,

    /// Threshold for entering DeepQuiet state (0.0-1.0).
    #[arg(long, default_value_t = 0.70)]
    fade_deep_threshold: f32,

    /// Threshold for entering GentleFilter state (0.0-1.0).
    #[arg(long, default_value_t = 0.35)]
    fade_gentle_threshold: f32,

    /// Night sensitivity multiplier for thresholds (0.0-1.0).
    #[arg(long, default_value_t = 0.70)]
    fade_night_factor: f32,

    /// Night start hour (local time, 0-23).
    #[arg(long, default_value_t = 20)]
    fade_night_start: u32,

    /// Night end hour (local time, 0-23).
    #[arg(long, default_value_t = 6)]
    fade_night_end: u32,
}

#[derive(Debug, Clone, Default)]
struct WindowStats {
    sample_count: u64,
    sum_squares: f64,
    peak: f32,
    clip_count: u64,
}

impl WindowStats {
    fn observe(&mut self, sample: f32) {
        let clamped = sample.clamp(-1.0, 1.0);
        let abs = clamped.abs();

        self.sample_count += 1;
        self.sum_squares += f64::from(clamped) * f64::from(clamped);
        if abs > self.peak {
            self.peak = abs;
        }
        if abs >= 0.999 {
            self.clip_count += 1;
        }
    }

    fn rms(&self) -> f32 {
        if self.sample_count == 0 {
            return 0.0;
        }
        (self.sum_squares / self.sample_count as f64).sqrt() as f32
    }
}

#[derive(Debug)]
struct SharedAudioState {
    report_stats: WindowStats,
    window_buffer: CircularAudioBuffer,
    ready_windows: Vec<AudioWindow>,
}

impl SharedAudioState {
    fn new(sample_rate: u32, channels: u16, window_secs: f32) -> Result<Self> {
        Ok(Self {
            report_stats: WindowStats::default(),
            window_buffer: CircularAudioBuffer::new(sample_rate, channels, window_secs)
                .context("failed to initialize circular audio window buffer")?,
            ready_windows: Vec::new(),
        })
    }

    fn ingest_interleaved(&mut self, interleaved: &[f32]) {
        for &sample in interleaved {
            self.report_stats.observe(sample);
        }

        self.window_buffer
            .push_interleaved(interleaved, &mut self.ready_windows);
    }

    fn take_snapshot(&mut self) -> (WindowStats, Vec<AudioWindow>) {
        (
            std::mem::take(&mut self.report_stats),
            std::mem::take(&mut self.ready_windows),
        )
    }
}

#[derive(Debug, Clone)]
struct SelectedConfig {
    config: StreamConfig,
    sample_format: SampleFormat,
}

#[derive(Debug, Clone)]
struct CalibrationProfile {
    window_count: u64,
    mean_rms: f32,
    std_rms: f32,
    peak_max: f32,
    clip_total: u64,
}

impl CalibrationProfile {
    fn threshold_rms(&self, sigma: f32, min_margin_db: f32) -> f32 {
        let sigma_term = self.mean_rms + sigma.max(0.0) * self.std_rms;
        let db_factor = db_to_linear(min_margin_db.max(0.0));
        let db_term = self.mean_rms * db_factor;
        sigma_term.max(db_term).max(0.01)
    }
}

#[derive(Debug, Clone, Default)]
struct CalibrationAccumulator {
    window_count: u64,
    mean_rms: f64,
    m2_rms: f64,
    peak_max: f32,
    clip_total: u64,
}

impl CalibrationAccumulator {
    fn observe(&mut self, window: &AudioWindow) {
        self.window_count += 1;
        let rms = window.rms as f64;
        let delta = rms - self.mean_rms;
        self.mean_rms += delta / self.window_count as f64;
        let delta2 = rms - self.mean_rms;
        self.m2_rms += delta * delta2;

        if window.peak > self.peak_max {
            self.peak_max = window.peak;
        }
        self.clip_total += window.clip_count;
    }

    fn finalize(self) -> CalibrationProfile {
        let variance = if self.window_count > 1 {
            self.m2_rms / (self.window_count as f64 - 1.0)
        } else {
            0.0
        };

        CalibrationProfile {
            window_count: self.window_count,
            mean_rms: self.mean_rms as f32,
            std_rms: variance.max(0.0).sqrt() as f32,
            peak_max: self.peak_max,
            clip_total: self.clip_total,
        }
    }
}

#[derive(Debug, Clone)]
enum CalibrationState {
    Disabled,
    Running {
        started: Instant,
        duration: Duration,
        acc: CalibrationAccumulator,
    },
    Complete(CalibrationProfile),
}

impl CalibrationState {
    fn new(calibration_secs: u64) -> Self {
        if calibration_secs == 0 {
            return CalibrationState::Disabled;
        }

        CalibrationState::Running {
            started: Instant::now(),
            duration: Duration::from_secs(calibration_secs),
            acc: CalibrationAccumulator::default(),
        }
    }

    fn observe_window(&mut self, window: &AudioWindow) -> Option<CalibrationProfile> {
        match self {
            CalibrationState::Running {
                started,
                duration,
                acc,
            } => {
                acc.observe(window);
                if started.elapsed() >= *duration {
                    let profile = acc.clone().finalize();
                    *self = CalibrationState::Complete(profile.clone());
                    return Some(profile);
                }
            }
            CalibrationState::Disabled | CalibrationState::Complete(_) => {}
        }

        None
    }

    fn profile(&self) -> Option<&CalibrationProfile> {
        match self {
            CalibrationState::Complete(profile) => Some(profile),
            CalibrationState::Disabled | CalibrationState::Running { .. } => None,
        }
    }
}

fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let args = Args::parse();
    let host = cpal::default_host();

    let device = select_input_device(&host, args.device.as_deref())?;
    let selected = select_stream_config(&device, &args)?;

    let device_name = device
        .name()
        .unwrap_or_else(|_| "<unknown-input-device>".to_string());
    info!(
        device = %device_name,
        sample_rate = selected.config.sample_rate.0,
        channels = selected.config.channels,
        format = ?selected.sample_format,
        window_secs = args.window_secs,
        calibration_secs = args.calibration_secs,
        "input stream selected"
    );

    let shared_state = Arc::new(Mutex::new(
        SharedAudioState::new(
            selected.config.sample_rate.0,
            selected.config.channels,
            args.window_secs,
        )
        .context("failed to build shared audio state")?,
    ));

    let stream = build_input_stream(&device, &selected, Arc::clone(&shared_state))?;
    stream.play().context("failed to start input stream")?;

    let mut inference = init_inference_engine(&args)?;
    let fade_engine = FadeEngine::with_config(build_fade_config(&args));

    let running = Arc::new(AtomicBool::new(true));
    {
        let running = Arc::clone(&running);
        ctrlc::set_handler(move || {
            running.store(false, Ordering::Relaxed);
        })
        .context("failed to install ctrl-c handler")?;
    }

    let mut calibration_state = CalibrationState::new(args.calibration_secs);
    let report_every = Duration::from_millis(args.report_ms.max(100));

    info!("audio ingester started");
    while running.load(Ordering::Relaxed) {
        thread::sleep(report_every);

        let (snapshot, windows) = take_audio_snapshot(&shared_state);
        report_window_stats(&snapshot);

        for window in &windows {
            if let Some(profile) = calibration_state.observe_window(window) {
                info!(
                    windows = profile.window_count,
                    mean_rms = format_args!("{:.5}", profile.mean_rms),
                    std_rms = format_args!("{:.5}", profile.std_rms),
                    peak = format_args!("{:.5}", profile.peak_max),
                    clips = profile.clip_total,
                    "auto-calibration complete"
                );
            }

            let mut abrupt_candidate = false;
            if let Some(profile) = calibration_state.profile() {
                let threshold = profile.threshold_rms(args.abrupt_sigma, args.min_margin_db);
                if window.rms >= threshold {
                    abrupt_candidate = true;
                    warn!(
                        rms = format_args!("{:.5}", window.rms),
                        threshold = format_args!("{:.5}", threshold),
                        peak = format_args!("{:.5}", window.peak),
                        clips = window.clip_count,
                        samples = window.samples.len(),
                        sample_rate = window.sample_rate,
                        "abrupt-event-candidate"
                    );
                }
            }

            if let Some(engine) = inference.as_mut() {
                match engine.predict(window) {
                    Ok(prediction) => {
                        let decision = fade_engine.decide(&prediction);
                        let final_state =
                            elevate_with_abrupt_candidate(decision.state, abrupt_candidate);

                        if abrupt_candidate || final_state != FadeState::Normal {
                            if let Some(top) = prediction.top.first() {
                                warn!(
                                    top_label = %top.label,
                                    top_index = top.index,
                                    top_score = format_args!("{:.3}", top.score),
                                    top_category = %top.category,
                                    action = match final_state {
                                        FadeState::DeepQuiet => "deep_quiet",
                                        FadeState::GentleFilter => "gentle_filter",
                                        FadeState::Normal => "observe",
                                    },
                                    fade_state = ?final_state,
                                    fade_confidence = format_args!("{:.3}", decision.confidence),
                                    fade_triggered_by = %decision.triggered_by.as_deref().unwrap_or("<none>"),
                                    fade_reason = %decision.reason,
                                    abrupt_candidate,
                                    top = %prediction.summary(),
                                    "fade-decision"
                                );
                            }
                        }
                    }
                    Err(err) => {
                        warn!(error = %err, "inference failed for current window");
                    }
                }
            }
        }
    }

    drop(stream);
    info!("audio ingester stopped");
    Ok(())
}

fn init_inference_engine(args: &Args) -> Result<Option<InferenceEngine>> {
    match (&args.model_path, &args.labels_path) {
        (None, None) => {
            info!("inference disabled: no model path provided");
            Ok(None)
        }
        (Some(_), None) | (None, Some(_)) => Err(anyhow!(
            "both --model-path and --labels-path are required to enable inference"
        )),
        (Some(model_path), Some(labels_path)) => {
            let engine =
                InferenceEngine::new(model_path, labels_path, args.top_k).with_context(|| {
                    format!("failed initializing inference from model={model_path}")
                })?;
            info!(
                expected_samples = engine.expected_input_samples(),
                top_k = args.top_k,
                "inference engine ready"
            );
            Ok(Some(engine))
        }
    }
}

fn select_input_device(host: &cpal::Host, device_query: Option<&str>) -> Result<Device> {
    if let Some(query) = device_query {
        let query_lower = query.to_ascii_lowercase();
        let mut devices = host
            .input_devices()
            .context("failed to enumerate input devices")?;
        if let Some(found) = devices.find(|device| {
            device
                .name()
                .map(|name| name.to_ascii_lowercase().contains(&query_lower))
                .unwrap_or(false)
        }) {
            return Ok(found);
        }

        let available = list_input_device_names(host)?;
        return Err(anyhow!(
            "input device matching '{query}' not found. available: {available}"
        ));
    }

    host.default_input_device().ok_or_else(|| {
        anyhow!(
            "no default input device available. attach microphone or pass --device. available: {}",
            list_input_device_names(host).unwrap_or_else(|_| "<unable-to-enumerate>".to_string())
        )
    })
}

fn list_input_device_names(host: &cpal::Host) -> Result<String> {
    let names = host
        .input_devices()
        .context("failed to enumerate input devices")?
        .map(|device| device.name().unwrap_or_else(|_| "<unknown>".to_string()))
        .collect::<Vec<_>>();
    Ok(names.join(", "))
}

fn select_stream_config(device: &Device, args: &Args) -> Result<SelectedConfig> {
    let preferred_rate = args.sample_rate.unwrap_or(16_000);
    let mut choices = Vec::new();

    for supported in device
        .supported_input_configs()
        .context("failed to read supported input configs")?
    {
        let channels = supported.channels();
        if let Some(requested_channels) = args.channels {
            if requested_channels != channels {
                continue;
            }
        }

        let min_rate = supported.min_sample_rate().0;
        let max_rate = supported.max_sample_rate().0;
        let selected_rate = if preferred_rate >= min_rate && preferred_rate <= max_rate {
            preferred_rate
        } else if args.sample_rate.is_some() {
            continue;
        } else {
            max_rate
        };

        choices.push(SelectedConfig {
            config: StreamConfig {
                channels,
                sample_rate: SampleRate(selected_rate),
                buffer_size: cpal::BufferSize::Default,
            },
            sample_format: supported.sample_format(),
        });
    }

    let selected = choices
        .into_iter()
        .max_by_key(|choice| {
            (
                sample_format_priority(choice.sample_format),
                choice.config.channels,
                choice.config.sample_rate.0,
            )
        })
        .ok_or_else(|| {
            anyhow!(
                "no compatible input configuration for channels={:?}, sample_rate={:?}",
                args.channels,
                args.sample_rate
            )
        })?;

    Ok(selected)
}

fn sample_format_priority(sample_format: SampleFormat) -> u8 {
    match sample_format {
        SampleFormat::F32 => 4,
        SampleFormat::F64 => 3,
        SampleFormat::I16 => 2,
        SampleFormat::U16 => 1,
        _ => 0,
    }
}

fn build_input_stream(
    device: &Device,
    selected: &SelectedConfig,
    shared_state: Arc<Mutex<SharedAudioState>>,
) -> Result<Stream> {
    let err_fn = |err| warn!(error = %err, "input stream error");

    let stream = match selected.sample_format {
        SampleFormat::F32 => build_stream_f32(device, &selected.config, shared_state, err_fn),
        SampleFormat::F64 => build_stream_f64(device, &selected.config, shared_state, err_fn),
        SampleFormat::I16 => build_stream_i16(device, &selected.config, shared_state, err_fn),
        SampleFormat::U16 => build_stream_u16(device, &selected.config, shared_state, err_fn),
        unsupported => {
            return Err(anyhow!(
                "unsupported sample format: {unsupported:?}. supported in this build: f32,f64,i16,u16"
            ));
        }
    }
    .context("failed to build input stream")?;

    Ok(stream)
}

fn build_stream_f32(
    device: &Device,
    config: &StreamConfig,
    shared_state: Arc<Mutex<SharedAudioState>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    Ok(device.build_input_stream(
        config,
        move |data: &[f32], _| ingest_samples(&shared_state, data),
        err_fn,
        None,
    )?)
}

fn build_stream_f64(
    device: &Device,
    config: &StreamConfig,
    shared_state: Arc<Mutex<SharedAudioState>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    let mut scratch = Vec::<f32>::new();
    Ok(device.build_input_stream(
        config,
        move |data: &[f64], _| {
            scratch.clear();
            scratch.extend(data.iter().map(|&sample| sample as f32));
            ingest_samples(&shared_state, &scratch);
        },
        err_fn,
        None,
    )?)
}

fn build_stream_i16(
    device: &Device,
    config: &StreamConfig,
    shared_state: Arc<Mutex<SharedAudioState>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    let mut scratch = Vec::<f32>::new();
    Ok(device.build_input_stream(
        config,
        move |data: &[i16], _| {
            scratch.clear();
            scratch.extend(data.iter().map(|&sample| sample as f32 / i16::MAX as f32));
            ingest_samples(&shared_state, &scratch);
        },
        err_fn,
        None,
    )?)
}

fn build_stream_u16(
    device: &Device,
    config: &StreamConfig,
    shared_state: Arc<Mutex<SharedAudioState>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    let mut scratch = Vec::<f32>::new();
    Ok(device.build_input_stream(
        config,
        move |data: &[u16], _| {
            scratch.clear();
            scratch.extend(
                data.iter()
                    .map(|&sample| (sample as f32 / u16::MAX as f32) * 2.0 - 1.0),
            );
            ingest_samples(&shared_state, &scratch);
        },
        err_fn,
        None,
    )?)
}

fn ingest_samples(shared_state: &Arc<Mutex<SharedAudioState>>, interleaved: &[f32]) {
    if let Ok(mut lock) = shared_state.lock() {
        lock.ingest_interleaved(interleaved);
    }
}

fn take_audio_snapshot(
    shared_state: &Arc<Mutex<SharedAudioState>>,
) -> (WindowStats, Vec<AudioWindow>) {
    if let Ok(mut lock) = shared_state.lock() {
        return lock.take_snapshot();
    }

    (WindowStats::default(), Vec::new())
}

fn report_window_stats(snapshot: &WindowStats) {
    if snapshot.sample_count == 0 {
        warn!("no audio samples captured in current interval");
        return;
    }

    let rms = snapshot.rms();
    let peak = snapshot.peak;
    let rms_db = if rms > 0.0 {
        20.0 * rms.log10()
    } else {
        f32::NEG_INFINITY
    };
    let peak_db = if peak > 0.0 {
        20.0 * peak.log10()
    } else {
        f32::NEG_INFINITY
    };

    info!(
        samples = snapshot.sample_count,
        clipped = snapshot.clip_count,
        rms = format_args!("{rms:.5}"),
        rms_dbfs = format_args!("{rms_db:.2}"),
        peak = format_args!("{peak:.5}"),
        peak_dbfs = format_args!("{peak_db:.2}"),
        "audio window"
    );
}

fn db_to_linear(db: f32) -> f32 {
    10.0_f32.powf(db / 20.0)
}

fn build_fade_config(args: &Args) -> FadeConfig {
    let deep_threshold = args.fade_deep_threshold.clamp(0.01, 1.0);
    let gentle_threshold = args.fade_gentle_threshold.clamp(0.0, deep_threshold);

    FadeConfig {
        deep_quiet_threshold: deep_threshold,
        gentle_filter_threshold: gentle_threshold,
        night_sensitivity_factor: args.fade_night_factor.clamp(0.05, 1.0),
        night_start_hour: args.fade_night_start % 24,
        night_end_hour: args.fade_night_end % 24,
        ..FadeConfig::default()
    }
}

fn elevate_with_abrupt_candidate(base: FadeState, abrupt_candidate: bool) -> FadeState {
    if !abrupt_candidate {
        return base;
    }

    match base {
        FadeState::DeepQuiet => FadeState::DeepQuiet,
        FadeState::GentleFilter | FadeState::Normal => FadeState::GentleFilter,
    }
}
