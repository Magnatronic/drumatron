import React from 'react';
import { useAnimation } from './AnimationContext';
import { instrumentConfig } from '../components/instrumentConfig';
import { themeRegistry } from './themes';

// Placeholder for theme and instrument animation rendering
export const AnimationLayer: React.FC = () => {
  const { theme, lastTriggers } = useAnimation();
  const themeObj = themeRegistry[theme] || themeRegistry['classic'];
  const Background = themeObj.background;

  // Find the most recent instrument trigger
  const last = lastTriggers.length > 0 ? lastTriggers[lastTriggers.length - 1] : null;
  let Effect: React.FC | null = null;
  if (last) {
    const slotKey = last.instrument;
    const type = instrumentConfig[slotKey]?.type;
    Effect =
      (themeObj.slotEffects && themeObj.slotEffects[slotKey]) ||
      (type && themeObj.typeEffects && themeObj.typeEffects[type]) ||
      themeObj.defaultEffect ||
      null;
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <Background />
      {Effect && <Effect />}
    </div>
  );
};
