import { Box, LinearProgress, Typography, Button } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

export interface AudioLevelMeterProps {
  onCalibrate: (noiseLevel: number) => void;
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({ onCalibrate }) => {
  const [level, setLevel] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedLevel, setCalibratedLevel] = useState<number | null>(null);
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
          // Calculate RMS (root mean square) for level
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

  // Calibration logic
  const handleCalibrate = () => {
    setCalibrating(true);
    let samples: number[] = [];
    const sampleDuration = 1500; // ms
    const start = Date.now();
    function sample() {
      samples.push(level);
      if (Date.now() - start < sampleDuration) {
        requestAnimationFrame(sample);
      } else {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        setCalibratedLevel(avg);
        setCalibrating(false);
        onCalibrate(avg);
      }
    }
    sample();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Mic Level
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(level * 100 * 2, 100)}
        sx={{ height: 10, borderRadius: 5, mb: 1, bgcolor: '#eee' }}
      />
      <Typography variant="caption" color="text.secondary">
        {calibrating
          ? 'Calibrating... Please stay quiet.'
          : calibratedLevel !== null
          ? `Calibrated noise floor: ${(calibratedLevel * 100).toFixed(1)}`
          : `Current: ${(level * 100).toFixed(1)}`}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCalibrate}
          disabled={calibrating}
        >
          Calibrate Noise Floor
        </Button>
      </Box>
    </Box>
  );
};
