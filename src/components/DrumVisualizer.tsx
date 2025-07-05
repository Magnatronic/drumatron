import { Box, Typography } from '@mui/material';
import React from 'react';

export type DrumType = 'kick' | 'snare' | 'hihat' | 'tom' | 'cymbal';

import type { DrumMatchScores } from './useDrumDetection';
export interface DrumVisualizerProps {
  activeDrums: DrumType[];
  lastHit: DrumType | null;
  theme: string;
  matchScores?: DrumMatchScores;
}

const drumColors: Record<DrumType, string> = {
  kick: '#1976d2',
  snare: '#d32f2f',
  hihat: '#fbc02d',
  tom: '#388e3c',
  cymbal: '#ffa000',
};

export const DrumVisualizer: React.FC<DrumVisualizerProps> = ({ activeDrums, lastHit, theme, matchScores }) => {
  // Placeholder for theme-based backgrounds
  const themeBg = theme === 'space' ? 'radial-gradient(circle, #232526 0%, #414345 100%)' :
    theme === 'underwater' ? 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)' : '#f5f5f5';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        bgcolor: themeBg,
        borderRadius: 4,
        p: 2,
        transition: 'background 0.5s',
      }}
    >
      {activeDrums.map((drum) => (
        <Box
          key={drum}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: drumColors[drum],
            opacity: lastHit === drum ? 1 : 0.5,
            boxShadow: lastHit === drum ? `0 0 32px 8px ${drumColors[drum]}` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            transition: 'all 0.3s',
          }}
        >
          <Typography variant="h6" color="#fff" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
            {drum}
          </Typography>
          {matchScores && matchScores[drum] !== undefined && (
            <Box sx={{ width: 56, mt: 1 }}>
              <Box sx={{ height: 6, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: 6, bgcolor: '#1976d2', width: `${Math.round((matchScores[drum] ?? 0) * 100)}%`, transition: 'width 0.1s' }} />
              </Box>
              <Typography variant="caption" color="#fff" sx={{ fontSize: 12 }}>
                {Math.round((matchScores[drum] ?? 0) * 100)}%
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
