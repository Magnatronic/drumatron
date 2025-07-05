import React, { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Typography, Tooltip, Stack } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
// Drum icons replaced with first letter avatars
import Avatar from '@mui/material/Avatar';
import StarsIcon from '@mui/icons-material/Stars'; // Space theme
import WavesIcon from '@mui/icons-material/Waves'; // Underwater theme
import PaletteIcon from '@mui/icons-material/Palette'; // Classic theme
import SettingsIcon from '@mui/icons-material/Settings';

import type { DrumType } from './DrumVisualizer';
import DrumSettingsModal from './DrumSettingsModal';

// Drum icon avatar generator for highlight effect (subtle blue highlight)
const getDrumAvatar = (drum: DrumType, active: boolean) => (
  <Avatar
    sx={{
      bgcolor: active ? 'rgba(25, 118, 210, 0.20)' : 'rgba(255,255,255,0.10)', // #1976d2 at 20% opacity
      color: '#fff',
      width: 36,
      height: 36,
      fontWeight: 700,
      fontSize: 22,
      border: active ? '2px solid rgba(25, 118, 210, 0.7)' : undefined,
      boxShadow: undefined,
      transition: 'all 0.2s',
    }}
    aria-label={drum.charAt(0).toUpperCase()}
  >
    {drum.charAt(0).toUpperCase()}
  </Avatar>
);


// Theme icon avatar generator for highlight effect
const getThemeAvatar = (theme: string, active: boolean) => {
  let icon: React.ReactNode = null;
  const blue = '#1976d2';
  const white = '#fff';
  const gray = '#232526';
  if (theme === 'space') icon = <StarsIcon fontSize="large" sx={{ color: white }} />;
  else if (theme === 'underwater') icon = <WavesIcon fontSize="large" sx={{ color: white }} />;
  else if (theme === 'classic') icon = <PaletteIcon fontSize="large" sx={{ color: white }} />;
  return (
    <Avatar
      sx={{
        bgcolor: active ? 'rgba(25, 118, 210, 0.20)' : 'rgba(255,255,255,0.10)',
        color: white,
        width: 36,
        height: 36,
        border: active ? `2px solid ${blue}` : undefined,
        boxShadow: undefined,
        transition: 'all 0.2s',
        fontSize: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0.7,
      }}
      aria-label={theme.charAt(0).toUpperCase() + theme.slice(1)}
    >
      {icon}
    </Avatar>
  );
};

export type DrumSettings = {
  enabled: boolean;
  spectrumTemplate?: number[]; // normalized average spectrum
  sensitivity: number; // similarity threshold (0.7–0.99)
  amplitudeThreshold?: number; // minimum amplitude (RMS) required
};

export interface TopBarProps {
  activeDrums: DrumType[];
  onToggleDrum: (drum: DrumType) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  themes: string[];
  onSettings: () => void;
  drumSettings?: Partial<Record<DrumType, DrumSettings>>;
  onDrumSettingsChange?: (drum: DrumType, settings: DrumSettings) => void;
}


export const TopBar: React.FC<TopBarProps> = ({
  activeDrums,
  onToggleDrum,
  theme,
  onThemeChange,
  themes,
  onSettings,
  drumSettings = {},
  onDrumSettingsChange,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDrum, setSelectedDrum] = useState<DrumType | null>(null);

  const handleDrumIconClick = (drum: DrumType) => {
    setSelectedDrum(drum);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDrum(null);
  };

  const handleModalSave = (settings: DrumSettings) => {
    if (selectedDrum && onDrumSettingsChange) {
      onDrumSettingsChange(selectedDrum, settings);
    }
    handleModalClose();
  };

  return (
    <AppBar position="static" elevation={2} sx={{ width: '100vw', left: 0, right: 0, bgcolor: '#232526', color: '#fff', backgroundImage: 'none' }}>
      <Toolbar
        sx={{
          width: '100%',
          maxWidth: '100vw',
          mx: 'auto',
          justifyContent: 'center',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          px: { xs: 1, sm: 2 },
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <MusicNoteIcon fontSize="large" sx={{ mr: { xs: 1, sm: 2 } }} />
        {/* Drum icons with subtle background and settings */}
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.10)',
          borderRadius: 3,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          boxShadow: 1,
          mr: { xs: 1, sm: 2 },
        }}>
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center" flexWrap="wrap">
            {(['kick', 'snare', 'hihat', 'tom', 'cymbal'] as DrumType[]).map((drum) => (
              <Tooltip key={drum} title={drum.charAt(0).toUpperCase() + drum.slice(1)}>
                <IconButton
                  onClick={() => handleDrumIconClick(drum)}
                  size={window.innerWidth < 600 ? 'medium' : 'large'}
                  sx={{
                    mx: { xs: 0, sm: 0.5 },
                    p: { xs: 0.5, sm: 1 },
                    borderRadius: 2,
                    boxShadow: undefined,
                    transition: 'box-shadow 0.2s',
                  }}
                  aria-pressed={activeDrums.includes(drum)}
                >
                  {getDrumAvatar(drum, activeDrums.includes(drum))}
                </IconButton>
              </Tooltip>
            ))}
            {/* Drum Settings Modal */}
            {selectedDrum && (
              <DrumSettingsModal
                open={modalOpen}
                drum={selectedDrum}
                initialEnabled={drumSettings[selectedDrum]?.enabled ?? true}
                initialSpectrumTemplate={drumSettings[selectedDrum]?.spectrumTemplate}
                initialSensitivity={drumSettings[selectedDrum]?.sensitivity ?? 0.85}
                onClose={handleModalClose}
                initialAmplitudeThreshold={drumSettings[selectedDrum]?.amplitudeThreshold ?? 0.1}
                onSave={handleModalSave}
              />
            )}
            {/* Settings icon inside drum group */}
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={onSettings} size={window.innerWidth < 600 ? 'medium' : 'large'}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        {/* Theme icons with subtle background */}
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.10)',
          borderRadius: 3,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          boxShadow: 1,
          mr: { xs: 1, sm: 2 },
        }}>
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center" flexWrap="wrap">
            {themes.map((t) => (
              <Tooltip key={t} title={t.charAt(0).toUpperCase() + t.slice(1)}>
                <IconButton
                  onClick={() => onThemeChange(t)}
                  size={window.innerWidth < 600 ? 'medium' : 'large'}
                  sx={{
                    mx: { xs: 0, sm: 0.5 },
                    p: { xs: 0.5, sm: 1 },
                    borderRadius: 2,
                    boxShadow: undefined,
                    transition: 'box-shadow 0.2s',
                  }}
                  aria-pressed={theme === t}
                >
                  {getThemeAvatar(t, theme === t)}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </Box>
        {/* Settings icon on right removed; now only in drum group */}
      </Toolbar>
    </AppBar>
  );
};
