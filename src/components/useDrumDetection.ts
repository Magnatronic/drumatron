

import { useEffect, useRef } from 'react';
import type { DrumType } from './DrumVisualizer';

import type { DrumSettings } from './TopBar';

export interface UseDrumDetectionOptions {
  activeDrums: DrumType[];
  sensitivity: number;
  noiseFloor?: number;
  perDrumNoise?: Record<DrumType, number>;
  onDrumHit: (drum: DrumType) => void;
  drumSettings?: Partial<Record<DrumType, DrumSettings>>;
}

export interface UseDrumDetectionOptions {


  activeDrums: DrumType[];
  sensitivity: number;
  noiseFloor?: number;
  perDrumNoise?: Record<DrumType, number>;
  onDrumHit: (drum: DrumType) => void;
}

// Simple frequency ranges for demo (real detection would be more advanced)
const drumFrequencyMap: Record<DrumType, [number, number]> = {
  kick: [20, 100],
  snare: [150, 250],
  hihat: [5000, 12000],
  tom: [80, 180],
  cymbal: [6000, 16000],
};

// Add: export type for match scores
export type DrumMatchScores = Partial<Record<DrumType, number>>;

export function useDrumDetection({ activeDrums, sensitivity, noiseFloor = 0, perDrumNoise, onDrumHit, drumSettings, setMatchScores }:
  UseDrumDetectionOptions & { setMatchScores?: (scores: DrumMatchScores) => void }) {
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
        let lastDrum: DrumType | null = null;
        let lastHitTime = 0;

        function detect() {
          analyser.getByteFrequencyData(data);
          let detected: DrumType | null = null;
          let maxScore = 0;
          const scores: DrumMatchScores = {};
          for (const drum of activeDrums) {
            const settings = drumSettings?.[drum];
            const template = settings?.spectrumTemplate;
            const drumSensitivity = settings?.sensitivity ?? sensitivity;
            const amplitudeThreshold = settings?.amplitudeThreshold ?? 0.1;
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
            scores[drum] = dot;
            // Only consider if amplitude is above threshold
            if (dot > drumSensitivity && dot > maxScore && liveNorm > amplitudeThreshold) {
              detected = drum;
              maxScore = dot;
            }
          }
          if (setMatchScores) setMatchScores(scores);
          const now = Date.now();
          if (detected && (detected !== lastDrum || now - lastHitTime > 200)) {
            onDrumHit(detected);
            lastDrum = detected;
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
  }, [activeDrums, sensitivity, onDrumHit, drumSettings]);
}
