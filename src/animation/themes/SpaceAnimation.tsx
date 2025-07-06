import React from 'react';

// Example placeholder effects
const SpaceBackground: React.FC = () => <div style={{position:'absolute',width:'100%',height:'100%',background:"radial-gradient(ellipse at center, #222 60%, #111 100%)"}} />;
const SpaceDrum1Effect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(30,144,255,0.2)'}} />;
const SpaceSnareEffect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(255,255,255,0.1)'}} />;
const SpaceDefaultEffect: React.FC = () => null;

export const spaceTheme = {
  background: SpaceBackground,
  slotEffects: {
    drum1: SpaceDrum1Effect,
  },
  typeEffects: {
    snare: SpaceSnareEffect,
  },
  defaultEffect: SpaceDefaultEffect,
};
