import { AllDrumCalibration } from './components/AllDrumCalibration';


import { Box, Container, CssBaseline, Drawer } from '@mui/material';
import { TopBar } from './components/TopBar';
import type { DrumSettings } from './components/TopBar';
import { useState, useCallback } from 'react';
import { DrumVisualizer } from './components/DrumVisualizer';
import type { DrumType } from './components/DrumVisualizer';
import { useDrumDetection } from './components/useDrumDetection';
import type { DrumMatchScores } from './components/useDrumDetection';
import { SettingsPanel } from './components/SettingsPanel';


function App() {
  // Live match scores for debugging
  const [matchScores, setMatchScores] = useState<DrumMatchScores>({});
  // State for drum visualizer and settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeDrums, setActiveDrums] = useState<DrumType[]>(['kick', 'snare', 'hihat', 'tom', 'cymbal']);
  const [sensitivity, setSensitivity] = useState(5);
  const [theme, setTheme] = useState('classic');
  const [lastHit, setLastHit] = useState<DrumType | null>(null);
  // const [noiseFloor, setNoiseFloor] = useState(0); // Unused
  const [perDrumNoise, setPerDrumNoise] = useState<Record<DrumType, number>>({
    kick: 0,
    snare: 0,
    hihat: 0,
    tom: 0,
    cymbal: 0,
  });
  // Per-drum settings state
  const [drumSettings, setDrumSettings] = useState<Partial<Record<DrumType, DrumSettings>>>({
    kick: { enabled: true, sensitivity: 0.85 },
    snare: { enabled: true, sensitivity: 0.85 },
    hihat: { enabled: true, sensitivity: 0.85 },
    tom: { enabled: true, sensitivity: 0.85 },
    cymbal: { enabled: true, sensitivity: 0.85 },
  });

  // Drum detection hook
  const handleDrumHit = useCallback((drum: DrumType) => {
    setLastHit(drum);
  }, []);
  useDrumDetection({
    activeDrums,
    sensitivity,
    noiseFloor: undefined, // not used for per-drum
    onDrumHit: handleDrumHit,
    perDrumNoise,
    drumSettings,
    setMatchScores,
  });

  // Handlers for settings
  const handleToggleDrum = (drum: DrumType) => {
    setActiveDrums((prev) =>
      prev.includes(drum) ? prev.filter((d) => d !== drum) : [...prev, drum]
    );
  };

  // Per-drum settings change handler
  const handleDrumSettingsChange = (drum: DrumType, settings: DrumSettings) => {
    setDrumSettings((prev) => ({ ...prev, [drum]: settings }));
    // Also update activeDrums if enabled/disabled
    setActiveDrums((prev) => {
      if (settings.enabled && !prev.includes(drum)) return [...prev, drum];
      if (!settings.enabled && prev.includes(drum)) return prev.filter((d) => d !== drum);
      return prev;
    });
  };

  // Placeholder for drum hit simulation (to be replaced with mic detection)
  // Simulate a drum hit every 2 seconds for demo
  /*
  useEffect(() => {
    const drums = activeDrums;
    if (drums.length === 0) return;
    const interval = setInterval(() => {
      setLastHit(drums[Math.floor(Math.random() * drums.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [activeDrums]);
  */

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      {/* TopBar with all controls */}
      <TopBar
        activeDrums={activeDrums}
        onToggleDrum={handleToggleDrum}
        theme={theme}
        onThemeChange={setTheme}
        themes={['classic', 'space', 'underwater']}
        onSettings={() => setSettingsOpen(true)}
        drumSettings={drumSettings}
        onDrumSettingsChange={handleDrumSettingsChange}
      />

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Calibration & Drum Visualizer */}
        {/* Drum Visualizer */}
        <DrumVisualizer activeDrums={activeDrums} lastHit={lastHit} theme={theme} matchScores={matchScores} />

        {/* Settings Drawer */}
        <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <Box sx={{ width: 340, p: 3 }} role="presentation">
            <SettingsPanel
              activeDrums={activeDrums}
              onToggleDrum={handleToggleDrum}
              sensitivity={sensitivity}
              onSensitivityChange={setSensitivity}
            />
            <AllDrumCalibration
              drums={activeDrums}
              onCalibrate={(noiseFloors) => {
                setPerDrumNoise(noiseFloors);
                const avg = Object.values(noiseFloors).reduce((a, b) => a + b, 0) / Object.values(noiseFloors).length;
                // setNoiseFloor(avg); // Unused, safe to remove
              }}
              calibrateButtonId="calibrate-btn"
            />
          </Box>
        </Drawer>
      </Container>
    </Box>
  );
}

export default App;
