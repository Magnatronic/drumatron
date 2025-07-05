import { Box, LinearProgress, Typography, Button } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type { DrumType } from './DrumVisualizer';

const drumLabels: Record<DrumType, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'Hi-Hat',
  tom: 'Tom',
  cymbal: 'Cymbal',
};

const drumFrequencyMap: Record<DrumType, [number, number]> = {
  kick: [20, 100],
  snare: [150, 250],
  hihat: [5000, 12000],
  tom: [80, 180],
  cymbal: [6000, 16000],
};

export interface AllDrumCalibrationProps {
  drums: DrumType[];
  onCalibrate: (noiseFloors: Record<DrumType, number>) => void;
  calibrateButtonId?: string;
}

export const AllDrumCalibration: React.FC<AllDrumCalibrationProps> = ({ drums, onCalibrate, calibrateButtonId }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState<Record<DrumType, number>>({} as Record<DrumType, number>);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const sampleDuration = 1500; // ms

  const handleCalibrate = async () => {
    setCalibrating(true);
    setProgress(0);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const drumSamples: Record<DrumType, number[]> = {} as Record<DrumType, number[]>;
    drums.forEach((d) => (drumSamples[d] = []));
    const start = Date.now();
    function sample() {
      analyser.getByteFrequencyData(data);
      drums.forEach((drum) => {
        const [minF, maxF] = drumFrequencyMap[drum];
        const minIdx = Math.floor(minF / (audioContext.sampleRate / 2) * data.length);
        const maxIdx = Math.ceil(maxF / (audioContext.sampleRate / 2) * data.length);
        let energy = 0;
        for (let i = minIdx; i <= maxIdx; i++) {
          energy += data[i] || 0;
        }
        drumSamples[drum].push(energy / (maxIdx - minIdx + 1));
      });
      setProgress(Math.min(100, ((Date.now() - start) / sampleDuration) * 100));
      if (Date.now() - start < sampleDuration) {
        animationFrameRef.current = requestAnimationFrame(sample);
      } else {
        const result: Record<DrumType, number> = {} as Record<DrumType, number>;
        drums.forEach((drum) => {
          const avg = drumSamples[drum].reduce((a, b) => a + b, 0) / drumSamples[drum].length;
          result[drum] = avg / 100; // normalize to 0-1 range
        });
        setCalibrated(result);
        setCalibrating(false);
        onCalibrate(result);
        audioContext.close();
      }
    }
    sample();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Calibrate All Drums (Noise Floor)
      </Typography>
      <Button
        variant="outlined"
        onClick={handleCalibrate}
        disabled={calibrating}
        sx={{ mb: 1 }}
        id={calibrateButtonId}
      >
        {calibrating ? 'Calibrating...' : 'Calibrate'}
      </Button>
      {calibrating && (
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5, mb: 1 }} />
      )}
      {Object.keys(calibrated).length > 0 && (
        <Box>
          {drums.map((drum) => (
            <Typography key={drum} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {drumLabels[drum]}: {(calibrated[drum] * 100).toFixed(1)}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};
