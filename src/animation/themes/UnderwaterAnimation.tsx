import React from 'react';

const UnderwaterBackground: React.FC = () => <div style={{position:'absolute',width:'100%',height:'100%',background:"linear-gradient(to bottom, #00b4d8 0%, #0077b6 100%)"}} />;
const UnderwaterDrum1Effect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(0,180,216,0.15)'}} />;
const UnderwaterSnareEffect: React.FC = () => <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',background:'rgba(255,255,255,0.08)'}} />;
const UnderwaterDefaultEffect: React.FC = () => null;

export const underwaterTheme = {
  background: UnderwaterBackground,
  slotEffects: {
    drum1: UnderwaterDrum1Effect,
  },
  typeEffects: {
    snare: UnderwaterSnareEffect,
  },
  defaultEffect: UnderwaterDefaultEffect,
};
