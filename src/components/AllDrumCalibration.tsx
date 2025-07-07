import { Box, LinearProgress, Typography, Button } from '@mui/material';
import React, { useRef, useState } from 'react';
import type { InstrumentType } from './instrumentConfig';

const instrumentLabels: Record<InstrumentType, string> = {
  drum1: 'Drum 1',
  drum2: 'Drum 2',
  drum3: 'Drum 3',
  drum4: 'Drum 4',
  drum5: 'Drum 5',
};

const instrumentFrequencyMap: Record<InstrumentType, [number, number]> = {
  drum1: [20, 100],
  drum2: [150, 250],
  drum3: [5000, 12000],
  drum4: [80, 180],
  drum5: [6000, 16000],
};

export interface AllInstrumentCalibrationProps {
  instruments: InstrumentType[];
  onCalibrate: (noiseFloors: Record<InstrumentType, number>) => void;
  calibrateButtonId?: string;
}


export const AllInstrumentCalibration: React.FC<AllInstrumentCalibrationProps> = ({ instruments, onCalibrate, calibrateButtonId }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState<Record<InstrumentType, number>>({} as Record<InstrumentType, number>);
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
    const instrumentSamples: Record<InstrumentType, number[]> = {} as Record<InstrumentType, number[]>;
    instruments.forEach((i) => (instrumentSamples[i] = []));
    const start = Date.now();
    function sample() {
      analyser.getByteFrequencyData(data);
      instruments.forEach((instrument) => {
        const [minF, maxF] = instrumentFrequencyMap[instrument];
        const minIdx = Math.floor(minF / (audioContext.sampleRate / 2) * data.length);
        const maxIdx = Math.ceil(maxF / (audioContext.sampleRate / 2) * data.length);
        let energy = 0;
        for (let i = minIdx; i <= maxIdx; i++) {
          energy += data[i] || 0;
        }
        instrumentSamples[instrument].push(energy / (maxIdx - minIdx + 1));
      });
      setProgress(Math.min(100, ((Date.now() - start) / sampleDuration) * 100));
      if (Date.now() - start < sampleDuration) {
        animationFrameRef.current = requestAnimationFrame(sample);
      } else {
        const result: Record<InstrumentType, number> = {} as Record<InstrumentType, number>;
        instruments.forEach((instrument) => {
          const avg = instrumentSamples[instrument].reduce((a, b) => a + b, 0) / instrumentSamples[instrument].length;
          result[instrument] = avg / 100; // normalize to 0-1 range
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
        Calibrate All Instruments (Noise Floor)
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
          {instruments.map((instrument) => (
            <Typography key={instrument} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {instrumentLabels[instrument]}: {(calibrated[instrument] * 100).toFixed(1)}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};
