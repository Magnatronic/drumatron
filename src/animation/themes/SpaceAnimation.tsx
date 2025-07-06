import React, { useRef, useEffect, useState } from 'react';
import { useSpaceStars } from './space/SpaceStarContext';


// SVG-based background using shared stars and pulse state
const SpaceBackground: React.FC = () => {
  const { stars } = useSpaceStars();
  // Responsive SVG
  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none',
        background: 'transparent',
      }}
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      {/* Background gradient */}
      <defs>
        <radialGradient id="space-bg" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#23243a" />
          <stop offset="100%" stopColor="#0a0a18" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#space-bg)" />
      {/* Stars */}
      {stars.map((star, i) => {
        let t = 0;
        // Twinkle
        const tw = 0.7 + 0.3 * Math.sin((i * 13.7) + performance.now()/900);
        // Pulse effect
        let pulse = 1;
        let pulseOpacity = 2.0;
        let pulseBlur = 1.2;
        if (star.pulse) {
          t = Math.min(1, (performance.now() - star.pulse.start) / star.pulse.duration);
          // Make the star itself much brighter and sharper, not just a cloud
          const grow = t < 0.5 ? t * 2 : 2 - t * 2;
          pulse = 2.2 + 2.8 * Math.pow(grow, 1.1); // bigger, but not too cloud-like
          // Star core: extremely bright, sharp
          pulseOpacity = 6.0 - 5.0 * t; // extremely high at start, fades quickly
          pulseBlur = 0.5 + 0.8 * (1 - grow); // sharpest at peak
        }
        // For extra brightness, overlay a small, sharp white core if pulsing
        return (
          <g key={i}>
            <circle
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.r * pulse}
              fill={star.color}
              opacity={Math.min(1, tw * (star.pulse ? pulseOpacity : 0.7))}
              style={{ filter: `blur(${star.pulse ? pulseBlur : 1.2}px)` }}
            />
            {star.pulse && (
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.r * (pulse * 0.6)}
                fill="#fff"
                opacity={0.95 * Math.max(0, 1 - t * 1.3)}
                style={{ filter: `blur(${0.25 + 0.4 * (1 - t)}px)` }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );

};

import { useAnimation } from '../AnimationContext';
const SpaceDrum1Effect: React.FC = () => {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; start: number; color: string }[]>([]);
  const nextId = useRef(0);
  const { lastTriggers } = useAnimation();
  // Track last trigger timestamp to avoid duplicate bursts
  const lastTimestamp = useRef<number>(0);

  // A palette of random burst colors (spacey, vibrant)
  const BURST_COLORS = [
    '#42a5f5', // blue
    '#ab47bc', // purple
    '#26c6da', // cyan
    '#ffca28', // yellow
    '#ef5350', // red
    '#66bb6a', // green
    '#fff',    // white
    '#ffd740', // gold
    '#b5e3ff', // light blue
    '#ffe7b5', // pale yellow
    '#b5ffd6', // mint
  ];

  // Listen for real instrument triggers
  useEffect(() => {
    if (!lastTriggers.length) return;
    const latest = [...lastTriggers].reverse().find(t => t.instrument === 'drum1');
    if (latest && latest.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = latest.timestamp;
      // Place burst at random location
      const x = Math.random() * 0.6 + 0.2;
      const y = Math.random() * 0.6 + 0.2;
      // Pick a random color from the palette
      const color = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
      setBursts((prev) => [...prev, { id: nextId.current++, x, y, start: performance.now(), color }]);
    }
  }, [lastTriggers]);

  // Remove finished bursts
  useEffect(() => {
    if (!bursts.length) return;
    const raf = requestAnimationFrame(() => {
      setBursts((prev) => prev.filter(b => performance.now() - b.start < 900));
    });
    return () => cancelAnimationFrame(raf);
  }, [bursts]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} width="100%" height="100%">
      {bursts.map(burst => {
        const t = Math.min(1, (performance.now() - burst.start) / 900);
        // Smaller burst size: 3% to 8% of min(width, height)
        const r = 0.03 + 0.05 * t;
        const opacity = 1 - t;
        const cx = burst.x * 100 + '%';
        const cy = burst.y * 100 + '%';
        return (
          <circle
            key={burst.id}
            cx={cx}
            cy={cy}
            r={r * 50 + '%'}
            fill={burst.color}
            stroke="#fff"
            strokeWidth={1.2 + 2 * (1 - t)}
            opacity={opacity}
            style={{ filter: `blur(${4 + 7 * t}px)` }}
          />
        );
      })}
    </svg>
  );
};
// Shooting star effect for drum2
// Star pulse effect for drum2
const SpaceDrum2Effect: React.FC = () => {
  // Instead of rendering, trigger pulse on background stars
  const { stars, pulseStars } = useSpaceStars();
  const { lastTriggers } = useAnimation();
  const lastTimestamp = useRef<number>(0);
  useEffect(() => {
    if (!lastTriggers.length) return;
    const latest = [...lastTriggers].reverse().find(t => t.instrument === 'drum2');
    if (latest && latest.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = latest.timestamp;
      // Select a group of star indices along a random arc/band
      const angleCenter = Math.random() * 2 * Math.PI;
      const radius = 30 + Math.random() * 40; // percent, 30-70
      const bandWidth = 18 + Math.random() * 10; // band width in percent (thickness)
      // Convert each star to polar coordinates (relative to center)
      const polarStars = stars.map((star, i) => {
        const dx = star.x - 50;
        const dy = star.y - 50;
        const r = Math.sqrt(dx * dx + dy * dy);
        let theta = Math.atan2(dy, dx);
        if (theta < 0) theta += 2 * Math.PI;
        return { i, r, theta };
      });
      // Select stars within the band (arc)
      let arcWidth = Math.PI / 6;
      let width = bandWidth;
      let indices = polarStars.filter(star => {
        const dr = Math.abs(star.r - radius);
        let dtheta = Math.abs(star.theta - angleCenter);
        if (dtheta > Math.PI) dtheta = 2 * Math.PI - dtheta;
        return dr < width && dtheta < arcWidth;
      }).map(s => s.i);
      // If not enough, expand arc or band
      while (indices.length < 8 && (arcWidth < Math.PI / 2 || width < 30)) {
        arcWidth += Math.PI / 18;
        width += 4;
        indices = polarStars.filter(star => {
          const dr = Math.abs(star.r - radius);
          let dtheta = Math.abs(star.theta - angleCenter);
          if (dtheta > Math.PI) dtheta = 2 * Math.PI - dtheta;
          return dr < width && dtheta < arcWidth;
        }).map(s => s.i);
      }
      // Limit to 8-14 stars
      const count = 8 + Math.floor(Math.random() * 7);
      const selected = indices.slice(0, count);
      const duration = 1400 + Math.random() * 700; // 1.4-2.1s
      pulseStars(selected, duration);
    }
  }, [lastTriggers, stars, pulseStars]);
  // No rendering needed
  return null;
};

const SpaceSnareEffect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(255,255,255,0.1)'}} />;
// Meteor shower effect for drum3
const SpaceDrum3Effect: React.FC = () => {
  const [meteors, setMeteors] = useState<{
    id: number;
    x0: number; y0: number; x1: number; y1: number;
    color: string;
    start: number;
    duration: number;
  }[]>([]);
  const nextId = useRef(0);
  const { lastTriggers } = useAnimation();
  const lastTimestamp = useRef<number>(0);
  const METEOR_COLORS = [
    '#fff', '#b5e3ff', '#ffe7b5', '#b5ffd6', '#42a5f5', '#ab47bc', '#26c6da', '#ffca28', '#ef5350', '#66bb6a', '#ffd740',
  ];

  useEffect(() => {
    if (!lastTriggers.length) return;
    const latest = [...lastTriggers].reverse().find(t => t.instrument === 'drum3');
    if (latest && latest.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = latest.timestamp;
      // 5-7 meteors per trigger
      const count = 5 + Math.floor(Math.random() * 3);
      const newMeteors = Array.from({ length: count }, () => {
        // Random start (top 20% of screen, random x)
        const x0 = Math.random();
        const y0 = Math.random() * 0.2;
        // Random angle (downward, 30deg to 75deg)
        const angle = Math.PI / 6 + Math.random() * (Math.PI / 2 - Math.PI / 6);
        const len = 0.25 + Math.random() * 0.25; // 25-50% of screen
        const x1 = x0 + Math.cos(angle) * len;
        const y1 = y0 + Math.sin(angle) * len;
        const color = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];
        const duration = 500 + Math.random() * 250; // 500-750ms
        return { id: nextId.current++, x0, y0, x1, y1, color, start: performance.now(), duration };
      });
      setMeteors(prev => [...prev, ...newMeteors]);
    }
  }, [lastTriggers]);

  // Remove finished meteors
  useEffect(() => {
    if (!meteors.length) return;
    const raf = requestAnimationFrame(() => {
      setMeteors(prev => prev.filter(m => performance.now() - m.start < m.duration));
    });
    return () => cancelAnimationFrame(raf);
  }, [meteors]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }} width="100%" height="100%">
      {meteors.map(meteor => {
        const t = Math.min(1, (performance.now() - meteor.start) / meteor.duration);
        // Interpolate position
        const x = meteor.x0 + (meteor.x1 - meteor.x0) * t;
        const y = meteor.y0 + (meteor.y1 - meteor.y0) * t;
        const xPx0 = `${meteor.x0 * 100}%`, yPx0 = `${meteor.y0 * 100}%`;
        const xPx = `${x * 100}%`, yPx = `${y * 100}%`;
        const opacity = 0.9 * (1 - t * 0.7);
        return (
          <g key={meteor.id}>
            {/* Meteor trail */}
            <line x1={xPx0} y1={yPx0} x2={xPx} y2={yPx} stroke={meteor.color} strokeWidth={2.8 - 1.5 * t} strokeLinecap="round" opacity={opacity * 0.7} style={{ filter: `blur(${2 + 3 * t}px)` }} />
            {/* Meteor head */}
            <circle cx={xPx} cy={yPx} r={4.5 - 2.5 * t} fill={meteor.color} opacity={opacity} style={{ filter: `blur(${1.5 + 2 * t}px)` }} />
          </g>
        );
      })}
    </svg>
  );
};
const SpaceDefaultEffect: React.FC = () => null;

import { SpaceStarProvider } from './space/SpaceStarContext';

// Wrap all space theme effects in SpaceStarProvider
const SpaceThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SpaceStarProvider>{children}</SpaceStarProvider>
);

export const spaceTheme = {
  background: SpaceBackground,
  slotEffects: {
    drum1: SpaceDrum1Effect,
    drum2: SpaceDrum2Effect,
    drum3: SpaceDrum3Effect,
  },
  typeEffects: {
    snare: SpaceSnareEffect,
  },
  defaultEffect: SpaceDefaultEffect,
  provider: SpaceThemeProvider,
};
