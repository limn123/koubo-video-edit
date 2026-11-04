// 从 hyperframes-registry 移植到 Remotion 的效果（参数照搬原组件，改成由帧时间驱动、适配米白纸面）：
// whip-pan-cut（甩镜）、camera-shake（手持抖动 + 冲击）、organic-light-leak-overlay（漏光）、
// grain-overlay（胶片颗粒）、rgb-glitch-text（文字 RGB 错位）、chromatic-aberration-wipe（色散擦除）
import React from "react";
import { AbsoluteFill } from "remotion";
import { E, clamp, invLerp } from "./engine/ease";
import { C, H, W } from "./engine/theme";

/* ---------------- whip-pan-cut：0.55s power3.inOut 横移一个画幅，水平运动模糊峰值 16px ---------------- */
export const WHIP_D = 0.55;
const p3io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** 一段舞台：在 inAt 甩入（从右边进来），在 outAt 甩出（向左离开）；不设则无甩镜 */
export const WhipLayer: React.FC<{ t: number; id: string; inAt?: number; outAt?: number; children: React.ReactNode }> = ({
  t,
  id,
  inAt,
  outAt,
  children,
}) => {
  const kin = inAt === undefined ? 1 : p3io(clamp(invLerp(inAt, inAt + WHIP_D, t)));
  const kout = outAt === undefined ? 0 : p3io(clamp(invLerp(outAt, outAt + WHIP_D, t)));
  if (kin <= 0.0005 && inAt !== undefined && t < inAt) return null;
  if (kout >= 0.9995) return null;
  const x = W * (1 - kin) - W * kout;
  // 模糊包络：中点（速度最大）最强，两端为 0
  const bell = (a?: number) => {
    if (a === undefined) return 0;
    const q = clamp(invLerp(a, a + WHIP_D, t));
    return q < 0.5 ? E.inCubic(q * 2) : 1 - E.outCubic((q - 0.5) * 2);
  };
  const blur = 16 * Math.max(bell(inAt), bell(outAt));
  const fid = `whip-${id}`;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, filter: blur > 0.3 ? `url(#${fid})` : undefined }}>
      {blur > 0.3 && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={fid} x="-10%" y="0%" width="120%" height="100%">
            <feGaussianBlur stdDeviation={`${blur * 2} 0`} />
          </filter>
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
};
/** 甩镜接缝发丝线（whip-pan-cut 的 seam），只在甩动时出现 */
export const WhipSeam: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const q = clamp(invLerp(at, at + WHIP_D, t));
  if (q <= 0 || q >= 1) return null;
  const x = W * (1 - p3io(q));
  const a = Math.sin(q * Math.PI);
  return <div style={{ position: "absolute", left: x - 2, top: 0, width: 4, height: H, background: C.orange, opacity: 0.55 * a, boxShadow: `0 0 30px ${C.orange}` }} />;
};

/* ---------------- camera-shake：三个八度的值噪声手持晃动 + 冲击衰减 ---------------- */
const vnoise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
};
// handheld-normal-mild 量级：每个通道 [幅度(px/deg), 频率 Hz]
const OCT: [number, number][] = [
  [1, 0.35],
  [0.45, 1.1],
  [0.18, 3.2],
];
/** 返回 transform 字符串：持续的轻微手持感 + hits 处的冲击（幅度 amp，0.45s 指数衰减） */
export const shake = (t: number, hits: [number, number][], idle = 1) => {
  let x = 0,
    y = 0,
    r = 0;
  OCT.forEach(([a, f], i) => {
    x += (vnoise(t * f + i * 17.3) - 0.5) * a * 7 * idle;
    y += (vnoise(t * f + 40 + i * 9.1) - 0.5) * a * 6 * idle;
    r += (vnoise(t * f + 80 + i * 5.7) - 0.5) * a * 0.22 * idle;
  });
  for (const [at, amp] of hits) {
    const d = t - at;
    if (d < 0 || d > 0.6) continue;
    const k = Math.exp(-d * 9) * amp;
    x += Math.sin(d * 78) * 14 * k;
    y += Math.cos(d * 64) * 11 * k;
    r += Math.sin(d * 55) * 0.6 * k;
  }
  return `translate(${x}px, ${y}px) rotate(${r}deg) scale(${1 + 0.012 * idle})`;
};

/* ---------------- organic-light-leak-overlay：暖色漏光，screen 叠加，三团光斑各自漂移 ----------------
   人物全屏时脸在画面中上部：用径向遮罩把中间挖空，漏光只在四周边缘流过，不把脸冲白 */
const LEAK_MASK = "radial-gradient(ellipse 48% 38% at 50% 44%, transparent 0%, transparent 55%, black 100%)";
export const LightLeak: React.FC<{ t: number; at: number; dur: number; strength?: number }> = ({ t, at, dur, strength = 1 }) => {
  const q = (t - at) / dur;
  if (q <= 0 || q >= 1) return null;
  // 原组件时间线：8%→32% 升到 0.9，42%→62% 回落到 0.46，68%→94% 收到 0
  const k =
    q < 0.08 ? 0 : q < 0.32 ? 0.9 * Math.sin(((q - 0.08) / 0.24) * Math.PI * 0.5) : q < 0.42 ? 0.9 : q < 0.62 ? 0.9 - 0.44 * E.inOutCubic((q - 0.42) / 0.2) : q < 0.68 ? 0.46 : q < 0.94 ? 0.46 * (1 - E.inCubic((q - 0.68) / 0.26)) : 0;
  const s = E.inOutCubic(q);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: k * strength, pointerEvents: "none", maskImage: LEAK_MASK, WebkitMaskImage: LEAK_MASK }}>
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          transform: `translateX(${-20 + 38 * s}%) scale(${0.92 + 0.18 * s}) rotate(${-4 + 6 * s}deg)`,
          background:
            "radial-gradient(ellipse 52% 110% at 10% 58%, rgba(255,241,197,0.92), transparent 45%), radial-gradient(ellipse 72% 120% at 24% 54%, rgba(255,126,57,0.78), transparent 66%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          transform: `translate(${20 - 36 * s}%, ${-8 + 16 * s}%) scale(${1.08 - 0.14 * s})`,
          background: "radial-gradient(ellipse 40% 60% at 85% 30%, rgba(255,190,120,0.55), transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          transform: `translateX(${-28 + 52 * s}%) rotate(${-6 + 10 * s}deg)`,
          background: "linear-gradient(100deg, transparent 30%, rgba(255,214,150,0.45) 48%, transparent 64%)",
          filter: "blur(30px)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------------- grain-overlay：fractalNoise 0.65 / 3 octaves，逐帧换种子 + 暖色暗角 ---------------- */
export const FilmGrain: React.FC<{ frame: number; opacity?: number }> = ({ frame, opacity = 0.07 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity, mixBlendMode: "multiply" }}>
      <filter id="hfgrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} seed={frame % 29} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#hfgrain)" />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 82% 72% at 50% 42%, rgba(0,0,0,0) 62%, rgba(110,80,45,0.16) 100%)" }} />
  </AbsoluteFill>
);

/* ---------------- rgb-glitch-text：入场后一小段时间里红/青副本错位抖动，然后归位 ---------------- */
export const GlitchText: React.FC<{ t: number; at: number; win?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t,
  at,
  win = 0.4,
  children,
  style,
}) => {
  const d = t - at;
  const on = d >= 0 && d <= win;
  const step = Math.floor(d * 30); // 30Hz 跳变
  const r = (n: number) => {
    const s = Math.sin((step + n) * 91.7) * 43758.5453;
    return s - Math.floor(s) - 0.5;
  };
  const amp = on ? 14 * (1 - d / win) : 0;
  const slice = on ? Math.abs(r(3)) * 80 : 0;
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      {on && (
        <>
          <span style={{ position: "absolute", left: 0, top: 0, color: "#E8384F", opacity: 0.85, transform: `translate(${r(1) * amp * 2}px, ${r(2) * amp * 0.5}px)`, mixBlendMode: "multiply", clipPath: `inset(${slice}% 0 ${Math.max(0, 60 - slice)}% 0)` }}>
            {children}
          </span>
          <span style={{ position: "absolute", left: 0, top: 0, color: "#18A8B8", opacity: 0.85, transform: `translate(${-r(4) * amp * 2}px, ${-r(5) * amp * 0.5}px)`, mixBlendMode: "multiply" }}>
            {children}
          </span>
        </>
      )}
      <span style={{ position: "relative", display: "inline-block", transform: on ? `translateX(${r(6) * amp}px) skewX(${r(7) * amp * 0.6}deg)` : undefined }}>{children}</span>
    </span>
  );
};

/* ---------------- chromatic-aberration-wipe：一道纸色擦除带横扫，峰值帧出现红/青色散边 ---------------- */
export const ChromaWipe: React.FC<{ t: number; at: number; dur?: number }> = ({ t, at, dur = 0.42 }) => {
  const q = clamp(invLerp(at, at + dur, t));
  if (q <= 0 || q >= 1) return null;
  const k = E.inOutCubic(q);
  const x = -W * 0.6 + k * W * 1.9;
  const peak = Math.sin(q * Math.PI);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {[
        { c: "rgba(232,56,79,0.55)", dx: -26 * peak },
        { c: "rgba(24,168,184,0.55)", dx: 26 * peak },
      ].map((b, i) => (
        <div key={i} style={{ position: "absolute", left: x + b.dx, top: -200, width: 220, height: H + 400, background: `linear-gradient(90deg, transparent, ${b.c}, transparent)`, transform: "skewX(-12deg)", mixBlendMode: "multiply" }} />
      ))}
      <div style={{ position: "absolute", left: x, top: -200, width: 220, height: H + 400, background: "linear-gradient(90deg, rgba(255,253,248,0), rgba(255,253,248,0.95), rgba(255,253,248,0))", transform: "skewX(-12deg)" }} />
    </AbsoluteFill>
  );
};
