import { Box, LinearProgress, Typography, Stack, IconButton } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type { InstrumentType } from './InstrumentVisualizer';
import { instrumentConfig } from './instrumentConfig';

export interface PerInstrumentCalibrationProps {
  instruments: InstrumentType[];
  noiseFloors: Record<InstrumentType, number>;
  onCalibrate: (instrument: InstrumentType, noiseLevel: number) => void;
}

export const PerInstrumentCalibration: React.FC<PerInstrumentCalibrationProps> = ({ instruments, noiseFloors, onCalibrate }) => {
  const [level, setLevel] = useState(0);
  const [calibrating, setCalibrating] = useState<InstrumentType | null>(null);
  const [calibrated, setCalibrated] = useState<Record<InstrumentType, number>>(noiseFloors);
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

  const handleCalibrate = (instrument: InstrumentType) => {
    setCalibrating(instrument);
    let samples: number[] = [];
    const sampleDuration = 1500;
    const start = Date.now();
    function sample() {
      samples.push(level);
      if (Date.now() - start < sampleDuration) {
        requestAnimationFrame(sample);
      } else {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        setCalibrated((prev) => ({ ...prev, [instrument]: avg }));
        setCalibrating(null);
        onCalibrate(instrument, avg);
      }
    }
    sample();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Per-Instrument Noise Floor Calibration
      </Typography>
      <Stack spacing={2}>
        {instruments.map((instrument) => {
          const { label, icon: IconComponent, color } = instrumentConfig[instrument];
          return (
            <Box key={instrument} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconComponent sx={{ color, fontSize: 20 }} />
              <Typography sx={{ minWidth: 60 }}>{label}</Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(level * 100 * 2, 100)}
                sx={{ height: 8, borderRadius: 5, flex: 1, bgcolor: '#eee' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                {calibrating === instrument
                  ? 'Calibrating...'
                  : calibrated[instrument] !== undefined
                  ? `Noise: ${(calibrated[instrument] * 100).toFixed(1)}`
                  : 'Not set'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleCalibrate(instrument)}
                disabled={calibrating !== null}
                color={calibrating === instrument ? 'primary' : 'default'}
              >
                <IconComponent sx={{ color, fontSize: 20 }} />
              </IconButton>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

// For compatibility with old imports
export default PerInstrumentCalibration;
