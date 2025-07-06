import { AllInstrumentCalibration } from './components';
import { AnimationProvider, AnimationLayer } from './animation';


import { Box, CssBaseline, Drawer } from '@mui/material';
import { TopBar } from './components/TopBar';
import type { InstrumentSettings } from './components/TopBar';
import { useState, useCallback } from 'react';
import { useAnimation } from './animation';
import { InstrumentVisualizer } from './components/InstrumentVisualizer';
import type { InstrumentType } from './components/instrumentConfig';
import { useInstrumentDetection } from './components/useInstrumentDetection';
import type { InstrumentMatchScores } from './components/useInstrumentDetection';
import { SettingsPanel } from './components/SettingsPanel';



// Child component that uses AnimationContext
function AppWithAnimation(props: {
  activeInstruments: InstrumentType[];
  setActiveInstruments: React.Dispatch<React.SetStateAction<InstrumentType[]>>;
  sensitivity: number;
  setSensitivity: React.Dispatch<React.SetStateAction<number>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  perInstrumentNoise: Record<InstrumentType, number>;
  setPerInstrumentNoise: React.Dispatch<React.SetStateAction<Record<InstrumentType, number>>>;
  instrumentSettings: Partial<Record<InstrumentType, InstrumentSettings>>;
  setInstrumentSettings: React.Dispatch<React.SetStateAction<Partial<Record<InstrumentType, InstrumentSettings>>>>;
}) {
  const {
    activeInstruments,
    setActiveInstruments,
    sensitivity,
    setSensitivity,
    theme,
    setTheme,
    perInstrumentNoise,
    setPerInstrumentNoise,
    instrumentSettings,
    setInstrumentSettings,
  } = props;
  const [matchScores, setMatchScores] = useState<InstrumentMatchScores>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastHit, setLastHit] = useState<InstrumentType | null>(null);
  const animation = useAnimation();

  // Instrument detection hook
  const handleInstrumentHit = useCallback((instrument: InstrumentType) => {
    setLastHit(instrument);
    if (animation) {
      animation.triggerInstrumentAnimation(instrument);
    }
  }, [animation]);
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
        perInstrumentNoise={perInstrumentNoise}
        onPerInstrumentNoiseChange={(instrument, noise) =>
          setPerInstrumentNoise((prev) => ({ ...prev, [instrument]: noise }))
        }
      />

      {/* Main Content: Remove card, use full-page canvas for visualizer */}
      <Box sx={{ position: 'relative', width: '100vw', height: 'calc(100vh - 64px)', minHeight: 0, p: 0, m: 0, overflow: 'hidden' }}>
        {/* Animation Layer (background, effects) - now only covers main content */}
        <AnimationLayer matchScores={matchScores} instrumentSettings={instrumentSettings} />
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
              }}
              calibrateButtonId="calibrate-btn"
            />
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
}

function App() {
  // State for instrument visualizer and settings
  const [activeInstruments, setActiveInstruments] = useState<InstrumentType[]>(['drum1', 'drum2', 'drum3', 'drum4', 'drum5']);
  const [sensitivity, setSensitivity] = useState(5);
  const [theme, setTheme] = useState('classic');
  const [perInstrumentNoise, setPerInstrumentNoise] = useState<Record<InstrumentType, number>>({
    drum1: 0,
    drum2: 0,
    drum3: 0,
    drum4: 0,
    drum5: 0,
  });
  const [instrumentSettings, setInstrumentSettings] = useState<Partial<Record<InstrumentType, InstrumentSettings>>>(
    {
      drum1: { enabled: true, sensitivity: 0.85 },
      drum2: { enabled: true, sensitivity: 0.85 },
      drum3: { enabled: true, sensitivity: 0.85 },
      drum4: { enabled: true, sensitivity: 0.85 },
      drum5: { enabled: true, sensitivity: 0.85 },
    }
  );

  return (
    <AnimationProvider theme={theme} setTheme={setTheme}>
      <AppWithAnimation
        activeInstruments={activeInstruments}
        setActiveInstruments={setActiveInstruments}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        theme={theme}
        setTheme={setTheme}
        perInstrumentNoise={perInstrumentNoise}
        setPerInstrumentNoise={setPerInstrumentNoise}
        instrumentSettings={instrumentSettings}
        setInstrumentSettings={setInstrumentSettings}
      />
    </AnimationProvider>
  );
}

export default App;
