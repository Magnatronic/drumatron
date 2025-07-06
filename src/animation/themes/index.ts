
import { spaceTheme } from './SpaceAnimation';
import { underwaterTheme } from './UnderwaterAnimation';
import { classicTheme } from './ClassicAnimation';

export type ThemeModule = typeof spaceTheme;

export const themeRegistry: Record<string, ThemeModule> = {
  space: spaceTheme,
  underwater: underwaterTheme,
  classic: classicTheme,
};
