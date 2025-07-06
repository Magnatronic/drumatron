import React from 'react';
import { useAnimation } from './AnimationContext';
import { instrumentConfig, instruments } from '../components/instrumentConfig';
import { themeRegistry } from './themes';

// Accepts matchScores and thresholds as props for overlays that use them
import type { InstrumentType, InstrumentCategory } from '../components/instrumentConfig';

export const AnimationLayer: React.FC<{
  matchScores?: Partial<Record<InstrumentType, number>>;
  instrumentSettings?: Partial<Record<InstrumentType, { sensitivity: number }>>;
}> = ({ matchScores, instrumentSettings }) => {
  const { theme, lastTriggers } = useAnimation();
  const themeObj = themeRegistry[theme] || themeRegistry['classic'];
  const Background = themeObj.background;
  const Overlay = themeObj.overlay;
  const slotEffects = themeObj.slotEffects as Partial<Record<InstrumentType, React.FC<any>>> || {};
  const typeEffects = themeObj.typeEffects as Partial<Record<InstrumentCategory, React.FC<any>>> || {};
  const DefaultEffect = themeObj.defaultEffect || (() => null);
  const Provider = (themeObj as any).provider as React.FC<{children: React.ReactNode}> | undefined;

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

  // Show only recent triggers (e.g., last 1s)
  const now = Date.now();
  const recentTriggers = lastTriggers.filter(t => now - t.timestamp < 1000);

  // Render slot/type/default effects for each recent trigger
  const effectElements = recentTriggers.map((trigger) => {
    const { instrument, timestamp } = trigger;
    // Prefer slotEffect, then typeEffect, then defaultEffect
    const SlotEffect = slotEffects[instrument];
    const type = instrumentConfig[instrument]?.type;
    const TypeEffect = type && typeEffects[type];
    const EffectComp = SlotEffect || TypeEffect || DefaultEffect;
    // Key by instrument and timestamp for uniqueness
    return EffectComp ? <EffectComp key={instrument + '-' + timestamp} /> : null;
  });

  const content = (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <Background />
      {Overlay ? React.createElement(Overlay as any, { matchScores, thresholds }) : null}
      {effectElements}
    </div>
  );
  return Provider ? <Provider>{content}</Provider> : content;
};
