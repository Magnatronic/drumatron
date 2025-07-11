import OilBarrelIcon from '@mui/icons-material/OilBarrel';
export type InstrumentType = 'drum1' | 'drum2' | 'drum3' | 'drum4' | 'drum5';

export type InstrumentCategory = 'drum' | 'voice' | 'guitar' | 'piano' | 'other';

export interface InstrumentSlotConfig {
  label: string;
  icon: typeof OilBarrelIcon;
  color: string;
  type: InstrumentCategory;
  detection?: 'default' | 'pitch' | 'onset' | 'ml' | string; // for future algorithm selection
}

export const instrumentConfig: Record<InstrumentType, InstrumentSlotConfig> = {
  drum1: { label: 'Drum 1', icon: OilBarrelIcon, color: '#1976d2', type: 'drum', detection: 'default' }, // blue
  drum2: { label: 'Drum 2', icon: OilBarrelIcon, color: '#d32f2f', type: 'drum', detection: 'default' }, // red
  drum3: { label: 'Drum 3', icon: OilBarrelIcon, color: '#8e24aa', type: 'drum', detection: 'default' }, // purple (was yellow)
  drum4: { label: 'Drum 4', icon: OilBarrelIcon, color: '#388e3c', type: 'drum', detection: 'default' }, // green
  drum5: { label: 'Drum 5', icon: OilBarrelIcon, color: '#ffa000', type: 'drum', detection: 'default' }, // orange
};

export const instruments: InstrumentType[] = Object.keys(instrumentConfig) as InstrumentType[];
