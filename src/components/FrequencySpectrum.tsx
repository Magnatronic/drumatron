import React from 'react';
import { Box } from '@mui/material';

export interface FrequencySpectrumProps {
  spectrum: Uint8Array;
  peakIndex?: number;
  selectedRange?: [number, number]; // [minBin, maxBin]
  width?: number;
  height?: number;
}

const barColor = '#90caf9';
const peakColor = '#f44336';
const rangeColor = 'rgba(76, 175, 80, 0.3)';

export const FrequencySpectrum: React.FC<FrequencySpectrumProps> = ({
  spectrum,
  peakIndex,
  selectedRange,
  width = 240,
  height = 60,
}) => {
  const binCount = spectrum.length;
  return (
    <Box sx={{ width, height, position: 'relative', mt: 1, mb: 1 }}>
      <svg width={width} height={height}>
        {/* Highlight selected range */}
        {selectedRange && (
          <rect
            x={(selectedRange[0] / binCount) * width}
            y={0}
            width={((selectedRange[1] - selectedRange[0]) / binCount) * width}
            height={height}
            fill={rangeColor}
          />
        )}
        {/* Draw spectrum bars */}
        {Array.from(spectrum).map((v, i) => (
          <rect
            key={i}
            x={(i / binCount) * width}
            y={height - (v / 255) * height}
            width={width / binCount}
            height={(v / 255) * height}
            fill={i === peakIndex ? peakColor : barColor}
          />
        ))}
      </svg>
    </Box>
  );
};
