// Minimal stand-in for 'remotion' so the sfx scanner can render scenes to markup in plain Node (no browser).
import React from 'react';
export const AbsoluteFill: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => <div style={style}>{children}</div>;
export const Img: React.FC<Record<string, unknown>> = (p) => <img {...(p as object)} />;
export const Audio: React.FC<Record<string, unknown>> = () => null;
export const staticFile = (s: string) => '/' + s;
export const delayRender = () => 0;
export const continueRender = () => undefined;
export const cancelRender = () => undefined;
export const getRemotionEnvironment = () => ({isStudio: false, isRendering: true, isPlayer: false});
export const useCurrentFrame = () => 0;
