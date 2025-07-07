import React, { useRef, useEffect, useCallback } from 'react';

import type { InstrumentType } from './instrumentConfig';

import type { InstrumentMatchScores } from './useInstrumentDetection';
export interface InstrumentVisualizerProps {
  activeInstruments: InstrumentType[];
  lastHit: InstrumentType | null;
  theme: string;
  matchScores?: InstrumentMatchScores;
  fullScreen?: boolean;
}

import { instrumentConfig } from './instrumentConfig';
const instrumentColors: Record<InstrumentType, string> = Object.fromEntries(
  Object.entries(instrumentConfig).map(([k, v]) => [k, v.color])
) as Record<InstrumentType, string>;


export const InstrumentVisualizer: React.FC<InstrumentVisualizerProps> = ({ activeInstruments, lastHit, theme, matchScores, fullScreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 640, height: 320 });

  // Responsive resize handler
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw instruments on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Clear
    ctx.clearRect(0, 0, size.width, size.height);

    // Background
    if (theme === 'space') {
      // Radial gradient
      const grad = ctx.createRadialGradient(size.width/2, size.height/2, size.height/4, size.width/2, size.height/2, size.width/1.2);
      grad.addColorStop(0, '#232526');
      grad.addColorStop(1, '#414345');
      ctx.fillStyle = grad;
    } else if (theme === 'underwater') {
      // Linear gradient
      const grad = ctx.createLinearGradient(0, 0, size.width, size.height);
      grad.addColorStop(0, '#43cea2');
      grad.addColorStop(1, '#185a9d');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#f5f5f5';
    }
    ctx.fillRect(0, 0, size.width, size.height);

    // Instrument layout
    const instrumentCount = activeInstruments.length;
    const instrumentRadius = Math.min(size.width / (instrumentCount * 2.2), size.height / 2.5, 80);
    const centerY = size.height / 2;
    const spacing = size.width / (instrumentCount + 1);

    activeInstruments.forEach((instrument, i) => {
      const cx = spacing * (i + 1);
      const cy = centerY;
      // Shadow/highlight for last hit
      if (lastHit === instrument) {
        ctx.save();
        ctx.shadowColor = instrumentColors[instrument];
        ctx.shadowBlur = 32;
        ctx.beginPath();
        ctx.arc(cx, cy, instrumentRadius + 8, 0, 2 * Math.PI);
        ctx.fillStyle = instrumentColors[instrument];
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.restore();
      }
      // Instrument circle
      ctx.beginPath();
      ctx.arc(cx, cy, instrumentRadius, 0, 2 * Math.PI);
      ctx.fillStyle = instrumentColors[instrument];
      ctx.globalAlpha = lastHit === instrument ? 1 : 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Instrument label
      ctx.font = `bold ${Math.round(instrumentRadius/2.2)}px sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(instrument, cx, cy);

      // Match score bar (if present)
      if (matchScores && matchScores[instrument] !== undefined) {
        const score = matchScores[instrument] ?? 0;
        const barWidth = instrumentRadius * 1.4;
        const barHeight = 10;
        const barX = cx - barWidth/2;
        const barY = cy + instrumentRadius + 16;
        // Background
        ctx.fillStyle = '#eee';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        // Foreground
        ctx.fillStyle = '#1976d2';
        ctx.fillRect(barX, barY, barWidth * score, barHeight);
        // Score text
        ctx.font = `bold 12px sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(score * 100)}%`, barX + barWidth - 4, barY + barHeight/2 + 1);
      }
    });
  }, [activeInstruments, lastHit, theme, matchScores, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Make canvas fill parent
  const style: React.CSSProperties = fullScreen
    ? { width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }
    : { width: size.width, height: size.height, display: 'block' };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', minHeight: 240 }}>
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={style}
        aria-label="Instrument visualizer canvas"
        tabIndex={0}
      />
    </div>
  );
};
