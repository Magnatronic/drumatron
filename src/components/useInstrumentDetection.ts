import { useEffect, useRef } from 'react';
import type { InstrumentType } from './InstrumentVisualizer';

export type InstrumentMatchScores = Partial<Record<InstrumentType, number>>;

export interface InstrumentSettings {
  enabled: boolean;
  spectrumTemplate?: number[];
  sensitivity: number;
  amplitudeThreshold?: number;
}

export interface UseInstrumentDetectionOptions {
  activeInstruments: InstrumentType[];
  sensitivity: number;
  noiseFloor?: number;
  perInstrumentNoise?: Record<InstrumentType, number>;
  onInstrumentHit: (instrument: InstrumentType) => void;
  instrumentSettings?: Partial<Record<InstrumentType, InstrumentSettings>>;
  setMatchScores?: (scores: InstrumentMatchScores) => void;
}

export function useInstrumentDetection({ activeInstruments, sensitivity, onInstrumentHit, instrumentSettings, setMatchScores }: UseInstrumentDetectionOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
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
        let lastInstrument: InstrumentType | null = null;
        let lastHitTime = 0;

        function detect() {
          analyser.getByteFrequencyData(data);
          let detected: InstrumentType | null = null;
          let maxScore = 0;
          const scores: InstrumentMatchScores = {};
          for (const instrument of activeInstruments) {
            const settings = instrumentSettings?.[instrument];
            const template = settings?.spectrumTemplate;
            const instrumentSensitivity = settings?.sensitivity ?? sensitivity;
            const amplitudeThreshold = settings?.amplitudeThreshold ?? 0.1;
            if (!template) continue; // skip if no template
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
            // Only consider if amplitude is above threshold
            if (dot > instrumentSensitivity && dot > maxScore && liveNorm > amplitudeThreshold) {
              detected = instrument;
              maxScore = dot;
            }
          }
          if (setMatchScores) setMatchScores(scores);
          const now = Date.now();
          if (detected && (detected !== lastInstrument || now - lastHitTime > 200)) {
            onInstrumentHit(detected);
            lastInstrument = detected;
            lastHitTime = now;
          }
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
  }, [activeInstruments, sensitivity, onInstrumentHit, instrumentSettings]);
}
