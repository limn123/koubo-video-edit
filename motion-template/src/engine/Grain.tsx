import React from "react";
import { AbsoluteFill } from "remotion";

/** 纸张颗粒 + 暖色暗角：米白底上的印刷质感 */
export const Grain: React.FC<{ frame: number; opacity?: number }> = ({ frame, opacity = 0.09 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity, mixBlendMode: "multiply" }}>
      <filter id="grainf">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 23} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grainf)" />
    </svg>
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 80% 75% at 45% 40%, rgba(0,0,0,0) 60%, rgba(120,90,50,0.14) 100%)" }}
    />
  </AbsoluteFill>
);
