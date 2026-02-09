use std::collections::VecDeque;

use anyhow::{Result, anyhow};

#[derive(Debug, Clone)]
pub struct AudioWindow {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub rms: f32,
    pub peak: f32,
    pub clip_count: u64,
}

#[derive(Debug)]
pub struct CircularAudioBuffer {
    sample_rate: u32,
    channels: u16,
    frames_per_window: usize,
    mono_ring: VecDeque<f32>,
    partial_frame: Vec<f32>,
}

impl CircularAudioBuffer {
    pub fn new(sample_rate: u32, channels: u16, window_seconds: f32) -> Result<Self> {
        if sample_rate == 0 {
            return Err(anyhow!("sample_rate must be > 0"));
        }
        if channels == 0 {
            return Err(anyhow!("channels must be > 0"));
        }
        if !window_seconds.is_finite() || window_seconds <= 0.0 {
            return Err(anyhow!("window_seconds must be > 0"));
        }

        let frames_per_window = ((sample_rate as f32) * window_seconds).round() as usize;
        let frames_per_window = frames_per_window.max(1);

        Ok(Self {
            sample_rate,
            channels,
            frames_per_window,
            mono_ring: VecDeque::with_capacity(frames_per_window * 2),
            partial_frame: Vec::with_capacity(channels as usize),
        })
    }

    pub fn push_interleaved(&mut self, interleaved: &[f32], out: &mut Vec<AudioWindow>) {
        let channels = self.channels as usize;

        for &sample in interleaved {
            self.partial_frame.push(sample.clamp(-1.0, 1.0));
            if self.partial_frame.len() == channels {
                let mono = self.partial_frame.iter().sum::<f32>() / channels as f32;
                self.mono_ring.push_back(mono);
                self.partial_frame.clear();
            }
        }

        while self.mono_ring.len() >= self.frames_per_window {
            let mut samples = Vec::with_capacity(self.frames_per_window);
            for _ in 0..self.frames_per_window {
                if let Some(sample) = self.mono_ring.pop_front() {
                    samples.push(sample);
                }
            }

            let (rms, peak, clip_count) = analyze_window(&samples);
            out.push(AudioWindow {
                samples,
                sample_rate: self.sample_rate,
                rms,
                peak,
                clip_count,
            });
        }
    }
}

fn analyze_window(samples: &[f32]) -> (f32, f32, u64) {
    if samples.is_empty() {
        return (0.0, 0.0, 0);
    }

    let mut sum_squares = 0.0f64;
    let mut peak = 0.0f32;
    let mut clip_count = 0u64;

    for &sample in samples {
        let abs = sample.abs();
        sum_squares += f64::from(sample) * f64::from(sample);
        if abs > peak {
            peak = abs;
        }
        if abs >= 0.999 {
            clip_count += 1;
        }
    }

    let rms = (sum_squares / samples.len() as f64).sqrt() as f32;
    (rms, peak, clip_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emits_exact_975ms_window_at_16k() {
        let mut buffer = CircularAudioBuffer::new(16_000, 1, 0.975).expect("buffer");
        let input = vec![0.25f32; 15_600];
        let mut out = Vec::new();
        buffer.push_interleaved(&input, &mut out);

        assert_eq!(out.len(), 1);
        assert_eq!(out[0].samples.len(), 15_600);
        assert_eq!(out[0].sample_rate, 16_000);
    }

    #[test]
    fn downmixes_interleaved_stereo_to_mono() {
        let mut buffer = CircularAudioBuffer::new(10, 2, 0.2).expect("buffer");
        // 2 frames at stereo -> expected mono [0.0, 0.5]
        let input = vec![-1.0, 1.0, 1.0, 0.0];
        let mut out = Vec::new();
        buffer.push_interleaved(&input, &mut out);

        // 0.2s at 10Hz => 2 mono frames -> one window.
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].samples, vec![0.0, 0.5]);
    }
}
