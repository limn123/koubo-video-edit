// 本条视频的动效积木（米白纸面 + 3D 卡片）：遮罩文字、弹出、3D 卡、计数、印章、贴纸、图标、背景
import React from "react";
import { E, clamp, invLerp, lerp, ramp } from "./engine/ease";
import { C, H, W } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";
import { GlitchText } from "./fx";

/** 入场 at 秒开始、out 秒开始出场；返回 {p 入场进度, o 出场进度, a 透明度} */
export const io = (t: number, at: number, out = Infinity, din = 0.5, dout = 0.32) => {
  const p = clamp(invLerp(at, at + din, t));
  const o = Number.isFinite(out) ? clamp(invLerp(out, out + dout, t)) : 0;
  return { p, o, a: Math.min(1, p * 2.2) * (1 - E.inCubic(o)), live: t >= at - 0.01 && t <= out + dout + 0.01 };
};

/** 确定性伪随机 */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pos = { x: number; y: number; w?: number; anchor?: "l" | "c" | "r" };

/** 遮罩上推揭示的文字 */
export const Reveal: React.FC<{
  t: number;
  at: number;
  out?: number;
  dur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ t, at, out = Infinity, dur = 0.55, style, children }) => {
  const { p, o, live } = io(t, at, out, dur, 0.3);
  if (!live) return null;
  const y = (1 - E.outQuart(p)) * 110 - E.inCubic(o) * 110;
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.08em", ...style }}>
      <div style={{ transform: `translateY(${y}%)` }}>{children}</div>
    </div>
  );
};

/** 绝对定位 + 弹出（outBack 缩放）+ 出场 */
export const Pop: React.FC<
  Pos & {
    t: number;
    at: number;
    out?: number;
    dur?: number;
    from?: number;
    rot?: number;
    dy?: number;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }
> = ({ t, at, out = Infinity, dur = 0.5, from = 0.4, rot = 0, dy = 0, x, y, w, anchor = "l", style, children }) => {
  const { p, o, a, live } = io(t, at, out, dur);
  if (!live) return null;
  const s = lerp(from, 1, E.outBack(p)) * (1 - 0.18 * E.inCubic(o));
  const tx = anchor === "c" ? "-50%" : anchor === "r" ? "-100%" : "0%";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        opacity: a,
        transform: `translate(${tx}, ${(1 - E.outCubic(p)) * dy}px) scale(${s}) rotate(${rot * (1 - E.outBack(p))}deg)`,
        transformOrigin: anchor === "c" ? "50% 50%" : anchor === "r" ? "100% 50%" : "0% 50%",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 位移 + 淡入 */
export const Slide: React.FC<
  Pos & {
    t: number;
    at: number;
    out?: number;
    dx?: number;
    dy?: number;
    odx?: number;
    ody?: number;
    dur?: number;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }
> = ({ t, at, out = Infinity, dx = 0, dy = 40, odx = 0, ody = -30, dur = 0.55, x, y, w, style, children }) => {
  const { p, o, a, live } = io(t, at, out, dur);
  if (!live) return null;
  const k = E.outExpo(p);
  const ko = E.inCubic(o);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        opacity: a,
        transform: `translate(${(1 - k) * dx + ko * odx}px, ${(1 - k) * dy + ko * ody}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 数字滚动 */
export const roll = (t: number, a: number, b: number, from: number, to: number, ease = E.outCubic) =>
  lerp(from, to, ramp(t, a, b, ease));

/* ---------------- 3D 卡片 ---------------- */
/**
 * 透视翻入的 3D 卡片：带厚度（多层底板）、地面投影、入场高光扫过、待机轻微悬浮倾斜。
 * from: up 自下向上翻起 / left / right 侧向转入 / drop 从上方落下
 */
export const Card3D: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  h?: number;
  from?: "up" | "left" | "right" | "drop";
  depth?: number;
  seed?: number;
  tilt?: number;
  radius?: number;
  accent?: string;
  face?: string;
  pad?: number | string;
  lift?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  t,
  at,
  out = Infinity,
  x,
  y,
  w,
  h,
  from = "up",
  depth = 14,
  seed = 0,
  tilt = 1,
  radius = 24,
  accent,
  face = C.card,
  pad = 0,
  lift = 0,
  style,
  children,
}) => {
  const { p, o, live } = io(t, at, out, 0.75, 0.38);
  if (!live) return null;
  const k = E.outBack(p, 1.3);
  const ke = E.outExpo(p);
  const ko = E.inCubic(o);
  // 入场姿态
  let rx = 0,
    ry = 0,
    tx = 0,
    ty = 0,
    tz = 0;
  if (from === "up") {
    rx = 78 * (1 - k);
    ty = 140 * (1 - ke);
    tz = -260 * (1 - ke);
  } else if (from === "left") {
    ry = -75 * (1 - k);
    tx = -160 * (1 - ke);
    tz = -200 * (1 - ke);
  } else if (from === "right") {
    ry = 75 * (1 - k);
    tx = 160 * (1 - ke);
    tz = -200 * (1 - ke);
  } else {
    rx = -60 * (1 - k);
    ty = -160 * (1 - ke);
    tz = 160 * (1 - ke);
  }
  // 待机悬浮：极轻微的倾斜呼吸，体现体积但不晃眼
  const idle = tilt * clamp((t - at) / 0.9);
  rx += 4 * idle + Math.cos(t * 0.7 + seed * 1.7) * 1.4 * idle;
  ry += Math.sin(t * 0.55 + seed * 2.3) * 2.6 * idle;
  // 出场：向后翻倒
  rx -= 55 * ko;
  ty -= 50 * ko;
  tz += lift;
  const a = Math.min(1, p * 3) * (1 - ko);
  const sweep = lerp(-130, 130, E.inOutCubic(ramp(t, at + 0.25, at + 1.15)));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1800, opacity: a, ...style }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: h ? "100%" : undefined,
          transformStyle: "preserve-3d",
          transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {/* 厚度：一层底板，只在下沿露出一道纸板边 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: "linear-gradient(180deg, #E9DFCE, #D9CCB6)",
            transform: `translateZ(${-depth}px) translateY(${depth * 0.55}px)`,
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: h ? "100%" : undefined,
            borderRadius: radius,
            background: face,
            border: `1px solid ${accent ?? "rgba(24,61,51,0.07)"}`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 4px rgba(70,50,20,0.05), 0 14px 26px -8px rgba(70,50,20,0.14), 0 44px 70px -26px rgba(70,50,20,0.32)",
            overflow: "hidden",
            padding: pad,
            boxSizing: "border-box",
          }}
        >
          {accent && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: accent }} />}
          {children}
          {/* 高光扫过 */}
          <div
            style={{
              position: "absolute",
              inset: "-20%",
              background: "linear-gradient(105deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 62%)",
              transform: `translateX(${sweep}%)`,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>
    </div>
  );
};

/** 印章：红色印泥，从 2.2 倍砸下 + 抖动 */
export const Stamp: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  color?: string;
  size?: number;
  rot?: number;
  children: React.ReactNode;
}> = ({ t, at, out = Infinity, x, y, color = C.red, size = 52, rot = -9, children }) => {
  const { p, o, live } = io(t, at, out, 0.26);
  if (!live) return null;
  const k = E.outCubic(p);
  const s = lerp(2.3, 1, k) * (1 - 0.2 * E.inCubic(o));
  const shake = p < 1 ? 0 : Math.sin((t - at) * 70) * Math.exp(-(t - at - 0.26) * 9) * 3;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + shake}deg) scale(${s})`,
        opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)),
        border: `6px double ${color}`,
        borderRadius: 14,
        padding: "4px 24px 10px",
        color,
        fontFamily: SERIF,
        fontWeight: 900,
        fontSize: size,
        whiteSpace: "nowrap",
        background: "rgba(255,250,242,0.88)",
        boxShadow: `0 14px 30px rgba(96,70,36,0.25)`,
        letterSpacing: 2,
      }}
    >
      {children}
    </div>
  );
};

/** 冲击环（落点强调） */
export const Burst: React.FC<{ t: number; at: number; x: number; y: number; color?: string; r?: number }> = ({
  t,
  at,
  x,
  y,
  color = C.orange,
  r = 160,
}) => {
  const p = invLerp(at, at + 0.6, t);
  if (p <= 0 || p >= 1) return null;
  const k = E.outExpo(p);
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      <circle cx={x} cy={y} r={r * k} fill="none" stroke={color} strokeWidth={7 * (1 - p)} opacity={1 - p} />
      <circle cx={x} cy={y} r={r * 0.7 * k} fill={color} opacity={0.12 * (1 - p)} />
      {Array.from({ length: 12 }).map((_, i) => {
        const ang = (i / 12) * Math.PI * 2 + 0.2;
        const r0 = r * 0.6 * k;
        const r1 = r * (0.78 + 0.4 * k);
        return (
          <line
            key={i}
            x1={x + Math.cos(ang) * r0}
            y1={y + Math.sin(ang) * r0}
            x2={x + Math.cos(ang) * r1}
            y2={y + Math.sin(ang) * r1}
            stroke={color}
            strokeWidth={5 * (1 - p)}
            strokeLinecap="round"
            opacity={1 - p}
          />
        );
      })}
    </svg>
  );
};

/** 章节：开始时间与名称（标题编号、背景水印共用） */
export const CHAPTERS: [string, number, number, string][] = [
  ["开场", 0, 7.7, "缺点"],
  ["优点", 7.7, 34.42, "优点"],
  ["物业", 34.42, 55.6, "01"],
  ["人工湖", 55.6, 67.7, "02"],
  ["2号楼", 67.7, 97, "03"],
];
export const chapterAt = (t: number) => Math.max(0, CHAPTERS.findIndex(([, a, b]) => t >= a && t < b));

/** 标题区：编号 + 栏目名 + 发丝线，下方宋体大标题（遮罩揭示，可切换） */
export const Title: React.FC<{
  t: number;
  items: [at: number, out: number, kicker: string, title: string, color?: string][];
}> = ({ t, items }) => (
  <>
    {items.map(([at, out, kicker, title, color = C.orange], i) => {
      if (t < at - 0.01 || t > out + 0.4) return null;
      const ch = chapterAt(at + 0.01);
      const line = E.outExpo(ramp(t, at + 0.15, at + 0.95)) * (1 - ramp(t, out, out + 0.3, E.inCubic));
      return (
        <div key={i} style={{ position: "absolute", left: 60, top: 190, width: 620 }}>
          <Reveal t={t} at={at} out={out} dur={0.45}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/^\d\d$/.test(CHAPTERS[ch][3]) ? (
                <>
                  <span style={{ fontFamily: NUM, fontWeight: 600, fontSize: 28, color, letterSpacing: 1 }}>{CHAPTERS[ch][3]}</span>
                  <span style={{ width: 1.5, height: 20, background: "rgba(24,61,51,0.25)" }} />
                </>
              ) : (
                <span style={{ width: 22, height: 4, background: color, borderRadius: 2 }} />
              )}
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.sub, letterSpacing: 2 }}>{kicker}</span>
            </div>
          </Reveal>
          <Reveal t={t} at={at + 0.1} out={out} dur={0.6}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 68, color: C.text, lineHeight: 1.16, marginTop: 10, letterSpacing: 1, whiteSpace: "pre-line" }}>
              {title}
            </div>
          </Reveal>
          <div style={{ position: "relative", marginTop: 18, height: 3, width: 600 }}>
            <div style={{ position: "absolute", left: 0, top: 1, height: 1, width: 600 * line, background: "rgba(24,61,51,0.16)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: 3, width: 64 * line, background: color }} />
          </div>
        </div>
      );
    })}
  </>
);

/** 胶囊：实心款带 3D 底边，像可按的按钮 */
export const Chip: React.FC<{ color?: string; size?: number; children: React.ReactNode; solid?: boolean }> = ({
  color = C.orange,
  size = 30,
  children,
  solid,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: `${size * 0.3}px ${size * 0.68}px`,
      borderRadius: 999,
      border: `2px solid ${color}`,
      background: solid ? color : C.card,
      color: solid ? "#fff" : color,
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: size,
      whiteSpace: "nowrap",
      boxShadow: solid
        ? `0 ${size * 0.16}px 0 rgba(0,0,0,0.18), 0 ${size * 0.4}px ${size * 0.7}px rgba(96,70,36,0.22)`
        : `0 ${size * 0.12}px 0 rgba(24,61,51,0.08), 0 ${size * 0.3}px ${size * 0.6}px rgba(96,70,36,0.12)`,
    }}
  >
    {children}
  </div>
);

export const Num: React.FC<{ v: string | number; size: number; color?: string; style?: React.CSSProperties }> = ({
  v,
  size,
  color = C.text,
  style,
}) => (
  <span style={{ fontFamily: NUM, fontWeight: 600, fontSize: size, color, fontVariantNumeric: "tabular-nums", ...style }}>{v}</span>
);

/* ---------------- 图标（线性 SVG） ---------------- */
type IP = { s?: number; c?: string; w?: number };
const svg = (s: number, children: React.ReactNode, vb = 48) => (
  <svg width={s} height={s} viewBox={`0 0 ${vb} ${vb}`} style={{ display: "block", overflow: "visible" }}>
    {children}
  </svg>
);
const st = (c: string, w: number) => ({ fill: "none", stroke: c, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const IHouse: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <path d="M6 22 L24 7 L42 22" {...st(c, w)} />
    <path d="M11 19 V41 H37 V19" {...st(c, w)} />
    <path d="M20 41 V29 H28 V41" {...st(c, w)} />
  </>);
export const IPerson: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <circle cx={24} cy={15} r={7} {...st(c, w)} />
    <path d="M10 42 C10 31 16 26 24 26 C32 26 38 31 38 42" {...st(c, w)} />
  </>);
export const IEye: React.FC<IP & { off?: boolean }> = ({ s = 48, c = C.text, w = 3, off }) =>
  svg(s, <>
    <path d="M4 24 C10 13 17 9 24 9 C31 9 38 13 44 24 C38 35 31 39 24 39 C17 39 10 35 4 24 Z" {...st(c, w)} />
    <circle cx={24} cy={24} r={6} {...st(c, w)} />
    {off && <path d="M8 40 L40 8" {...st(c, w + 0.5)} />}
  </>);
export const ISearch: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <circle cx={20} cy={20} r={12} {...st(c, w)} fill="rgba(255,255,255,0.6)" />
    <path d="M29 29 L42 42" {...st(c, w + 1.5)} />
  </>);
export const ICrown: React.FC<IP> = ({ s = 48, c = C.orange, w = 3 }) =>
  svg(s, <>
    <path d="M7 36 L5 14 L16 23 L24 9 L32 23 L43 14 L41 36 Z" {...st(c, w)} fill={c} fillOpacity={0.22} />
    <path d="M8 41 H40" {...st(c, w)} />
  </>);
export const IScissors: React.FC<IP> = ({ s = 48, c = C.red, w = 3 }) =>
  svg(s, <>
    <circle cx={12} cy={36} r={6} {...st(c, w)} />
    <circle cx={12} cy={12} r={6} {...st(c, w)} />
    <path d="M17 15 L42 34 M17 33 L42 14" {...st(c, w)} />
  </>);
export const IChat: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <path d="M6 10 H42 V32 H22 L13 40 V32 H6 Z" {...st(c, w)} />
  </>);
export const IMail: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <rect x={5} y={11} width={38} height={27} rx={4} {...st(c, w)} fill="#fff" />
    <path d="M6 13 L24 27 L42 13" {...st(c, w)} />
  </>);
export const IBars: React.FC<IP> = ({ s = 48, c = C.green, w = 3 }) =>
  svg(s, <>
    <path d="M6 42 H42" {...st(c, w)} />
    <path d="M12 38 V26 M22 38 V16 M32 38 V22 M40 38 V10" {...st(c, w + 2)} />
  </>);
export const IGap: React.FC<IP> = ({ s = 48, c = C.green, w = 3 }) =>
  svg(s, <>
    <path d="M10 42 V10 M30 42 V24" {...st(c, w + 4)} />
    <path d="M38 10 V24 M35 13 L38 10 L41 13 M35 21 L38 24 L41 21" {...st(C.red, w)} />
  </>);
export const ITrend: React.FC<IP> = ({ s = 48, c = C.red, w = 3 }) =>
  svg(s, <>
    <path d="M5 10 L17 20 L26 16 L42 36" {...st(c, w)} />
    <path d="M33 36 H42 V27" {...st(c, w)} />
  </>);
export const ICalendar: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <rect x={6} y={10} width={36} height={32} rx={4} {...st(c, w)} />
    <path d="M6 19 H42 M15 5 V13 M33 5 V13" {...st(c, w)} />
  </>);
export const IChild: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <circle cx={24} cy={17} r={6} {...st(c, w)} />
    <path d="M14 42 V33 C14 27 18 25 24 25 C30 25 34 27 34 33 V42" {...st(c, w)} />
  </>);

export const IDice: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <rect x={6} y={6} width={36} height={36} rx={8} {...st(c, w)} fill="#fff" />
    {[[16, 16], [32, 16], [24, 24], [16, 32], [32, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={c} />)}
  </>);
export const ISofa: React.FC<IP> = ({ s = 48, c = C.green, w = 3 }) =>
  svg(s, <>
    <path d="M9 24 V16 C9 13 11 11 14 11 H34 C37 11 39 13 39 16 V24" {...st(c, w)} />
    <path d="M5 26 C5 23 9 22 11 25 V30 H37 V25 C39 22 43 23 43 26 V36 H5 Z" {...st(c, w)} fill={c} fillOpacity={0.15} />
    <path d="M9 36 V41 M39 36 V41" {...st(c, w)} />
  </>);
export const IElevator: React.FC<IP> = ({ s = 48, c = C.text, w = 3 }) =>
  svg(s, <>
    <rect x={7} y={5} width={34} height={38} rx={4} {...st(c, w)} />
    <path d="M24 5 V43" {...st(c, w)} />
    <path d="M13 17 L17 12 L21 17 M27 12 L31 17 L35 12" {...st(c, w)} />
  </>);
export const IClock: React.FC<IP & { a?: number }> = ({ s = 48, c = C.red, w = 3, a = 0 }) =>
  svg(s, <>
    <circle cx={24} cy={24} r={18} {...st(c, w)} fill="#fff" />
    <path d={`M24 24 L${24 + Math.sin(a) * 12} ${24 - Math.cos(a) * 12}`} {...st(c, w)} />
    <path d={`M24 24 L${24 + Math.sin(a / 12) * 8} ${24 - Math.cos(a / 12) * 8}`} {...st(c, w + 1)} />
  </>);
export const IHourglass: React.FC<IP & { k?: number }> = ({ s = 48, c = C.orange, w = 3, k = 0 }) =>
  svg(s, <>
    <path d="M12 5 H36 M12 43 H36" {...st(c, w)} />
    <path d="M14 5 C14 16 24 20 24 24 C24 28 14 32 14 43 M34 5 C34 16 24 20 24 24 C24 28 34 32 34 43" {...st(c, w)} />
    <path d={`M${18 + 4 * k} ${12 + 8 * k} H${30 - 4 * k} L24 22 Z`} fill={c} opacity={1 - k} />
    <path d={`M24 ${42 - 10 * k} L${17} 42 H31 Z`} fill={c} />
  </>);
export const IHand: React.FC<IP> = ({ s = 48, c = C.green, w = 3 }) =>
  svg(s, <>
    <path d="M4 30 L14 24 C17 22 20 22 23 23 L31 26 C33 27 33 30 31 30 H22" {...st(c, w)} />
    <path d="M4 40 L12 36 H26 C28 36 30 35 31 34 L42 24 C44 22 41 19 38 21 L30 27" {...st(c, w)} />
    <path d="M30 6 L36 12 L30 18 M36 12 H20" {...st(C.orange, w)} />
  </>);
export const ITag: React.FC<IP> = ({ s = 48, c = C.orange, w = 3 }) =>
  svg(s, <>
    <path d="M6 24 L22 8 H40 V26 L24 42 Z" {...st(c, w)} fill={c} fillOpacity={0.14} />
    <circle cx={33} cy={15} r={3} fill={c} />
  </>);
export const IKey: React.FC<IP> = ({ s = 48, c = C.orange, w = 3 }) =>
  svg(s, <>
    <circle cx={15} cy={24} r={8} {...st(c, w)} />
    <path d="M23 24 H43 M36 24 V31 M42 24 V29" {...st(c, w)} />
  </>);
export const ICheck: React.FC<IP> = ({ s = 48, c = C.green, w = 4 }) => svg(s, <path d="M8 26 L19 36 L40 12" {...st(c, w)} />);
export const ICross: React.FC<IP> = ({ s = 48, c = C.red, w = 4 }) => svg(s, <path d="M11 11 L37 37 M37 11 L11 37" {...st(c, w)} />);

/** 小人（SVG，人群直方图用） */
export const Dude: React.FC<{ s?: number; c?: string }> = ({ s = 30, c = C.green }) => (
  <svg width={s} height={s * 1.25} viewBox="0 0 24 30" style={{ display: "block", overflow: "visible" }}>
    <circle cx={12} cy={7} r={5.5} fill={c} />
    <path d="M3 29 C3 19 7 15 12 15 C17 15 21 19 21 29 Z" fill={c} />
  </svg>
);

/** 占比环（放在 3D 卡片里） */
export const Ring: React.FC<{ t: number; at: number; r: number; frac: number; label: string; color?: string }> = ({
  t,
  at,
  r,
  frac,
  label,
  color = C.orange,
}) => {
  const k = E.outExpo(ramp(t, at, at + 0.9));
  const L = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: r * 2 + 30, height: r * 2 + 30 }}>
      <svg width={r * 2 + 30} height={r * 2 + 30} style={{ position: "absolute" }}>
        <circle cx={r + 15} cy={r + 15} r={r} fill="none" stroke="rgba(24,61,51,0.1)" strokeWidth={14} />
        <circle
          cx={r + 15}
          cy={r + 15}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${L * frac * k + 8} ${L}`}
          transform={`rotate(-90 ${r + 15} ${r + 15})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Num v={label} size={r * 0.5} color={color} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, color: C.muted }}>挂牌占比</div>
      </div>
    </div>
  );
};

/* ---------------- 全屏贴纸（人物全屏时，放在头顶上方空位） ---------------- */
export const Sticker: React.FC<{
  t: number;
  at: number;
  out: number;
  kicker?: string;
  text: string;
  color?: string;
  y?: number;
  tilt?: number;
  glitch?: boolean;
  size?: number;
}> = ({ t, at, out, kicker, text, color = C.orange, y = 200, tilt = -2.5, glitch, size = 64 }) => {
  const { p, o, live } = io(t, at, out, 0.6, 0.3);
  if (!live) return null;
  const k = E.outBack(p, 1.6);
  const a = Math.min(1, p * 3) * (1 - E.inCubic(o));
  const chars = Array.from(text);
  const rx = 70 * (1 - k) - 50 * E.inCubic(o);
  const ry = Math.sin(t * 0.9) * 5 * clamp((t - at) / 0.8);
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, display: "flex", justifyContent: "center", perspective: 1400, opacity: a }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${tilt * 0.5}deg) scale(${1 - 0.15 * E.inCubic(o)})`,
          transformOrigin: "50% 100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {kicker && (
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 32,
              color: "#fff",
              background: color,
              padding: "6px 22px 8px",
              borderRadius: "12px 12px 0 0",
              whiteSpace: "nowrap",
              transform: "translateZ(18px)",
            }}
          >
            {kicker}
          </div>
        )}
        <div style={{ position: "relative", transformStyle: "preserve-3d" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "#CDBFA8", transform: "translateZ(-12px) translateY(10px)" }} />
          <div
            style={{
              position: "relative",
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: size,
              color: glitch ? color : C.text,
              background: C.card,
              border: `3px solid ${color}`,
              padding: "10px 34px 16px",
              borderRadius: 18,
              whiteSpace: "nowrap",
              boxShadow: "0 24px 50px rgba(60,40,20,0.35)",
            }}
          >
            {glitch ? (
              <GlitchText t={t} at={at + 0.05} win={0.45}>
                {text}
              </GlitchText>
            ) : chars.map((ch, i) => {
              const kk = E.outBack(clamp(invLerp(at + 0.15 + i * 0.035, at + 0.45 + i * 0.035, t)));
              return (
                <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - kk) * 30}px)`, opacity: clamp(kk * 1.5) }}>
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
