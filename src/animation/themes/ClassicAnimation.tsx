import React, { useEffect, useState } from 'react';
import { instruments, instrumentConfig } from '../../components/instrumentConfig';
import type { InstrumentType } from '../../components/instrumentConfig';
// import { useAnimation } from '../AnimationContext';

interface ClassicBackgroundProps {
  lastInstrument: InstrumentType | null;
  matchScores?: Partial<Record<InstrumentType, number>>;
  thresholds?: Partial<Record<InstrumentType, number>>;
}

const ClassicBackground: React.FC<ClassicBackgroundProps> = ({ lastInstrument, matchScores, thresholds }) => {
  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      zIndex: 0,
    }}>
      {instruments.map((instrument) => {
        const isActive = lastInstrument === instrument;
        const base = instrumentConfig[instrument].color;
        const bg = isActive ? base + 'cc' : base + '22';
        const score = matchScores && matchScores[instrument] !== undefined ? matchScores[instrument] : 0;
        const threshold = thresholds && thresholds[instrument] !== undefined ? thresholds[instrument] : 0.7;
        return (
          <div
            key={instrument}
            style={{
              flex: 1,
              height: '100%',
              background: bg,
              transition: 'background 300ms cubic-bezier(.4,2,.6,1)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Progress bar at top */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '10%',
                width: '80%',
                height: 14,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 7,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                boxShadow: isActive ? `0 2px 8px ${base}44` : undefined,
                border: isActive ? `1.5px solid ${base}` : `1px solid #eee`,
                overflow: 'visible',
              }}
              aria-label={`Score for ${instrumentConfig[instrument].label}`}
            >
              {/* Filled bar */}
              <div
                style={{
                  height: 10,
                  width: `${Math.max(0, Math.min(1, score)) * 100}%`,
                  background: isActive ? base : base + '99',
                  borderRadius: 6,
                  marginLeft: 2,
                  marginRight: 2,
                  transition: 'width 200ms cubic-bezier(.4,2,.6,1), background 200ms',
                  boxShadow: isActive ? `0 0 6px ${base}88` : undefined,
                }}
              />
              {/* Threshold marker */}
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${(Math.max(0, Math.min(1, threshold)) * 100).toFixed(1)}% - 1.5px)`,
                  top: 2,
                  width: 3,
                  height: 10,
                  background: isActive ? '#fff' : '#888',
                  borderRadius: 2,
                  boxShadow: isActive ? `0 0 4px #fff` : undefined,
                  zIndex: 3,
                  border: isActive ? `1px solid ${base}` : undefined,
                }}
                title={`Threshold: ${threshold.toFixed(2)}`}
              />
              {/* Optional: numeric value as overlay */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '100%',
                  top: 16,
                  textAlign: 'center',
                  color: isActive ? '#fff' : base,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  textShadow: isActive ? '0 2px 8px #0008' : '0 1px 2px #fff8',
                  letterSpacing: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: 'color 200ms',
                }}
              >
                {score !== undefined ? score.toFixed(2) : '0.00'}
                <span style={{ fontSize: 11, marginLeft: 4, color: isActive ? '#fff' : '#888' }}>
                  / {threshold.toFixed(2)}
                </span>
              </span>
            </div>
            {/* Instrument label removed as requested */}
          </div>
        );
      })}
    </div>
  );
};


// Fullscreen vertical bars

const ClassicBarLayer: React.FC<{
  matchScores?: Partial<Record<InstrumentType, number>>;
  thresholds?: Partial<Record<InstrumentType, number>>;
}> = ({ matchScores, thresholds }) => {
  // Only track the last detected instrument
  const [lastInstrument, setLastInstrument] = useState<InstrumentType | null>(null);

  useEffect(() => {
    if (!matchScores) return;
    let maxScore = 0;
    let maxInstrument: InstrumentType | null = null;
    for (const instrument of instruments) {
      const score = matchScores[instrument] !== undefined ? Math.max(0, Math.min(1, matchScores[instrument]!)) : 0;
      const threshold = thresholds && thresholds[instrument] !== undefined ? thresholds[instrument]! : 0.7;
      if (score > maxScore && score > threshold) {
        maxScore = score;
        maxInstrument = instrument;
      }
    }
    if (maxInstrument && maxInstrument !== lastInstrument) {
      setLastInstrument(maxInstrument);
    }
    // Only update when a new instrument is detected above threshold
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchScores, thresholds]);

  // Render the background with score overlays
  return <ClassicBackground lastInstrument={lastInstrument} matchScores={matchScores} thresholds={thresholds} />;
};

const ClassicDefaultEffect: React.FC = () => null;

export const classicTheme = {
  background: ClassicBackground,
  slotEffects: {}, // Not used, handled by ClassicBarLayer
  typeEffects: {},
  defaultEffect: ClassicDefaultEffect,
  overlay: ClassicBarLayer,
};
