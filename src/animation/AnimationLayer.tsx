import React from 'react';
import { useAnimation } from './AnimationContext';
import { instruments } from '../components/instrumentConfig';
import type { InstrumentType } from '../components/instrumentConfig';
import { themeRegistry } from './themes';

// Accepts matchScores and thresholds as props for overlays that use them
export const AnimationLayer: React.FC<{
  matchScores?: Partial<Record<InstrumentType, number>>;
  instrumentSettings?: Partial<Record<InstrumentType, { sensitivity: number }>>;
}> = ({ matchScores, instrumentSettings }) => {
  const { theme } = useAnimation();
  const themeObj = themeRegistry[theme] || themeRegistry['classic'];
  const Background = themeObj.background;
  const Overlay = themeObj.overlay;

  // Build per-instrument thresholds from instrumentSettings
  const thresholds: Partial<Record<InstrumentType, number>> = {};
  if (instrumentSettings) {
    for (const instrument of instruments) {
      const s = instrumentSettings[instrument];
      if (s && typeof s.sensitivity === 'number') {
        thresholds[instrument] = s.sensitivity;
      }
    }
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <Background />
      {Overlay ? <Overlay matchScores={matchScores} thresholds={thresholds} /> : null}
    </div>
  );
};
