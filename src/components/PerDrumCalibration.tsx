import { Box, LinearProgress, Typography, Button, Stack, IconButton } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type { DrumType } from './DrumVisualizer';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const drumLabels: Record<DrumType, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'Hi-Hat',
  tom: 'Tom',
  cymbal: 'Cymbal',
};

export interface PerDrumCalibrationProps {
  drums: DrumType[];
  noiseFloors: Record<DrumType, number>;
  onCalibrate: (drum: DrumType, noiseLevel: number) => void;
}

export const PerDrumCalibration: React.FC<PerDrumCalibrationProps> = ({ drums, noiseFloors, onCalibrate }) => {
  const [level, setLevel] = useState(0);
  const [calibrating, setCalibrating] = useState<DrumType | null>(null);
  const [calibrated, setCalibrated] = useState<Record<DrumType, number>>(noiseFloors);
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
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        function update() {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const val = (data[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / data.length);
          setLevel(rms);
          animationFrameRef.current = requestAnimationFrame(update);
        }
        update();
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
  }, []);

  const handleCalibrate = (drum: DrumType) => {
    setCalibrating(drum);
    let samples: number[] = [];
    const sampleDuration = 1500;
    const start = Date.now();
    function sample() {
      samples.push(level);
      if (Date.now() - start < sampleDuration) {
        requestAnimationFrame(sample);
      } else {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        setCalibrated((prev) => ({ ...prev, [drum]: avg }));
        setCalibrating(null);
        onCalibrate(drum, avg);
      }
    }
    sample();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Per-Drum Noise Floor Calibration
      </Typography>
      <Stack spacing={2}>
        {drums.map((drum) => (
          <Box key={drum} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MusicNoteIcon fontSize="small" />
            <Typography sx={{ minWidth: 60 }}>{drumLabels[drum]}</Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(level * 100 * 2, 100)}
              sx={{ height: 8, borderRadius: 5, flex: 1, bgcolor: '#eee' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
              {calibrating === drum
                ? 'Calibrating...'
                : calibrated[drum] !== undefined
                ? `Noise: ${(calibrated[drum] * 100).toFixed(1)}`
                : 'Not set'}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleCalibrate(drum)}
              disabled={calibrating !== null}
              color={calibrating === drum ? 'primary' : 'default'}
            >
              <MusicNoteIcon />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
