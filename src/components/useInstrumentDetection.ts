import { useEffect, useRef } from 'react';
import type { InstrumentType } from './instrumentConfig';
import { InstrumentDebounce } from './detectionUtils';
import type { DetectionSettings } from './detectionTypes';

export type InstrumentMatchScores = Partial<Record<InstrumentType, number>>;

export interface InstrumentSettings {
  enabled: boolean;
  spectrumTemplate?: number[];
  sensitivity: number;
  amplitudeThreshold?: number;
}

// New noise management class
class NoiseFloorManager {
  private samples: number[] = [];
  private readonly maxSamples = 100; // Keep last 100 samples for noise floor
  private readonly minSampleTime = 50; // Only sample every 50ms
  private lastSampleTime = 0;
  private manualOverride = 0;
  
  setManualOverride(value: number): void {
    this.manualOverride = value;
  }
  
  addSample(amplitude: number): void {
    const now = Date.now();
    if (now - this.lastSampleTime < this.minSampleTime) return;
    
    this.samples.push(amplitude);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    this.lastSampleTime = now;
  }
  
  getNoiseFloor(): number {
    // Use manual override if set
    if (this.manualOverride > 0) {
      return this.manualOverride;
    }
    
    if (this.samples.length < 10) return 0;
    
    // Use 75th percentile as noise floor (more robust than average)
    const sorted = [...this.samples].sort((a, b) => a - b);
    const percentile75 = Math.floor(sorted.length * 0.75);
    return sorted[percentile75];
  }
  
  getSignalToNoiseRatio(currentAmplitude: number): number {
    const noiseFloor = this.getNoiseFloor();
    if (noiseFloor === 0) return currentAmplitude;
    return currentAmplitude / noiseFloor;
  }
}

export interface UseInstrumentDetectionOptions {
  activeInstruments: InstrumentType[];
  sensitivity: number;
  noiseFloor?: number;
  perInstrumentNoise?: Record<InstrumentType, number>;
  onInstrumentHit: (instrument: InstrumentType) => void;
  instrumentSettings?: Partial<Record<InstrumentType, InstrumentSettings>>;
  setMatchScores?: (scores: InstrumentMatchScores) => void;
  detectionSettings?: DetectionSettings;
}


export function useInstrumentDetection({ 
  activeInstruments, 
  sensitivity, 
  onInstrumentHit, 
  instrumentSettings, 
  setMatchScores, 
  detectionSettings 
}: UseInstrumentDetectionOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  // Modular debounce instance (persistent across renders)
  const debounceRef = useRef<InstrumentDebounce>(new InstrumentDebounce());
  // Noise floor manager for background noise handling
  const noiseManagerRef = useRef<NoiseFloorManager>(new NoiseFloorManager());
  
  // Track previous score for rising edge detection
  // Initialize with all instruments set to 0
  const initialInstrumentRecord = {
    drum1: 0,
    drum2: 0,
    drum3: 0,
    drum4: 0,
    drum5: 0,
  };
  const prevScoreRef = useRef<Record<InstrumentType, number>>({ ...initialInstrumentRecord });
  // Track last trigger time for refractory period
  const lastTriggerRef = useRef<Record<InstrumentType, number>>({ ...initialInstrumentRecord });
  
  // Use detection settings or fallback to defaults
  const debounceMs = detectionSettings?.debounceMs ?? 200;
  const minSnr = detectionSettings?.snrThreshold ?? 2.5;
  const minAmplitude = detectionSettings?.minAmplitude ?? 30;
  const manualNoiseFloor = detectionSettings?.manualNoiseFloor ?? 0;

  useEffect(() => {
    let cancelled = false;
    // Only initialize prevScoreRef and lastTriggerRef for new instruments, do not reset on every effect run
    for (const instrument of activeInstruments) {
      if (!(instrument in prevScoreRef.current)) prevScoreRef.current[instrument] = 0;
      if (!(instrument in lastTriggerRef.current)) lastTriggerRef.current[instrument] = 0;
    }
    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        function detect() {
          analyser.getByteFrequencyData(data);
          
          // Calculate current amplitude for noise floor management
          const currentAmplitude = data.reduce((sum, v) => sum + v, 0) / data.length;
          
          // Set manual noise floor override if configured
          if (manualNoiseFloor > 0) {
            noiseManagerRef.current.setManualOverride(manualNoiseFloor);
          }
          
          noiseManagerRef.current.addSample(currentAmplitude);
          
          // Get noise floor and SNR
          const noiseFloor = noiseManagerRef.current.getNoiseFloor();
          const snr = noiseManagerRef.current.getSignalToNoiseRatio(currentAmplitude);
          
          // Skip processing if amplitude is too low or SNR is poor
          if (currentAmplitude < minAmplitude || snr < minSnr) {
            // Still update match scores for UI feedback, but don't trigger
            const scores: InstrumentMatchScores = {};
            for (const instrument of activeInstruments) {
              scores[instrument] = 0;
            }
            if (setMatchScores) setMatchScores(scores);
            animationFrameRef.current = requestAnimationFrame(detect);
            return;
          }
          
          const scores: InstrumentMatchScores = {};
          const now = Date.now();
          
          for (const instrument of activeInstruments) {
            const settings = instrumentSettings?.[instrument];
            const template = settings?.spectrumTemplate;
            const instrumentSensitivity = settings?.sensitivity ?? sensitivity;
            const amplitudeThreshold = settings?.amplitudeThreshold ?? minAmplitude;
            
            if (!template) continue;
            
            // Additional amplitude check per instrument
            if (currentAmplitude < amplitudeThreshold) {
              scores[instrument] = 0;
              continue;
            }
            
            // Normalize live spectrum
            const liveNorm = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0));
            if (liveNorm === 0) continue;
            const liveVec = Array.from(data, v => v / liveNorm);
            // Cosine similarity
            let dot = 0;
            for (let i = 0; i < Math.min(liveVec.length, template.length); i++) {
              dot += liveVec[i] * template[i];
            }
            scores[instrument] = dot;
            const threshold = instrumentSensitivity;
            const prevScore = prevScoreRef.current[instrument] ?? 0;
            const lastTrigger = lastTriggerRef.current[instrument] ?? 0;
            // Rising edge detection with refractory period
            if (
              prevScore <= threshold &&
              dot > threshold &&
              now - lastTrigger > debounceMs
            ) {
              const allowed = debounceRef.current?.shouldTrigger(instrument);
              // Enhanced logging with noise info
              console.log(`[Detection][Enhanced] instrument: ${instrument}, allowed: ${allowed}, score: ${dot.toFixed(3)}, threshold: ${threshold}, prevScore: ${prevScore.toFixed(3)}, amplitude: ${currentAmplitude.toFixed(1)}, SNR: ${snr.toFixed(2)}, noiseFloor: ${noiseFloor.toFixed(1)}`);
              if (allowed) {
                onInstrumentHit(instrument);
                lastTriggerRef.current[instrument] = now;
              }
            }
            prevScoreRef.current[instrument] = dot;
          }
          if (setMatchScores) setMatchScores(scores);
          animationFrameRef.current = requestAnimationFrame(detect);
        }
        detect();
      } catch (e) {
        // Could not access mic
      }
    }
    setup();
    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
    // eslint-disable-next-line
  }, [activeInstruments, sensitivity, onInstrumentHit, instrumentSettings, detectionSettings]);
}
