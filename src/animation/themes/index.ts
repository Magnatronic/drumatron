

import { spaceTheme } from './SpaceAnimation';
import { underwaterTheme } from './UnderwaterAnimation';
import { classicTheme } from './ClassicAnimation';

// Allow overlay property for classicTheme
export type ThemeModule = typeof spaceTheme & { overlay?: React.FC<any> };

export const themeRegistry: Record<string, ThemeModule> = {
  space: spaceTheme,
  underwater: underwaterTheme,
  classic: classicTheme,
};
