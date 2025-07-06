import { useEffect, useRef } from 'react';
import type { InstrumentType } from './InstrumentVisualizer';
import { InstrumentDebounce } from './detectionUtils';

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
  // Modular debounce instance (persistent across renders)
  const debounceRef = useRef<InstrumentDebounce>(new InstrumentDebounce());
  // Track previous score for rising edge detection
  const prevScoreRef = useRef<Record<InstrumentType, number>>({});
  // Track last trigger time for refractory period
  const lastTriggerRef = useRef<Record<InstrumentType, number>>({});
  // Per-instrument refractory period (lockout) in ms
  const refractoryMs = 180;

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
          const scores: InstrumentMatchScores = {};
          const now = Date.now();
          for (const instrument of activeInstruments) {
            const settings = instrumentSettings?.[instrument];
            const template = settings?.spectrumTemplate;
            const instrumentSensitivity = settings?.sensitivity ?? sensitivity;
            if (!template) continue;
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
              now - lastTrigger > refractoryMs
            ) {
              const allowed = debounceRef.current?.shouldTrigger(instrument);
              // eslint-disable-next-line no-console
              console.log(`[Detection][Simple] instrument: ${instrument}, allowed: ${allowed}, score: ${dot.toFixed(3)}, threshold: ${threshold}, prevScore: ${prevScore.toFixed(3)}, now: ${now}`);
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
  }, [activeInstruments, sensitivity, onInstrumentHit, instrumentSettings]);
}
