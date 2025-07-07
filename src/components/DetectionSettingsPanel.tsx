import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { DetectionSettings } from './detectionTypes';

interface DetectionSettingsPanelProps {
  settings: DetectionSettings;
  onChange: (settings: DetectionSettings) => void;
  currentNoiseFloor: number;
}

export const DetectionSettingsPanel: React.FC<DetectionSettingsPanelProps> = ({
  settings,
  onChange,
  currentNoiseFloor,
}) => {
  const handleChange = (field: keyof DetectionSettings, value: number | string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  const getAdaptationSamples = (speed: string) => {
    switch (speed) {
      case 'fast': return 50;
      case 'slow': return 200;
      default: return 100;
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔊 Audio Detection
      </Typography>
      
      {/* Basic Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Trigger Cooldown
        </Typography>
        <Slider
          value={settings.debounceMs}
          onChange={(_, value) => handleChange('debounceMs', value as number)}
          min={100}
          max={500}
          step={50}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}ms`}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Time between triggers for the same instrument (prevents double-hitting)
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Background Noise Sensitivity
        </Typography>
        <Slider
          value={settings.snrThreshold}
          onChange={(_, value) => handleChange('snrThreshold', value as number)}
          min={1.5}
          max={5.0}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value.toFixed(1)}x`}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          How much louder than background noise sounds must be
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Minimum Volume
        </Typography>
        <Slider
          value={settings.minAmplitude}
          onChange={(_, value) => handleChange('minAmplitude', value as number)}
          min={10}
          max={100}
          step={5}
          valueLabelDisplay="auto"
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Minimum sound level required to trigger detection
        </Typography>
      </Box>

      {/* Advanced Settings */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">🔧 Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Manual Noise Floor Override
            </Typography>
            <Slider
              value={settings.manualNoiseFloor}
              onChange={(_, value) => handleChange('manualNoiseFloor', value as number)}
              min={0}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value === 0 ? 'Auto' : value.toString()}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              0 = Automatic detection, 1-50 = Manual override
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Adaptation Speed</InputLabel>
              <Select
                value={settings.adaptationSpeed}
                onChange={(e) => handleChange('adaptationSpeed', e.target.value)}
                label="Adaptation Speed"
              >
                <MenuItem value="fast">Fast ({getAdaptationSamples('fast')} samples)</MenuItem>
                <MenuItem value="normal">Normal ({getAdaptationSamples('normal')} samples)</MenuItem>
                <MenuItem value="slow">Slow ({getAdaptationSamples('slow')} samples)</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              How quickly the system adapts to changing background noise
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Noise Floor: ${currentNoiseFloor.toFixed(1)}`}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                label={`Using: ${settings.manualNoiseFloor === 0 ? 'Auto' : 'Manual'}`}
                size="small"
                color={settings.manualNoiseFloor === 0 ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
