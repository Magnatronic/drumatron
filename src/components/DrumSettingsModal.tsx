import React, { useState, useRef, useEffect } from 'react';
import { FrequencySpectrum } from './FrequencySpectrum';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import HearingIcon from '@mui/icons-material/Hearing';

export interface DrumSettingsModalProps {
  open: boolean;
  drum: string;
  initialEnabled: boolean;
  initialSpectrumTemplate?: number[];
  initialSensitivity: number;
  initialAmplitudeThreshold?: number;
  onClose: () => void;
  onSave: (settings: {
    enabled: boolean;
    spectrumTemplate?: number[];
    sensitivity: number;
    amplitudeThreshold?: number;
  }) => void;
}
const DrumSettingsModal: React.FC<DrumSettingsModalProps> = ({
  open,
  drum,
  initialEnabled,
  initialSpectrumTemplate,
  initialSensitivity,
  initialAmplitudeThreshold = 0.1,
  onClose,
  onSave,
}) => {
  // Theme switching for training
  const [wasTheme, setWasTheme] = useState<string | null>(null);
  // Access theme setter via window (hacky, but avoids prop drilling)
  const setTheme = (window as any).setDrumatronTheme;
  const currentTheme = (window as any).drumatronCurrentTheme;

  const [isTraining, setIsTraining] = useState(false);

  // Switch to classic theme on training start, restore on end or modal close
  useEffect(() => {
    if (isTraining && setTheme) {
      // Only save previous theme if not already saved
      setWasTheme(prev => prev ?? currentTheme ?? null);
      setTheme('classic');
    } else if (!isTraining && setTheme && wasTheme) {
      setTheme(wasTheme);
      setWasTheme(null);
    }
    // eslint-disable-next-line
  }, [isTraining]);

  // Restore theme if modal closes while training or after
  useEffect(() => {
    if (!open && setTheme && wasTheme) {
      setTheme(wasTheme);
      setWasTheme(null);
    }
    // eslint-disable-next-line
  }, [open]);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [spectrumTemplate, setSpectrumTemplate] = useState<number[] | undefined>(initialSpectrumTemplate);
  const [sensitivity, setSensitivity] = useState(initialSensitivity);
  const [amplitudeThreshold, setAmplitudeThreshold] = useState(initialAmplitudeThreshold);
  const [liveFeedback, setLiveFeedback] = useState('');
  // For spectrum visualization
  const [liveSpectrum, setLiveSpectrum] = useState<Uint8Array | null>(null);
  const [livePeakIdx, setLivePeakIdx] = useState<number | null>(null);
  const [trainProgress, setTrainProgress] = useState(0);
  const trainDuration = 3000; // ms
  const trainTimerRef = useRef<number | null>(null);

  // Real training logic: record, analyze, and set frequency range
  const handleTrain = async () => {
    setIsTraining(true);
    setLiveFeedback('Listening...');
    setSpectrumTemplate(undefined);
    setTrainProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      // Record for trainDuration ms
      const freqSum = new Float32Array(analyser.frequencyBinCount);
      let frames = 0;
      const start = performance.now();

      function collect() {
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < data.length; i++) freqSum[i] += data[i];
        frames++;
        // Live spectrum for visualization
        setLiveSpectrum(Uint8Array.from(data));
        // Progress
        const elapsed = performance.now() - start;
        setTrainProgress(Math.min(100, (elapsed / trainDuration) * 100));
        if (elapsed < trainDuration) {
          trainTimerRef.current = requestAnimationFrame(collect);
        } else {
          // Finalize: average and normalize spectrum
          let avg = Array.from(freqSum, x => x / frames);
          const norm = Math.sqrt(avg.reduce((sum, v) => sum + v * v, 0));
          if (norm > 0) avg = avg.map(x => x / norm);
          setSpectrumTemplate(avg);
          setIsTraining(false);
          setLiveFeedback('Trained!');
          // Cleanup
          stream.getTracks().forEach(t => t.stop());
          audioContext.close();
          setLiveSpectrum(null);
          setTrainProgress(0);
        }
      }
      collect();
    } catch (e) {
      setIsTraining(false);
      setLiveFeedback('Mic error');
      setLiveSpectrum(null);
      setTrainProgress(0);
    }
  };

  const handleSave = () => {
    onSave({
      enabled,
      spectrumTemplate,
      sensitivity,
      amplitudeThreshold,
    });
  };

  const handleReset = () => {
    setEnabled(initialEnabled);
    setSpectrumTemplate(initialSpectrumTemplate);
    setSensitivity(initialSensitivity);
    setLiveFeedback('');
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{`Settings for ${drum.charAt(0).toUpperCase() + drum.slice(1)}`}</DialogTitle>
      <DialogContent>
        <>
          <Box mb={2}>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
              label="Enable Drum"
            />
          </Box>
          {/* No frequency range slider for pattern-based detection */}
          <Box mb={2}>
            <Typography gutterBottom>Sensitivity (Similarity Threshold)</Typography>
            <Slider
              value={sensitivity}
              onChange={(_, v) => setSensitivity(v as number)}
              valueLabelDisplay="auto"
              min={0.5}
              max={0.99}
              step={0.01}
            />
          </Box>
          <Box mb={2}>
            <Typography gutterBottom>Amplitude Threshold</Typography>
            <Slider
              value={amplitudeThreshold}
              onChange={(_, v) => setAmplitudeThreshold(v as number)}
              valueLabelDisplay="auto"
              min={0.01}
              max={0.5}
              step={0.01}
            />
          </Box>
          <Box mb={2} display="flex" alignItems="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<HearingIcon />}
              onClick={handleTrain}
              disabled={isTraining}
            >
              Train by Listening
            </Button>
            {isTraining && (
              <Box sx={{ minWidth: 80 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Box sx={{ width: 60, mt: 1 }}>
                  <Box sx={{ height: 6, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ height: 6, bgcolor: '#1976d2', width: `${trainProgress}%`, transition: 'width 0.1s' }} />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          {/* Live spectrum during training, template after */}
          {isTraining && liveSpectrum && (
            <FrequencySpectrum
              spectrum={liveSpectrum}
              width={260}
              height={60}
            />
          )}
          {!isTraining && spectrumTemplate && (
            <FrequencySpectrum
              spectrum={Uint8Array.from(spectrumTemplate.map(x => Math.round(x * 255)))}
              width={260}
              height={60}
            />
          )}
          {liveFeedback && <Typography variant="body2">{liveFeedback}</Typography>}
          <Button onClick={handleReset} size="small">Reset to Default</Button>
        </>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DrumSettingsModal;
