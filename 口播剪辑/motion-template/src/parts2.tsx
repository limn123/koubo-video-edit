// 第二版新增的动画积木：段落转场容器（多种进出场 + 镜头推拉）、大字冲击、手绘圈注、闪白、私信对话框、
// 图标翻牌、贴纸便签、对话气泡、硬币掉落、剪刀剪价签、翻开的账本、数字滚轮、快门照片
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { E, clamp, invLerp, lerp, ramp } from "./engine/ease";
import { C, H, W } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";
import { rnd } from "./kit";

/* ================= 段落转场容器 ================= */
export type Enter = "fade" | "zoom" | "slideL" | "slideR" | "up" | "iris" | "wipe" | "drop";
export type Exit = "fade" | "zoomOut" | "slideL" | "slideR" | "iris" | "fall" | "up" | "shrink" | "wipe" | "drop";
type Cam = [t: number, s: number, cx: number, cy: number];

const camAt = (t: number, keys: Cam[]) => {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const k = E.inOutCubic(invLerp(a[0], b[0], t));
      return [t, Math.exp(lerp(Math.log(a[1]), Math.log(b[1]), k)), lerp(a[2], b[2], k), lerp(a[3], b[3], k)] as Cam;
    }
  }
  return keys[keys.length - 1];
};

/**
 * 一个画面段落：在 at 用 enter 方式进场，在 out 用 exit 方式离场；ox/oy 是圆形展开/收拢与缩放的中心；
 * cam 为镜头关键帧 [秒, 缩放, 中心x, 中心y]，段落内平滑推拉。子元素只做各自的入场，不再各自翻出。
 */
export const Block: React.FC<{
  t: number;
  at: number;
  out: number;
  enter?: Enter;
  exit?: Exit;
  din?: number;
  dout?: number;
  ox?: number;
  oy?: number;
  cam?: Cam[];
  children: React.ReactNode;
}> = ({ t, at, out, enter = "fade", exit = "fade", din = 0.55, dout = 0.4, ox = 540, oy = 860, cam, children }) => {
  if (t < at - 0.02 || t > out + dout + 0.02) return null;
  const ki = clamp((t - at) / din);
  const ko = clamp((t - out) / dout);
  let tx = 0,
    ty = 0,
    sc = 1,
    rot = 0,
    op = 1;
  let clip: string | undefined;
  const ke = E.outExpo(ki);
  switch (enter) {
    case "fade":
      op *= ki;
      break;
    case "zoom":
      sc *= lerp(0.8, 1, ke);
      op *= Math.min(1, ki * 2.5);
      break;
    case "slideL":
      tx += (1 - ke) * W;
      break;
    case "slideR":
      tx -= (1 - ke) * W;
      break;
    case "up":
      ty += (1 - ke) * 320;
      op *= Math.min(1, ki * 2.5);
      break;
    case "iris":
      if (ki < 1) clip = `circle(${lerp(0, 1500, E.inOutCubic(ki))}px at ${ox}px ${oy}px)`;
      break;
    case "wipe": {
      if (ki < 1) {
        const x = lerp(-420, W + 60, E.inOutCubic(ki));
        clip = `polygon(0 0, ${x + 420}px 0, ${x}px ${H}px, 0 ${H}px)`;
      }
      break;
    }
    case "drop":
      ty -= (1 - E.outBack(ki, 1.15)) * 1000;
      break;
  }
  const kx = E.inCubic(ko);
  if (ko > 0) {
    switch (exit) {
      case "fade":
        op *= 1 - ko;
        break;
      case "zoomOut":
        sc *= lerp(1, 1.22, kx);
        op *= 1 - kx;
        break;
      case "shrink":
        sc *= lerp(1, 0.6, kx);
        op *= 1 - kx;
        break;
      case "slideL":
        tx -= kx * W;
        break;
      case "slideR":
        tx += kx * W;
        break;
      case "iris":
        clip = `circle(${lerp(1500, 0, E.inOutCubic(ko))}px at ${ox}px ${oy}px)`;
        break;
      case "fall":
        ty += kx * 1100;
        rot += kx * 7;
        break;
      case "up":
        ty -= kx * 360;
        op *= 1 - kx;
        break;
      case "wipe": {
        // 斜向擦除离场：从左往右把画面擦掉
        const x = lerp(-420, W + 60, E.inOutCubic(ko));
        clip = `polygon(${x + 420}px 0, ${W + 500}px 0, ${W + 500}px ${H}px, ${x}px ${H}px)`;
        break;
      }
      case "drop":
        ty += kx * 1300;
        break;
    }
  }
  let camT = "";
  if (cam && cam.length) {
    const [, s, cx, cy] = camAt(t, cam);
    camT = ` translate(${cx}px, ${cy}px) scale(${s}) translate(${-cx}px, ${-cy}px)`;
  }
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        clipPath: clip,
        // 变换原点放在左上角：ox/oy 与镜头中心 cx/cy 都是画布坐标（默认原点在画面中心会让推镜绕错点）
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) translate(${ox}px, ${oy}px) scale(${sc}) rotate(${rot}deg) translate(${-ox}px, ${-oy}px)${camT}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ================= 大字冲击 ================= */
export type KStyle = "slam" | "drop" | "marker" | "type" | "strike";
export const Kinetic: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  text: string;
  kind: KStyle;
  size?: number;
  color?: string;
  accent?: string;
  rot?: number;
  sub?: string;
}> = ({ t, at, out = Infinity, x, y, text, kind, size = 96, color = C.text, accent = C.red, rot = -3, sub }) => {
  if (t < at - 0.02 || t > out + 0.4) return null;
  const o = Number.isFinite(out) ? E.inCubic(clamp((t - out) / 0.3)) : 0;
  const chars = Array.from(text);
  const d = t - at;
  let body: React.ReactNode = null;
  if (kind === "slam") {
    const k = clamp(d / 0.22);
    const s = d < 0.22 ? lerp(2.6, 1, E.inCubic(k)) : 1 + Math.sin((d - 0.22) * 40) * 0.05 * Math.exp(-(d - 0.22) * 8);
    body = (
      <div
        style={{
          transform: `scale(${s}) rotate(${rot}deg)`,
          opacity: Math.min(1, k * 3),
          background: accent,
          color: "#fff",
          fontFamily: SERIF,
          fontSize: size,
          padding: `${size * 0.08}px ${size * 0.32}px ${size * 0.14}px`,
          borderRadius: size * 0.16,
          whiteSpace: "nowrap",
          boxShadow: `0 ${size * 0.1}px 0 rgba(0,0,0,0.22), 0 ${size * 0.3}px ${size * 0.6}px rgba(60,20,10,0.35)`,
          letterSpacing: 2,
        }}
      >
        {text}
      </div>
    );
  } else if (kind === "drop") {
    body = (
      <div style={{ display: "flex", fontFamily: SERIF, fontSize: size, color, whiteSpace: "nowrap", textShadow: "0 6px 0 rgba(70,50,20,0.12)" }}>
        {chars.map((ch, i) => {
          const kk = clamp((d - i * 0.06) / 0.42);
          const yy = (1 - E.outBack(kk, 1.9)) * -220;
          return (
            <span key={i} style={{ display: "inline-block", transform: `translateY(${yy}px) rotate(${(1 - kk) * (rnd(i) - 0.5) * 50}deg)`, opacity: clamp(kk * 3) }}>
              {ch}
            </span>
          );
        })}
      </div>
    );
  } else if (kind === "marker") {
    const rv = E.outQuart(clamp(d / 0.4));
    const sw = E.outCubic(clamp((d - 0.2) / 0.45));
    body = (
      <div style={{ position: "relative", fontFamily: SERIF, fontSize: size, color, whiteSpace: "nowrap", overflow: "hidden", paddingBottom: size * 0.1 }}>
        <div style={{ position: "absolute", left: -8, top: "48%", height: "42%", width: `calc(${sw * 100}% + 16px)`, background: accent, opacity: 0.55, transform: "skewX(-10deg)", borderRadius: 6 }} />
        <div style={{ position: "relative", transform: `translateY(${(1 - rv) * 110}%)` }}>{text}</div>
      </div>
    );
  } else if (kind === "type") {
    const n = Math.floor(clamp(d / Math.max(0.3, chars.length * 0.07)) * chars.length + 0.001);
    const caret = Math.floor(d * 3) % 2 === 0 || n < chars.length;
    body = (
      <div style={{ fontFamily: SERIF, fontSize: size, color, whiteSpace: "nowrap" }}>
        {chars.slice(0, n).join("")}
        <span style={{ display: "inline-block", width: size * 0.08, height: size * 0.9, marginLeft: 6, background: accent, verticalAlign: "-0.1em", opacity: caret ? 1 : 0 }} />
      </div>
    );
  } else {
    const rv = E.outQuart(clamp(d / 0.4));
    const st = E.outCubic(clamp((d - 0.45) / 0.35));
    body = (
      <div style={{ position: "relative", fontFamily: SERIF, fontSize: size, color: st > 0.5 ? C.muted : color, whiteSpace: "nowrap", transform: `translateY(${(1 - rv) * 40}px)`, opacity: rv }}>
        {text}
        <div style={{ position: "absolute", left: -10, top: "50%", height: size * 0.09, width: `calc(${st * 100}% + 20px)`, background: accent, borderRadius: 4, transform: "rotate(-3deg)" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${1 - 0.2 * o})`, opacity: 1 - o, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {body}
      {sub && <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: size * 0.32, color: C.sub, opacity: clamp((d - 0.3) / 0.3) }}>{sub}</div>}
    </div>
  );
};

/* ================= 手绘圈注 ================= */
export const MarkCircle: React.FC<{ t: number; at: number; out?: number; cx: number; cy: number; rx: number; ry: number; color?: string; seed?: number }> = ({
  t,
  at,
  out = Infinity,
  cx,
  cy,
  rx,
  ry,
  color = C.red,
  seed = 1,
}) => {
  if (t < at || t > out + 0.3) return null;
  const k = E.outCubic(clamp((t - at) / 0.5));
  const o = Number.isFinite(out) ? clamp((t - out) / 0.3) : 0;
  const pts: string[] = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const a = -2.2 + (i / N) * Math.PI * 2.18;
    const w = 1 + 0.05 * Math.sin(i * 0.7 + seed) + (i / N) * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * w).toFixed(1)},${(cy + Math.sin(a) * ry * w).toFixed(1)}`);
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - o }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
    </svg>
  );
};

/* ================= 闪白 ================= */
export const Flash: React.FC<{ t: number; at: number; strength?: number }> = ({ t, at, strength = 0.55 }) => {
  const d = t - at;
  if (d < 0 || d > 0.3) return null;
  const a = d < 0.05 ? d / 0.05 : 1 - (d - 0.05) / 0.25;
  return <AbsoluteFill style={{ background: "#FFFDF6", opacity: a * strength, pointerEvents: "none" }} />;
};

/* ================= 数字滚轮 ================= */
export const Odo: React.FC<{ v: number; digits: number; size: number; color?: string }> = ({ v, digits, size, color = C.text }) => (
  <span style={{ display: "inline-flex", height: size * 1.1, overflow: "hidden", fontFamily: NUM, fontWeight: 700, fontSize: size, color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
    {Array.from({ length: digits }).map((_, i) => {
      const p = Math.pow(10, digits - 1 - i);
      // 高位只按整数显示（否则 160 的百位会停在 1.6 格之间），个位可以平滑滚动
      const dv = i < digits - 1 ? Math.floor(v / p + 1e-6) % 10 : v % 10;
      const lead = v < p && i < digits - 1;
      return (
        <span key={i} style={{ display: "inline-block", height: size * 1.1, opacity: lead ? 0 : 1 }}>
          <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-dv * size * 1.1}px)` }}>
            {Array.from({ length: 11 }).map((__, n) => (
              <span key={n} style={{ height: size * 1.1 }}>
                {n % 10}
              </span>
            ))}
          </span>
        </span>
      );
    })}
  </span>
);

/* ================= 私信对话框 ================= */
export type Msg = { at: number; text: string; side?: "l" | "r" };
export const Chat: React.FC<{ t: number; at: number; x: number; y: number; w: number; title: string; msgs: Msg[] }> = ({ t, at, x, y, w, title, msgs }) => {
  const k = E.outBack(clamp((t - at) / 0.5), 1.3);
  const shown = msgs.filter((m) => t >= m.at - 0.7);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        borderRadius: 34,
        background: "#F3F1EC",
        boxShadow: "0 8px 0 #D8CDB9, 0 30px 60px rgba(60,40,20,0.28)",
        overflow: "hidden",
        transform: `translateY(${(1 - k) * 200}px) scale(${lerp(0.85, 1, k)})`,
        opacity: clamp(k * 2),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS, fontSize: 28 }}>客</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.text }}>{title}</div>
        <div style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 22, color: C.muted }}>示意</div>
      </div>
      <div style={{ padding: "22px 26px 28px", display: "flex", flexDirection: "column", gap: 18, minHeight: 360 }}>
        {shown.map((m, i) => {
          const typing = t < m.at;
          const kk = E.outBack(clamp((t - (m.at - 0.7)) / 0.35), 1.6);
          return (
            <div key={i} style={{ display: "flex", justifyContent: m.side === "r" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: w * 0.78,
                  padding: "16px 26px",
                  borderRadius: m.side === "r" ? "26px 26px 6px 26px" : "26px 26px 26px 6px",
                  background: m.side === "r" ? "#9EE07C" : C.card,
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 38,
                  color: C.text,
                  boxShadow: "0 4px 10px rgba(60,40,20,0.1)",
                  transform: `scale(${lerp(0.4, 1, kk)})`,
                  transformOrigin: m.side === "r" ? "100% 100%" : "0% 100%",
                  opacity: clamp(kk * 2),
                }}
              >
                {typing ? (
                  <span style={{ display: "inline-flex", gap: 8 }}>
                    {[0, 1, 2].map((j) => (
                      <span key={j} style={{ width: 12, height: 12, borderRadius: 6, background: C.muted, transform: `translateY(${Math.sin(t * 12 - j) * 4}px)` }} />
                    ))}
                  </span>
                ) : (
                  m.text
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= 图标 ================= */
type IP = { s?: number; c?: string };
const sw = (c: string, w = 3.2) => ({ fill: "none", stroke: c, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const box = (s: number, ch: React.ReactNode) => (
  <svg width={s} height={s} viewBox="0 0 48 48" style={{ display: "block", overflow: "visible" }}>
    {ch}
  </svg>
);
export const IcClock: React.FC<IP> = ({ s = 56, c = C.red }) => box(s, <><circle cx={24} cy={24} r={18} {...sw(c)} /><path d="M24 13 V24 L32 29" {...sw(c)} /></>);
export const IcId: React.FC<IP> = ({ s = 56, c = C.red }) =>
  box(s, <><rect x={5} y={11} width={38} height={27} rx={4} {...sw(c)} /><circle cx={16} cy={22} r={4} {...sw(c)} /><path d="M10 33 C11 28 21 28 22 33 M27 19 H38 M27 25 H36" {...sw(c)} /></>);
export const IcBolt: React.FC<IP> = ({ s = 56, c = C.red }) => box(s, <path d="M27 4 L10 27 H23 L20 44 L38 19 H25 Z" {...sw(c)} fill={c} fillOpacity={0.15} />);
export const IcPct: React.FC<IP> = ({ s = 56, c = C.red }) => box(s, <><circle cx={14} cy={14} r={6} {...sw(c)} /><circle cx={34} cy={34} r={6} {...sw(c)} /><path d="M38 10 L10 38" {...sw(c)} /></>);
export const IcReceipt: React.FC<IP> = ({ s = 56, c = C.red }) =>
  box(s, <><path d="M10 5 H38 V43 L33 39 L28 43 L24 39 L20 43 L15 39 L10 43 Z" {...sw(c)} /><path d="M16 15 H32 M16 22 H32 M16 29 H26" {...sw(c)} /></>);
export const IcPie: React.FC<IP> = ({ s = 56, c = C.red }) => box(s, <><circle cx={24} cy={24} r={18} {...sw(c)} /><path d="M24 6 A18 18 0 0 1 24 42 Z" fill={c} fillOpacity={0.35} /></>);
export const IcCal: React.FC<IP> = ({ s = 56, c = C.red }) =>
  box(s, <><rect x={6} y={10} width={36} height={32} rx={4} {...sw(c)} /><path d="M6 19 H42 M15 5 V13 M33 5 V13" {...sw(c)} /><text x={24} y={37} textAnchor="middle" fontFamily={NUM} fontWeight={700} fontSize={14} fill={c}>10</text></>);
export const IcBasket: React.FC<IP> = ({ s = 56, c = C.green }) =>
  box(s, <><path d="M6 18 H42 L37 41 H11 Z" {...sw(c)} fill={c} fillOpacity={0.12} /><path d="M15 18 L22 6 M33 18 L26 6 M18 26 V34 M24 26 V34 M30 26 V34" {...sw(c)} /></>);
export const IcHosp: React.FC<IP> = ({ s = 56, c = C.green }) =>
  box(s, <><rect x={6} y={6} width={36} height={36} rx={8} {...sw(c)} fill={c} fillOpacity={0.12} /><path d="M24 14 V34 M14 24 H34" {...sw(c, 5)} /></>);
export const IcElevatorX: React.FC<IP> = ({ s = 56, c = C.red }) =>
  box(s, <><rect x={8} y={5} width={32} height={38} rx={4} {...sw(c)} /><path d="M24 5 V43 M13 17 L17 12 L21 17 M27 12 L31 17 L35 12" {...sw(c)} /><path d="M4 44 L44 4" {...sw(c, 4.5)} /></>);

/* ================= 图标翻牌（可被“吸”进某个位置） ================= */
export const IconTile: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  suckAt?: number;
  sx?: number;
  sy?: number;
}> = ({ t, at, x, y, w, h, icon, label, value, color = C.red, suckAt, sx = 0, sy = 0 }) => {
  if (t < at - 0.01) return null;
  const k = clamp((t - at) / 0.5);
  const s = suckAt !== undefined ? E.inCubic(clamp((t - suckAt) / 0.45)) : 0;
  if (s >= 1) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        perspective: 900,
        transform: `translate(${(sx - cx) * s}px, ${(sy - cy) * s}px) scale(${lerp(1, 0.15, s)}) rotate(${s * 25}deg)`,
        opacity: 1 - s * 0.6,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 22,
          background: C.card,
          border: `2px solid ${color}40`,
          boxShadow: "0 7px 0 #DED2BE, 0 18px 34px rgba(70,50,20,0.16)",
          transform: `rotateY(${(1 - E.outBack(k, 1.4)) * 95}deg)`,
          opacity: clamp(k * 3),
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: 84, height: 84, borderRadius: 20, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontFamily: SANS, fontSize: 26, color: C.sub, whiteSpace: "nowrap" }}>{label}</span>
          <span style={{ fontFamily: SERIF, fontSize: 44, color, whiteSpace: "nowrap" }}>{value}</span>
        </div>
      </div>
    </div>
  );
};

/* ================= 贴纸便签（带胶带，拍上去） ================= */
export const Sticky: React.FC<{ t: number; at: number; x: number; y: number; text: string; rot?: number; color?: string; ink?: string; w?: number }> = ({
  t,
  at,
  x,
  y,
  text,
  rot = -4,
  color = "#FFE38A",
  ink = C.red,
  w = 300,
}) => {
  if (t < at) return null;
  const d = t - at;
  const k = clamp(d / 0.18);
  const s = d < 0.18 ? lerp(1.5, 1, E.inCubic(k)) : 1 + Math.sin((d - 0.18) * 30) * 0.03 * Math.exp(-(d - 0.18) * 8);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `rotate(${rot}deg) scale(${s})`, opacity: Math.min(1, k * 3) }}>
      <div style={{ position: "absolute", left: "50%", top: -16, width: 110, height: 34, marginLeft: -55, background: "rgba(255,255,255,0.65)", transform: "rotate(3deg)", boxShadow: "0 2px 4px rgba(0,0,0,0.08)" }} />
      <div style={{ background: color, padding: "22px 22px 24px", fontFamily: SERIF, fontSize: 44, color: ink, textAlign: "center", boxShadow: `0 ${d < 0.18 ? 30 : 12}px ${d < 0.18 ? 40 : 22}px rgba(70,50,20,0.25)`, whiteSpace: "nowrap" }}>
        {text}
      </div>
    </div>
  );
};

/* ================= 对话气泡（从某点长出） ================= */
export const Bubble: React.FC<{ t: number; at: number; x: number; y: number; text: string; color?: string; dir?: "l" | "r" }> = ({ t, at, x, y, text, color = C.red, dir = "l" }) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.35), 2);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${dir === "l" ? "0" : "-100%"}, -100%) scale(${k})`, transformOrigin: dir === "l" ? "0% 100%" : "100% 100%" }}>
      <div style={{ position: "relative", background: color, color: "#fff", fontFamily: SERIF, fontSize: 40, padding: "10px 26px 14px", borderRadius: 26, whiteSpace: "nowrap", boxShadow: "0 10px 22px rgba(80,20,10,0.25)" }}>
        {text}
        <div style={{ position: "absolute", [dir === "l" ? "left" : "right"]: 22, bottom: -14, width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderTop: `18px solid ${color}` }} />
      </div>
    </div>
  );
};

/* ================= 硬币掉落 ================= */
/** floor：落到这个高度就消失（不掉进字幕区） */
export const CoinsFall: React.FC<{ t: number; at: number; x: number; y: number; n?: number; spread?: number; floor?: number }> = ({ t, at, x, y, n = 8, spread = 220, floor = 1160 }) => {
  const d = t - at;
  if (d < 0 || d > 1.6) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {Array.from({ length: n }).map((_, i) => {
        const dt = d - i * 0.05;
        if (dt < 0) return null;
        const vx = (rnd(i * 3) - 0.5) * spread * 2.2;
        const vy = -260 - rnd(i * 5) * 260;
        const px = x + vx * dt;
        const py = y + vy * dt + 1400 * dt * dt;
        const sc = Math.abs(Math.cos(dt * 9 + i));
        return (
          <g key={i} transform={`translate(${px} ${py}) scale(${0.25 + 0.75 * sc} 1)`} opacity={clamp(1.4 - dt) * clamp((floor - py) / 40)}>
            <circle r={24} fill="#EDBE4A" stroke="#B88A1E" strokeWidth={4} />
            <text y={9} textAnchor="middle" fontFamily={NUM} fontWeight={700} fontSize={26} fill="#8A6512">
              ¥
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ================= 剪刀剪价签：价签被一剪两半掉下去 ================= */
export const CutTag: React.FC<{ t: number; at: number; cutAt: number; x: number; y: number; w: number; h: number; children: React.ReactNode }> = ({ t, at, cutAt, x, y, w, h, children }) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.45), 1.5);
  const sx = lerp(x - 160, x + w + 60, E.inOutCubic(clamp((t - cutAt + 0.35) / 0.45)));
  const after = clamp((t - cutAt) / 0.9);
  const f = E.inCubic(after);
  const half = (top: boolean) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: top ? "polygon(0 0, 100% 0, 100% 46%, 0 54%)" : "polygon(0 54%, 100% 46%, 100% 100%, 0 100%)",
        transform: after > 0 ? `translate(${(top ? -1 : 1) * 50 * f}px, ${(top ? 160 : 320) * f}px) rotate(${(top ? -14 : 16) * f}deg)` : undefined,
        opacity: 1 - clamp(f * 1.4),
      }}
    >
      {children}
    </div>
  );
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${k})`, opacity: clamp(k * 2) }}>
        {after > 0 ? (
          <>
            {half(true)}
            {half(false)}
          </>
        ) : (
          children
        )}
      </div>
      {t > cutAt - 0.4 && t < cutAt + 0.25 && (
        <svg width={120} height={90} viewBox="0 0 48 36" style={{ position: "absolute", left: sx, top: y + h / 2 - 45, overflow: "visible" }}>
          <g transform={`rotate(${Math.sin(t * 40) * 8} 14 18)`}>
            <circle cx={8} cy={8} r={6} fill="none" stroke={C.text} strokeWidth={3} />
            <circle cx={8} cy={28} r={6} fill="none" stroke={C.text} strokeWidth={3} />
            <path d="M13 11 L46 22 M13 25 L46 14" stroke="#9AA4A0" strokeWidth={4} strokeLinecap="round" />
          </g>
        </svg>
      )}
    </>
  );
};

/* ================= 翻开的账本 ================= */
export const Ledger: React.FC<{ t: number; at: number; x: number; y: number; w: number; h: number; openAt: number; left: React.ReactNode; right: React.ReactNode }> = ({
  t,
  at,
  x,
  y,
  w,
  h,
  openAt,
  left,
  right,
}) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.45), 1.3);
  const op = E.inOutCubic(clamp((t - openAt) / 0.7));
  const pw = w / 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 2000, transform: `translateY(${(1 - k) * 160}px)`, opacity: clamp(k * 2) }}>
      {/* 右页（内容） */}
      <div style={{ position: "absolute", left: pw, top: 0, width: pw, height: h, background: "#FFFDF5", borderRadius: "0 18px 18px 0", boxShadow: "0 20px 40px rgba(70,50,20,0.25)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(180deg, transparent 0 47px, rgba(24,61,51,0.08) 47px 48px)" }} />
        <div style={{ position: "relative", padding: "30px 28px" }}>{right}</div>
      </div>
      {/* 左页：先是封面，翻开后露出左页内容 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: h, background: "#FFFDF5", borderRadius: "18px 0 0 18px", boxShadow: "0 20px 40px rgba(70,50,20,0.25)", overflow: "hidden", opacity: op > 0.5 ? 1 : 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(180deg, transparent 0 47px, rgba(24,61,51,0.08) 47px 48px)" }} />
        <div style={{ position: "relative", padding: "30px 28px" }}>{left}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: pw,
          top: 0,
          width: pw,
          height: h,
          transformOrigin: "0% 50%",
          transform: `rotateY(${-180 * op}deg)`,
          background: `linear-gradient(135deg, ${C.deep}, #24524A)`,
          borderRadius: "0 18px 18px 0",
          display: op > 0.5 ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 40px rgba(20,30,20,0.35)",
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 56, color: "#F2D9A6", border: "3px solid #F2D9A6", padding: "18px 26px", borderRadius: 10 }}>账本</div>
      </div>
      <div style={{ position: "absolute", left: pw - 3, top: 0, width: 6, height: h, background: "rgba(24,61,51,0.25)" }} />
    </div>
  );
};

/* ================= 快门照片：闪一下白、略大落定、带白边 ================= */
export const Snap: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  caption?: string;
  rot?: number;
  color?: string;
  pos?: string;
}> = ({ t, at, x, y, w, h, src, caption, rot = 0, color = C.orange, pos = "50% 50%" }) => {
  if (t < at) return null;
  const d = t - at;
  const k = E.outCubic(clamp(d / 0.35));
  const flash = d < 0.25 ? 1 - d / 0.25 : 0;
  const z = lerp(1.0, 1.1, clamp(d / 6));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `rotate(${rot * k}deg) scale(${lerp(1.25, 1, k)})`,
        opacity: clamp(d / 0.08),
        background: "#FFFFFF",
        padding: 12,
        paddingBottom: caption ? 64 : 12,
        boxShadow: `0 ${lerp(40, 16, k)}px ${lerp(60, 30, k)}px rgba(60,40,20,0.3)`,
        borderRadius: 6,
      }}
    >
      <div style={{ position: "relative", width: w - 24, height: h, overflow: "hidden", background: "#ddd" }}>
        <Img src={staticFile(`clips/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${z})` }} />
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
      </div>
      {caption && (
        <div style={{ position: "absolute", left: 18, bottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.text }}>
          <svg width={20} height={26} viewBox="0 0 22 28">
            <path d="M11 27 C11 27 2 16 2 10 A9 9 0 0 1 20 10 C20 16 11 27 11 27 Z" fill={color} />
            <circle cx={11} cy={10} r={3.6} fill="#fff" />
          </svg>
          {caption}
        </div>
      )}
    </div>
  );
};
