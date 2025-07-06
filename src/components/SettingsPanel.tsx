import { Box, Typography, FormGroup, FormControlLabel, Switch, Slider } from '@mui/material';
import React from 'react';
import type { InstrumentType } from './InstrumentVisualizer';
// import { PerInstrumentCalibration } from './index';

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
  const instruments: InstrumentType[] = ['kick', 'snare', 'hihat', 'tom', 'cymbal'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Instrument Detection Settings
      </Typography>
      <FormGroup row sx={{ mb: 2 }}>
        {instruments.map((instrument) => (
          <FormControlLabel
            key={instrument}
            control={
              <Switch
                checked={activeInstruments.includes(instrument)}
                onChange={() => onToggleInstrument(instrument)}
                color="primary"
              />
            }
            label={instrument.charAt(0).toUpperCase() + instrument.slice(1)}
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
      {/* Per-instrument calibration UI moved to InstrumentSettingsModal */}
    </Box>
  );
};
