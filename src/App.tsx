import { AllInstrumentCalibration } from './components';


import { Box, CssBaseline, Drawer } from '@mui/material';
import { TopBar } from './components/TopBar';
import type { InstrumentSettings } from './components/TopBar';
import { useState, useCallback } from 'react';
import { InstrumentVisualizer } from './components/InstrumentVisualizer';
import type { InstrumentType } from './components/InstrumentVisualizer';
import { useInstrumentDetection } from './components/useInstrumentDetection';
import type { InstrumentMatchScores } from './components/useInstrumentDetection';
import { SettingsPanel } from './components/SettingsPanel';


function App() {
  // Live match scores for debugging
  const [matchScores, setMatchScores] = useState<InstrumentMatchScores>({});
  // State for instrument visualizer and settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeInstruments, setActiveInstruments] = useState<InstrumentType[]>(['kick', 'snare', 'hihat', 'tom', 'cymbal']);
  const [sensitivity, setSensitivity] = useState(5);
  const [theme, setTheme] = useState('classic');
  const [lastHit, setLastHit] = useState<InstrumentType | null>(null);
  // (noiseFloor state removed, unused)
  const [perInstrumentNoise, setPerInstrumentNoise] = useState<Record<InstrumentType, number>>({
    kick: 0,
    snare: 0,
    hihat: 0,
    tom: 0,
    cymbal: 0,
  });
  // Per-instrument settings state
  const [instrumentSettings, setInstrumentSettings] = useState<Partial<Record<InstrumentType, InstrumentSettings>>>(
    {
      kick: { enabled: true, sensitivity: 0.85 },
      snare: { enabled: true, sensitivity: 0.85 },
      hihat: { enabled: true, sensitivity: 0.85 },
      tom: { enabled: true, sensitivity: 0.85 },
      cymbal: { enabled: true, sensitivity: 0.85 },
    }
  );

  // Instrument detection hook
  const handleInstrumentHit = useCallback((instrument: InstrumentType) => {
    setLastHit(instrument);
  }, []);
  useInstrumentDetection({
    activeInstruments,
    sensitivity,
    noiseFloor: undefined, // not used for per-instrument
    onInstrumentHit: handleInstrumentHit,
    perInstrumentNoise,
    instrumentSettings,
    setMatchScores,
  });

  // Handlers for settings
  const handleToggleInstrument = (instrument: InstrumentType) => {
    setActiveInstruments((prev) =>
      prev.includes(instrument) ? prev.filter((d) => d !== instrument) : [...prev, instrument]
    );
  };

  // Per-instrument settings change handler
  const handleInstrumentSettingsChange = (instrument: InstrumentType, settings: InstrumentSettings) => {
    setInstrumentSettings((prev) => ({ ...prev, [instrument]: settings }));
    // Also update activeInstruments if enabled/disabled
    setActiveInstruments((prev) => {
      if (settings.enabled && !prev.includes(instrument)) return [...prev, instrument];
      if (!settings.enabled && prev.includes(instrument)) return prev.filter((d) => d !== instrument);
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
        activeInstruments={activeInstruments}
        onToggleInstrument={handleToggleInstrument}
        theme={theme}
        onThemeChange={setTheme}
        themes={['classic', 'space', 'underwater']}
        onSettings={() => setSettingsOpen(true)}
        instrumentSettings={instrumentSettings}
        onInstrumentSettingsChange={handleInstrumentSettingsChange}
      />

      {/* Main Content: Remove card, use full-page canvas for visualizer */}
      <Box sx={{ position: 'relative', width: '100vw', height: 'calc(100vh - 64px)', minHeight: 0, p: 0, m: 0, overflow: 'hidden' }}>
        <InstrumentVisualizer activeInstruments={activeInstruments} lastHit={lastHit} theme={theme} matchScores={matchScores} fullScreen />
        <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <Box sx={{ width: 340, p: 3 }} role="presentation">
            <SettingsPanel
              activeInstruments={activeInstruments}
              onToggleInstrument={handleToggleInstrument}
              sensitivity={sensitivity}
              onSensitivityChange={setSensitivity}
            />
            <AllInstrumentCalibration
              instruments={activeInstruments}
              onCalibrate={(noiseFloors) => {
                setPerInstrumentNoise(noiseFloors);
                // const avg = Object.values(noiseFloors).reduce((a, b) => a + b, 0) / Object.values(noiseFloors).length;
                // setNoiseFloor(avg); // Unused, safe to remove
              }}
              calibrateButtonId="calibrate-btn"
            />
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
}

export default App;
