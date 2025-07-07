// Shared types for detection settings to avoid circular imports

export interface DetectionSettings {
  debounceMs: number; // Trigger cooldown (100-500ms)
  snrThreshold: number; // Background noise sensitivity (1.5-5.0)
  minAmplitude: number; // Minimum volume (10-100)
  manualNoiseFloor: number; // Manual noise floor override (0=auto)
  adaptationSpeed: 'fast' | 'normal' | 'slow'; // Noise floor learning speed
}

// Default detection settings
export const defaultDetectionSettings: DetectionSettings = {
  debounceMs: 200,
  snrThreshold: 2.5,
  minAmplitude: 30,
  manualNoiseFloor: 0, // 0 = automatic
  adaptationSpeed: 'normal'
};

export type InstrumentSettings = {
  enabled: boolean;
  spectrumTemplate?: number[]; // normalized average spectrum
  sensitivity: number; // similarity threshold (0.7–0.99)
  amplitudeThreshold?: number; // minimum amplitude (RMS) required
};
