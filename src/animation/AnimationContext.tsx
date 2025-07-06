import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import type { InstrumentType } from '../components/instrumentConfig';

export interface AnimationTrigger {
  instrument: InstrumentType;
  timestamp: number;
}

interface AnimationContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  triggerInstrumentAnimation: (instrument: InstrumentType) => void;
  lastTriggers: AnimationTrigger[];
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

export const useAnimation = () => {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error('useAnimation must be used within AnimationProvider');
  return ctx;
};

export const AnimationProvider: React.FC<{ theme: string; setTheme: (theme: string) => void; children: ReactNode }> = ({ theme, setTheme, children }) => {
  const [lastTriggers, setLastTriggers] = useState<AnimationTrigger[]>([]);
  const triggerInstrumentAnimation = (instrument: InstrumentType) => {
    setLastTriggers((prev) => [...prev, { instrument, timestamp: Date.now() }]);
  };
  return (
    <AnimationContext.Provider value={{ theme, setTheme, triggerInstrumentAnimation, lastTriggers }}>
      {children}
    </AnimationContext.Provider>
  );
};
