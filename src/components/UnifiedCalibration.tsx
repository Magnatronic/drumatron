import { Box, LinearProgress, Typography, Button, Alert, Chip } from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import type { InstrumentType } from './instrumentConfig';
import { instrumentConfig } from './instrumentConfig';
import type { DetectionSettings } from './detectionTypes';

export interface UnifiedCalibrationProps {
  instruments: InstrumentType[];
  onCalibrate: (noiseFloors: Record<InstrumentType, number>) => void;
  calibrateButtonId?: string;
  detectionSettings?: DetectionSettings;
  onDetectionSettingsChange?: (settings: DetectionSettings) => void;
  // Modal mode props
  isModal?: boolean;
  singleInstrument?: InstrumentType;
}

export const UnifiedCalibration: React.FC<UnifiedCalibrationProps> = ({ 
  instruments, 
  onCalibrate, 
  calibrateButtonId, 
  detectionSettings, 
  onDetectionSettingsChange,
  isModal = false,
  singleInstrument
}) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState<Record<InstrumentType, number>>({} as Record<InstrumentType, number>);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const sampleDuration = 1500; // ms

  const cleanup = () => {
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleCalibrate = async () => {
    setCalibrating(true);
    setProgress(0);
    setError(null);
    cleanup();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const overallNoiseSamples: number[] = [];
      
      const start = Date.now();
      
      function sample() {
        analyser.getByteFrequencyData(data);
        
        // Calculate overall noise level (RMS of all frequencies)
        const overallNoise = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
        overallNoiseSamples.push(overallNoise);
        
        setProgress(Math.min(100, ((Date.now() - start) / sampleDuration) * 100));
        
        if (Date.now() - start < sampleDuration) {
          animationFrameRef.current = requestAnimationFrame(sample);
        } else {
          // Use overall noise level for all instruments
          const overallNoiseAvg = overallNoiseSamples.reduce((a, b) => a + b, 0) / overallNoiseSamples.length;
          const normalizedNoise = Math.max(0.1, overallNoiseAvg / 255); // normalize to 0-1 range
          
          const result: Record<InstrumentType, number> = {} as Record<InstrumentType, number>;
          instruments.forEach((instrument) => {
            result[instrument as InstrumentType] = normalizedNoise;
          });
          
          setCalibrated(result);
          setCalibrating(false);
          onCalibrate(result);
          
          // Auto-update detection settings with calibrated noise floor (if available)
          if (detectionSettings && onDetectionSettingsChange) {
            const suggestedNoiseFloor = Math.round(overallNoiseAvg);
            onDetectionSettingsChange({
              ...detectionSettings,
              manualNoiseFloor: suggestedNoiseFloor
            });
          }
          
          cleanup();
        }
      }
      
      sample();
    } catch (err: any) {
      setError('Microphone access denied or unavailable. Please check your device settings.');
      setCalibrating(false);
      cleanup();
    }
  };

  // Display logic for modal vs main panel
  const displayInstruments = isModal && singleInstrument ? [singleInstrument] : instruments;
  const title = isModal 
    ? `Calibrate ${instrumentConfig[singleInstrument!]?.label || 'Instrument'}`
    : 'Calibrate All Instruments (Background Noise)';
  
  const description = isModal
    ? 'Measure background noise for optimal detection'
    : calibrating 
      ? 'Measuring ambient noise levels...' 
      : 'Measure environmental noise to improve sound detection accuracy';

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant={isModal ? "body2" : "subtitle2"} gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {description}
      </Typography>
      
      <Button
        variant="outlined"
        onClick={handleCalibrate}
        disabled={calibrating}
        sx={{ mb: 1 }}
        id={calibrateButtonId}
        aria-busy={calibrating}
        size={isModal ? "small" : "medium"}
      >
        {calibrating ? 'Calibrating...' : 'Calibrate'}
      </Button>
      
      {calibrating && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 5, mb: 1 }}
          aria-label="Calibration progress"
        />
      )}
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      
      {Object.keys(calibrated).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
            ✓ Calibration Complete
          </Typography>
          
          {!isModal && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {displayInstruments.map((instrument) => (
                <Chip
                  key={instrument}
                  label={`${instrumentConfig[instrument as InstrumentType].label}: ${(calibrated[instrument as InstrumentType] * 100).toFixed(1)}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
          
          {isModal && singleInstrument && (
            <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
              Background noise: {(calibrated[singleInstrument] * 100).toFixed(1)}
            </Typography>
          )}
          
          {detectionSettings && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Detection settings updated automatically with calibrated noise floor: {detectionSettings.manualNoiseFloor}/255 
              (avg: {((detectionSettings.manualNoiseFloor / 255) * 100).toFixed(1)})
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UnifiedCalibration;
