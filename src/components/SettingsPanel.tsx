import { Box, Typography, FormGroup, FormControlLabel, Switch, Slider, Select, MenuItem, InputLabel } from '@mui/material';
import React from 'react';
import type { DrumType } from './DrumVisualizer';

export interface SettingsPanelProps {
  activeDrums: DrumType[];
  onToggleDrum: (drum: DrumType) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

const themes = [
  { value: 'classic', label: 'Classic' },
  { value: 'space', label: 'Space' },
  { value: 'underwater', label: 'Underwater' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  activeDrums,
  onToggleDrum,
  sensitivity,
  onSensitivityChange,
}) => {
  const drums: DrumType[] = ['kick', 'snare', 'hihat', 'tom', 'cymbal'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Drum Detection Settings
      </Typography>
      <FormGroup row sx={{ mb: 2 }}>
        {drums.map((drum) => (
          <FormControlLabel
            key={drum}
            control={
              <Switch
                checked={activeDrums.includes(drum)}
                onChange={() => onToggleDrum(drum)}
                color="primary"
              />
            }
            label={drum.charAt(0).toUpperCase() + drum.slice(1)}
          />
        ))}
      </FormGroup>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Sensitivity</Typography>
        <Slider
          value={sensitivity}
          onChange={(_, v) => onSensitivityChange(v as number)}
          min={1}
          max={10}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
};
