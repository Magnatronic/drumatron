import { Box, Typography, FormGroup, FormControlLabel, Switch, Slider } from '@mui/material';
import React from 'react';
import type { InstrumentType } from './InstrumentVisualizer';
import { instrumentConfig, instruments } from './instrumentConfig';

export interface SettingsPanelProps {
  activeInstruments: InstrumentType[];
  onToggleInstrument: (instrument: InstrumentType) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  perInstrumentNoise?: Record<InstrumentType, number>;
  onPerInstrumentCalibrate?: (instrument: InstrumentType, noiseLevel: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  activeInstruments,
  onToggleInstrument,
  sensitivity,
  onSensitivityChange,
  // perInstrumentNoise = { kick: 0, snare: 0, hihat: 0, tom: 0, cymbal: 0 },
  // onPerInstrumentCalibrate,
}) => {
  // ...existing code...

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Instrument Detection Settings
      </Typography>
      <FormGroup row sx={{ mb: 2 }}>
        {instruments.map((instrument) => {
          const { label, icon: IconComponent, color } = instrumentConfig[instrument];
          return (
            <FormControlLabel
              key={instrument}
              control={
                <Switch
                  checked={activeInstruments.includes(instrument)}
                  onChange={() => onToggleInstrument(instrument)}
                  color="primary"
                  inputProps={{ 'aria-label': label }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconComponent sx={{ color, fontSize: 22 }} />
                  <span>{label}</span>
                </Box>
              }
            />
          );
        })}
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
      {/* Per-instrument calibration UI moved to InstrumentSettingsModal */}
    </Box>
  );
};
