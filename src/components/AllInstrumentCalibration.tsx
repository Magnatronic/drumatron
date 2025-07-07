// Renamed from AllDrumCalibration.tsx to AllInstrumentCalibration.tsx
// Instrument-agnostic calibration component
// DEPRECATED: Use UnifiedCalibration instead for new implementations
import React from 'react';
import { UnifiedCalibration } from './UnifiedCalibration';
import type { InstrumentType } from './instrumentConfig';
import type { DetectionSettings } from './detectionTypes';

export interface AllInstrumentCalibrationProps {
  instruments: InstrumentType[];
  onCalibrate: (noiseFloors: Record<InstrumentType, number>) => void;
  calibrateButtonId?: string;
  detectionSettings: DetectionSettings;
  onDetectionSettingsChange: (settings: DetectionSettings) => void;
}

export const AllInstrumentCalibration: React.FC<AllInstrumentCalibrationProps> = (props) => {
  return <UnifiedCalibration {...props} isModal={false} />;
};

export default AllInstrumentCalibration;
