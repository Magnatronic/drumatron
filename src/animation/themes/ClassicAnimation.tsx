import React from 'react';

const ClassicBackground: React.FC = () => <div style={{position:'absolute',width:'100%',height:'100%',background:"linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"}} />;
const ClassicDrum1Effect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(255,215,0,0.10)'}} />;
const ClassicSnareEffect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(0,0,0,0.05)'}} />;
const ClassicDefaultEffect: React.FC = () => null;

export const classicTheme = {
  background: ClassicBackground,
  slotEffects: {
    drum1: ClassicDrum1Effect,
  },
  typeEffects: {
    snare: ClassicSnareEffect,
  },
  defaultEffect: ClassicDefaultEffect,
};
