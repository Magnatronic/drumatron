



import { spaceTheme } from './SpaceAnimation';
import { underwaterTheme } from './UnderwaterAnimation';
import { classicTheme } from './ClassicAnimation';
import type { InstrumentType } from '../../components/instrumentConfig';

// Define the props expected by overlays (as used in AnimationLayer)
export type ThemeOverlayProps = {
  matchScores?: Partial<Record<InstrumentType, number>>;
  thresholds?: Partial<Record<InstrumentType, number>>;
};

// Base theme type: required properties for all themes
type ThemeBase = {
  background: React.FC<any>;
  slotEffects: Record<string, React.FC<any>>;
  typeEffects: Record<string, React.FC<any>>;
  defaultEffect: React.FC<any>;
};

// ThemeModule: common base, optional provider and overlay
export type ThemeModule = ThemeBase & {
  provider?: React.FC<{ children: React.ReactNode }>;
  overlay?: React.FC<ThemeOverlayProps>;
};

export const themeRegistry: Record<string, ThemeModule> = {
  space: spaceTheme,
  underwater: underwaterTheme,
  classic: classicTheme,
};
