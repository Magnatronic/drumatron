import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Star {
  x: number;
  y: number;
  r: number;
  color: string;
  pulse?: {
    start: number;
    duration: number;
  };
}

interface SpaceStarContextValue {
  stars: Star[];
  pulseStars: (indices: number[], duration?: number) => void;
}

const SpaceStarContext = createContext<SpaceStarContextValue | undefined>(undefined);

export const useSpaceStars = () => {
  const ctx = useContext(SpaceStarContext);
  if (!ctx) throw new Error('useSpaceStars must be used within SpaceStarProvider');
  return ctx;
};

const STAR_COUNT = 120;
const STAR_COLORS = ['#fff', '#b5e3ff', '#ffe7b5', '#b5ffd6'];

export const SpaceStarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stars, setStars] = useState<Star[]>(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 0.8 + 0.7,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }))
  );

  // Pulse a group of stars by index
  const pulseStars = useCallback((indices: number[], duration = 1600) => {
    setStars(prev => prev.map((star, i) =>
      indices.includes(i)
        ? { ...star, pulse: { start: performance.now(), duration } }
        : star
    ));
  }, []);

  // Remove pulse after duration
  React.useEffect(() => {
    if (!stars.some(s => s.pulse)) return;
    const raf = requestAnimationFrame(() => {
      setStars(prev => prev.map(star => {
        if (!star.pulse) return star;
        if (performance.now() - star.pulse.start > star.pulse.duration) {
          const { pulse, ...rest } = star;
          return rest;
        }
        return star;
      }));
    });
    return () => cancelAnimationFrame(raf);
  }, [stars]);

  return (
    <SpaceStarContext.Provider value={{ stars, pulseStars }}>
      {children}
    </SpaceStarContext.Provider>
  );
};
