use chrono::{Local, Timelike};

use crate::inference::{Prediction, SoundCategory};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FadeState {
    DeepQuiet,
    GentleFilter,
    Normal,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FadeDecision {
    pub state: FadeState,
    pub confidence: f32,
    pub triggered_by: Option<String>,
    pub reason: String,
}

#[derive(Debug, Clone)]
pub struct FadeConfig {
    pub deep_quiet_threshold: f32,
    pub gentle_filter_threshold: f32,
    pub night_sensitivity_factor: f32,
    pub night_start_hour: u32,
    pub night_end_hour: u32,
    pub harsh_label_substrings: Vec<String>,
}

impl Default for FadeConfig {
    fn default() -> Self {
        Self {
            deep_quiet_threshold: 0.70,
            gentle_filter_threshold: 0.35,
            night_sensitivity_factor: 0.70,
            night_start_hour: 20,
            night_end_hour: 6,
            harsh_label_substrings: vec![
                "door_slam".to_string(),
                "door".to_string(),
                "slam".to_string(),
                "car_horn".to_string(),
                "horn".to_string(),
                "alarm".to_string(),
                "siren".to_string(),
                "shout".to_string(),
                "scream".to_string(),
                "crash".to_string(),
                "bang".to_string(),
                "drill".to_string(),
                "hammer".to_string(),
                "construction".to_string(),
            ],
        }
    }
}

impl FadeConfig {
    pub fn effective_thresholds_for_hour(&self, hour: u32) -> (f32, f32) {
        let hour = hour % 24;
        let in_night = is_hour_in_range(hour, self.night_start_hour, self.night_end_hour);
        let factor = if in_night {
            self.night_sensitivity_factor.max(0.05)
        } else {
            1.0
        };
        (
            self.deep_quiet_threshold * factor,
            self.gentle_filter_threshold * factor,
        )
    }

    fn is_harsh_label(&self, label: &str) -> bool {
        let label_lower = label.to_ascii_lowercase();
        self.harsh_label_substrings
            .iter()
            .any(|needle| label_lower.contains(&needle.to_ascii_lowercase()))
    }
}

pub struct FadeEngine {
    config: FadeConfig,
}

impl FadeEngine {
    pub fn new() -> Self {
        Self {
            config: FadeConfig::default(),
        }
    }

    pub fn with_config(config: FadeConfig) -> Self {
        Self { config }
    }

    pub fn decide(&self, prediction: &Prediction) -> FadeDecision {
        let hour = Local::now().hour();
        self.decide_at_hour(prediction, hour)
    }

    pub fn decide_at_hour(&self, prediction: &Prediction, hour: u32) -> FadeDecision {
        let (deep_threshold, gentle_threshold) = self.config.effective_thresholds_for_hour(hour);
        let mut max_harsh_score = 0.0f32;
        let mut triggered_by = None;

        for label in &prediction.top {
            let is_harsh =
                label.category == SoundCategory::Fade || self.config.is_harsh_label(&label.label);
            if is_harsh && label.score > max_harsh_score {
                max_harsh_score = label.score;
                triggered_by = Some(label.label.clone());
            }
        }

        if max_harsh_score >= deep_threshold {
            return FadeDecision {
                state: FadeState::DeepQuiet,
                confidence: max_harsh_score,
                triggered_by,
                reason: format!(
                    "harsh label above deep threshold ({:.3} >= {:.3})",
                    max_harsh_score, deep_threshold
                ),
            };
        }

        if max_harsh_score >= gentle_threshold {
            return FadeDecision {
                state: FadeState::GentleFilter,
                confidence: max_harsh_score,
                triggered_by,
                reason: format!(
                    "harsh label above gentle threshold ({:.3} >= {:.3})",
                    max_harsh_score, gentle_threshold
                ),
            };
        }

        FadeDecision {
            state: FadeState::Normal,
            confidence: max_harsh_score,
            triggered_by: None,
            reason: "no harsh label above thresholds".to_string(),
        }
    }
}

impl Default for FadeEngine {
    fn default() -> Self {
        Self::new()
    }
}

fn is_hour_in_range(hour: u32, start: u32, end: u32) -> bool {
    let start = start % 24;
    let end = end % 24;
    if start == end {
        return true;
    }
    if start < end {
        hour >= start && hour < end
    } else {
        hour >= start || hour < end
    }
}

#[cfg(test)]
mod tests {
    use crate::inference::ClassifiedLabel;

    use super::*;

    fn sample_prediction(label: &str, score: f32, category: SoundCategory) -> Prediction {
        Prediction {
            top: vec![ClassifiedLabel {
                index: 0,
                label: label.to_string(),
                score,
                category,
            }],
        }
    }

    #[test]
    fn hour_range_handles_midnight_wrap() {
        assert!(is_hour_in_range(22, 20, 6));
        assert!(is_hour_in_range(3, 20, 6));
        assert!(!is_hour_in_range(12, 20, 6));
    }

    #[test]
    fn hour_range_handles_non_wrapping_range() {
        assert!(is_hour_in_range(10, 8, 18));
        assert!(!is_hour_in_range(6, 8, 18));
    }

    #[test]
    fn decides_deep_quiet_for_high_fade_score() {
        let engine = FadeEngine::new();
        let prediction = sample_prediction("door_slam", 0.95, SoundCategory::Fade);
        let decision = engine.decide_at_hour(&prediction, 12);
        assert_eq!(decision.state, FadeState::DeepQuiet);
    }

    #[test]
    fn decides_gentle_filter_for_medium_fade_score() {
        let engine = FadeEngine::new();
        let prediction = sample_prediction("car_horn", 0.40, SoundCategory::Fade);
        let decision = engine.decide_at_hour(&prediction, 12);
        assert_eq!(decision.state, FadeState::GentleFilter);
    }

    #[test]
    fn uses_blocklist_even_when_category_is_neutral() {
        let engine = FadeEngine::new();
        let prediction = sample_prediction("garage_door", 0.50, SoundCategory::Neutral);
        let decision = engine.decide_at_hour(&prediction, 12);
        assert_eq!(decision.state, FadeState::GentleFilter);
    }

    #[test]
    fn uses_night_sensitivity_factor() {
        let mut cfg = FadeConfig::default();
        cfg.deep_quiet_threshold = 0.8;
        cfg.gentle_filter_threshold = 0.6;
        cfg.night_sensitivity_factor = 0.5;
        cfg.night_start_hour = 20;
        cfg.night_end_hour = 6;
        let engine = FadeEngine::with_config(cfg);
        let prediction = sample_prediction("door_slam", 0.41, SoundCategory::Fade);
        let day = engine.decide_at_hour(&prediction, 14);
        let night = engine.decide_at_hour(&prediction, 23);
        assert_eq!(day.state, FadeState::Normal);
        assert_eq!(night.state, FadeState::DeepQuiet);
    }
}
