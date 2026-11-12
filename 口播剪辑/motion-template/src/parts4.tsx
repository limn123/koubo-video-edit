// 本条（示例工程）新增的动画积木：菜刀、价签、仪表盘、小人、法槌、锁链、心电线、礼盒、雷达、纸面卡片
import React from "react";
import { E, clamp, invLerp, lerp } from "./engine/ease";
import { C } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";

export const PAPER: React.CSSProperties = {
  background: C.card,
  borderRadius: 20,
  boxShadow: "0 8px 0 #DED2BE, 0 20px 36px rgba(70,50,20,0.16)",
};

/** 入场进度（秒）：a 起，d 秒内 0→1 */
export const kIn = (t: number, a: number, d = 0.45, ease = E.outCubic) => ease(clamp((t - a) / d));
/** 回弹进度 */
export const kPop = (t: number, a: number, d = 0.42, s = 1.7) => E.outBack(clamp((t - a) / d), s);
/** 落点一下的弹跳缩放 */
export const bump = (t: number, a: number, amp = 0.08) => {
  const d = t - a;
  return d > 0 && d < 0.6 ? 1 + Math.sin(d * 16) * amp * Math.exp(-d * 7) : 1;
};

/* ---------------- 菜刀：刀刃朝下，ang 为绕刀柄末端的旋转角 ---------------- */
export const Cleaver: React.FC<{ x: number; y: number; ang?: number; s?: number }> = ({ x, y, ang = 0, s = 1 }) => (
  <svg width={360} height={200} viewBox="0 0 360 200" style={{ position: "absolute", left: x, top: y, overflow: "visible", transform: `rotate(${ang}deg) scale(${s})`, transformOrigin: "330px 60px" }}>
    <path d="M20 30 H230 V150 C150 156 70 156 20 150 Z" fill="#E9EEF0" stroke="#5E6B6F" strokeWidth={4} />
    <path d="M20 150 C70 156 150 156 230 150 V138 C150 144 70 144 20 138 Z" fill="#FFFFFF" opacity={0.9} />
    <circle cx={52} cy={60} r={10} fill="none" stroke="#5E6B6F" strokeWidth={4} />
    <rect x={226} y={44} width={110} height={34} rx={14} fill="#5B3A22" />
    <circle cx={258} cy={61} r={4} fill="#E8D3B0" />
    <circle cx={300} cy={61} r={4} fill="#E8D3B0" />
  </svg>
);

/* ---------------- 价签：左侧三角 + 圆孔，主色底白字 ---------------- */
export const Tag: React.FC<{ text: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ text, color = C.orange, size = 44, style }) => (
  <div style={{ display: "inline-flex", alignItems: "stretch", filter: "drop-shadow(0 10px 16px rgba(80,50,20,0.25))", ...style }}>
    <svg width={size * 0.9} height={size * 1.6} viewBox="0 0 40 70" preserveAspectRatio="none">
      <path d="M40 0 L4 35 L40 70 Z" fill={color} />
      <circle cx={26} cy={35} r={5} fill={C.bg} />
    </svg>
    <div style={{ display: "flex", alignItems: "center", background: color, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: size, padding: `0 ${size * 0.55}px 0 ${size * 0.2}px`, borderRadius: `0 ${size * 0.3}px ${size * 0.3}px 0`, whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

/* ---------------- 小人（静态剪影）：mood 改变嘴型 ---------------- */
export const Fig: React.FC<{ s?: number; c?: string; mood?: "smile" | "flat" | "sad" }> = ({ s = 1, c = C.green, mood = "flat" }) => (
  <svg width={90 * s} height={150 * s} viewBox="0 0 60 100" style={{ display: "block", overflow: "visible" }}>
    <circle cx={30} cy={16} r={12} fill={c} />
    <path d="M12 62 C12 38 19 31 30 31 C41 31 48 38 48 62 Z" fill={c} />
    <rect x={20} y={60} width={8} height={34} rx={4} fill={c} />
    <rect x={32} y={60} width={8} height={34} rx={4} fill={c} />
    <circle cx={26} cy={14} r={1.8} fill="#fff" />
    <circle cx={34} cy={14} r={1.8} fill="#fff" />
    {mood === "smile" && <path d="M25 20 Q30 24 35 20" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" />}
    {mood === "sad" && <path d="M25 22 Q30 18 35 22" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" />}
    {mood === "flat" && <path d="M26 21 H34" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />}
  </svg>
);

/* ---------------- 仪表盘：-90°(左) 到 +90°(右)，左半“正常”绿、右半“狠”红；needle 为角度 ---------------- */
export const Gauge: React.FC<{ cx: number; cy: number; r: number; needle: number; k: number; blur?: number }> = ({ cx, cy, r, needle, k, blur = 0 }) => {
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [cx + Math.sin((a * Math.PI) / 180) * r, cy - Math.cos((a * Math.PI) / 180) * r];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: k }}>
      <path d={arc(-90, -3)} stroke={C.green} strokeWidth={44} fill="none" pathLength={1} strokeDasharray={`${k} 1`} opacity={0.9} />
      <path d={arc(3, 90)} stroke={C.red} strokeWidth={44} fill="none" pathLength={1} strokeDasharray={`${k} 1`} opacity={0.9} />
      {Array.from({ length: 13 }).map((_, i) => {
        const a = ((-90 + i * 15) * Math.PI) / 180;
        return <line key={i} x1={cx + Math.sin(a) * (r - 40)} y1={cy - Math.cos(a) * (r - 40)} x2={cx + Math.sin(a) * (r - 58)} y2={cy - Math.cos(a) * (r - 58)} stroke={C.text} strokeOpacity={0.35} strokeWidth={3} />;
      })}
      <text x={cx - r * 0.62} y={cy - r * 0.28} fontFamily={SANS} fontWeight={600} fontSize={40} fill={C.green} textAnchor="middle">正常</text>
      <text x={cx + r * 0.62} y={cy - r * 0.28} fontFamily={SANS} fontWeight={600} fontSize={40} fill={C.red} textAnchor="middle">狠</text>
      <g transform={`rotate(${needle} ${cx} ${cy})`} style={{ filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
        <path d={`M${cx - 12} ${cy} L${cx} ${cy - r + 34} L${cx + 12} ${cy} Z`} fill={C.text} />
      </g>
      <circle cx={cx} cy={cy} r={22} fill={C.text} />
      <circle cx={cx} cy={cy} r={8} fill={C.card} />
    </svg>
  );
};

/* ---------------- 法槌：举起 → 砸下（hit 秒落下） ---------------- */
export const Gavel: React.FC<{ t: number; hit: number; x: number; y: number }> = ({ t, hit, x, y }) => {
  const up = E.outCubic(clamp((t - (hit - 0.55)) / 0.35));
  const down = E.inCubic(clamp((t - (hit - 0.12)) / 0.12));
  const ang = -38 * up * (1 - down) + Math.sin(Math.max(0, t - hit) * 30) * 4 * Math.exp(-Math.max(0, t - hit) * 8);
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {/* 底座 */}
      <div style={{ position: "absolute", left: 40, top: 150, width: 200, height: 34, borderRadius: 10, background: "#7A4E2D", boxShadow: "0 10px 18px rgba(60,30,10,0.3)" }} />
      <svg width={300} height={200} viewBox="0 0 300 200" style={{ position: "absolute", left: 20, top: -30, overflow: "visible", transform: `rotate(${ang}deg)`, transformOrigin: "260px 160px" }}>
        <rect x={60} y={120} width={210} height={20} rx={10} fill="#8B5A33" />
        <rect x={20} y={80} width={90} height={100} rx={16} fill="#6B4226" />
        <rect x={20} y={96} width={90} height={12} fill="#C9A26B" />
        <rect x={20} y={152} width={90} height={12} fill="#C9A26B" />
      </svg>
    </div>
  );
};

/* ---------------- 心电线：从左往右刷出来，fast=心跳快慢 ---------------- */
export const ecgPath = (x0: number, y0: number, w: number, beats: number, amp: number, jitter = 0) => {
  const pts: string[] = [];
  const per = w / beats;
  for (let b = 0; b < beats; b++) {
    const bx = x0 + b * per;
    const j = Math.sin(b * 3.1) * jitter;
    pts.push(`${bx},${y0}`, `${bx + per * 0.35},${y0}`, `${bx + per * 0.42},${y0 - amp * 0.25 + j}`, `${bx + per * 0.48},${y0 + amp * 0.2}`, `${bx + per * 0.54},${y0 - amp - j}`, `${bx + per * 0.6},${y0 + amp * 0.45}`, `${bx + per * 0.68},${y0}`);
  }
  pts.push(`${x0 + w},${y0}`);
  return "M" + pts.join(" L");
};

/* ---------------- 礼盒：盖子在 openAt 弹开 ---------------- */
export const Gift: React.FC<{ t: number; x: number; y: number; openAt: number; s?: number }> = ({ t, x, y, openAt, s = 1 }) => {
  const o = E.outBack(clamp((t - openAt) / 0.4), 2);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", left: 0, top: 50, width: 200, height: 150, background: C.red, borderRadius: 12, boxShadow: "0 14px 24px rgba(120,40,30,0.3)" }} />
      <div style={{ position: "absolute", left: 88, top: 50, width: 24, height: 150, background: "#F6D27A" }} />
      <div style={{ position: "absolute", left: -12, top: 20 - o * 70, width: 224, height: 44, background: "#E25A4C", borderRadius: 10, transform: `rotate(${-o * 18}deg)`, transformOrigin: "0% 100%", boxShadow: "0 8px 14px rgba(120,40,30,0.25)" }}>
        <div style={{ position: "absolute", left: 100, top: 0, width: 24, height: 44, background: "#F6D27A" }} />
        <svg width={120} height={60} viewBox="0 0 120 60" style={{ position: "absolute", left: 52, top: -50 }}>
          <path d="M60 56 C30 10 4 30 20 46 C30 56 50 56 60 56 C70 56 90 56 100 46 C116 30 90 10 60 56 Z" fill="#F6D27A" stroke="#D9A93E" strokeWidth={3} />
        </svg>
      </div>
    </div>
  );
};

/* ---------------- 大号数值：数字 + 单位 ---------------- */
export const Big: React.FC<{ v: React.ReactNode; unit?: string; size?: number; color?: string }> = ({ v, unit, size = 96, color = C.text }) => (
  <span style={{ whiteSpace: "nowrap", color }}>
    <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: size, letterSpacing: -1 }}>{v}</span>
    {unit && <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: size * 0.42, marginLeft: 4 }}>{unit}</span>}
  </span>
);

/* ---------------- 标签胶囊（小字说明） ---------------- */
export const Pill: React.FC<{ children: React.ReactNode; color?: string; size?: number; solid?: boolean; style?: React.CSSProperties }> = ({ children, color = C.text, size: size0 = 30, solid = true, style }) => {
  const size = Math.max(size0, 32); // 手机上可读的下限
  return (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: size,
      color: solid ? "#fff" : color,
      background: solid ? color : C.card,
      border: solid ? undefined : `2.5px solid ${color}`,
      padding: `${size * 0.18}px ${size * 0.6}px ${size * 0.26}px`,
      borderRadius: 999,
      whiteSpace: "nowrap",
      boxShadow: solid ? "0 5px 0 rgba(0,0,0,0.14), 0 10px 20px rgba(60,40,20,0.2)" : "0 8px 16px rgba(60,40,20,0.12)",
      ...style,
    }}
  >
    {children}
  </div>
  );
};

/* ---------------- 手写下划线 / 荧光笔：在 [a, a+d] 内从左往右画出 ---------------- */
export const Marker: React.FC<{ t: number; a: number; x: number; y: number; w: number; color?: string; h?: number; d?: number }> = ({ t, a, x, y, w, color = "#F6D27A", h = 26, d = 0.4 }) => {
  const k = E.outCubic(clamp((t - a) / d));
  if (k <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w * k, height: h, background: color, opacity: 0.75, borderRadius: 6, transform: "skewX(-12deg)", mixBlendMode: "multiply" }} />;
};

/* ---------------- 问号气泡（漂浮） ---------------- */
export const QMark: React.FC<{ t: number; at: number; x: number; y: number; size?: number; color?: string }> = ({ t, at, x, y, size = 90, color = C.orange }) => {
  const k = kPop(t, at, 0.4, 2.2);
  if (k <= 0) return null;
  const fl = Math.sin((t - at) * 3) * 8;
  return (
    <div style={{ position: "absolute", left: x, top: y + fl, transform: `translate(-50%,-50%) scale(${k}) rotate(${Math.sin((t - at) * 2) * 6}deg)`, fontFamily: SERIF, fontSize: size, color, textShadow: "0 8px 16px rgba(80,50,20,0.2)" }}>？</div>
  );
};

/** 线性插值的帮助：在 [a,b] 秒内从 v0 到 v1 */
export const tw = (t: number, a: number, b: number, v0: number, v1: number, ease = E.inOutCubic) => lerp(v0, v1, ease(invLerp(a, b, t)));
