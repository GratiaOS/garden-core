use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use anyhow::{Context, Result, anyhow};
use clap::Parser;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat, SampleRate, Stream, StreamConfig};
use tracing::{info, warn};

#[derive(Debug, Parser)]
#[command(name = "cuib-quiet-node")]
#[command(about = "Local audio ingester for Cuib Quiet Node")]
struct Args {
    /// Select input device by substring match (case-insensitive).
    #[arg(long)]
    device: Option<String>,

    /// Requested sample rate in Hz. Default targets 16000 for future YAMNet path.
    #[arg(long)]
    sample_rate: Option<u32>,

    /// Force channel count. If omitted, first compatible input config is used.
    #[arg(long)]
    channels: Option<u16>,

    /// Report interval for level telemetry in milliseconds.
    #[arg(long, default_value_t = 1000)]
    report_ms: u64,
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

#[derive(Debug, Clone)]
struct SelectedConfig {
    config: StreamConfig,
    sample_format: SampleFormat,
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
        "input stream selected"
    );

    let window_stats = Arc::new(Mutex::new(WindowStats::default()));
    let stream = build_input_stream(&device, selected, Arc::clone(&window_stats))?;
    stream.play().context("failed to start input stream")?;

    let running = Arc::new(AtomicBool::new(true));
    {
        let running = Arc::clone(&running);
        ctrlc::set_handler(move || {
            running.store(false, Ordering::Relaxed);
        })
        .context("failed to install ctrl-c handler")?;
    }

    let report_every = Duration::from_millis(args.report_ms.max(100));
    info!("audio ingester started");
    while running.load(Ordering::Relaxed) {
        thread::sleep(report_every);
        let snapshot = take_and_reset_stats(&window_stats);
        if snapshot.sample_count == 0 {
            warn!("no audio samples captured in current interval");
            continue;
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

    drop(stream);
    info!("audio ingester stopped");
    Ok(())
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
                .map(|n| n.to_ascii_lowercase().contains(&query_lower))
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
        .map(|d| d.name().unwrap_or_else(|_| "<unknown>".to_string()))
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
    selected: SelectedConfig,
    stats: Arc<Mutex<WindowStats>>,
) -> Result<Stream> {
    let err_fn = |err| warn!(error = %err, "input stream error");

    let stream = match selected.sample_format {
        SampleFormat::F32 => build_stream_f32(device, &selected.config, stats, err_fn),
        SampleFormat::F64 => build_stream_f64(device, &selected.config, stats, err_fn),
        SampleFormat::I16 => build_stream_i16(device, &selected.config, stats, err_fn),
        SampleFormat::U16 => build_stream_u16(device, &selected.config, stats, err_fn),
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
    stats: Arc<Mutex<WindowStats>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    Ok(device.build_input_stream(
        config,
        move |data: &[f32], _| update_stats_f32(data, &stats),
        err_fn,
        None,
    )?)
}

fn build_stream_f64(
    device: &Device,
    config: &StreamConfig,
    stats: Arc<Mutex<WindowStats>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    Ok(device.build_input_stream(
        config,
        move |data: &[f64], _| {
            if let Ok(mut window) = stats.lock() {
                for &sample in data {
                    window.observe(sample as f32);
                }
            }
        },
        err_fn,
        None,
    )?)
}

fn build_stream_i16(
    device: &Device,
    config: &StreamConfig,
    stats: Arc<Mutex<WindowStats>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    Ok(device.build_input_stream(
        config,
        move |data: &[i16], _| {
            if let Ok(mut window) = stats.lock() {
                for &sample in data {
                    window.observe(sample as f32 / i16::MAX as f32);
                }
            }
        },
        err_fn,
        None,
    )?)
}

fn build_stream_u16(
    device: &Device,
    config: &StreamConfig,
    stats: Arc<Mutex<WindowStats>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<Stream> {
    Ok(device.build_input_stream(
        config,
        move |data: &[u16], _| {
            if let Ok(mut window) = stats.lock() {
                for &sample in data {
                    let normalized = (sample as f32 / u16::MAX as f32) * 2.0 - 1.0;
                    window.observe(normalized);
                }
            }
        },
        err_fn,
        None,
    )?)
}

fn update_stats_f32(data: &[f32], stats: &Arc<Mutex<WindowStats>>) {
    if let Ok(mut window) = stats.lock() {
        for &sample in data {
            window.observe(sample);
        }
    }
}

fn take_and_reset_stats(stats: &Arc<Mutex<WindowStats>>) -> WindowStats {
    if let Ok(mut lock) = stats.lock() {
        return std::mem::take(&mut *lock);
    }
    WindowStats::default()
}
