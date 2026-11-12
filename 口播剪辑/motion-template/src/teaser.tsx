// 开头钩子（新时间 0–5.4s，人物全屏原片色彩）：把“楼王位置二号楼 / 整个屋子的温度会比其他的少个两度”前置。
// 第 0 帧就是完整封面：kicker“本地 · 示例花园”+ 纸条“楼王 2 号楼 / 屋里冷两度！”；说到“温度”时头顶右侧开始飘雪，
// “两度”时“-2℃”砸下来（放在头顶天空里，不压脸）；5.05–5.6s 闪白转场进入原来的开场（盖住中间 0.4 秒换气的画面）。
// 结尾卡片（旧时间 95.85s 起）：从人物圆环处圆形展开一张米白纸，“你家是平面窗 / 还是凸窗？”+ 箭头指向评论按钮。
import React from "react";
import { AbsoluteFill } from "remotion";
import { E, clamp, invLerp, lerp } from "./engine/ease";
import { C, W } from "./engine/theme";
import { SANS, SERIF } from "./engine/fonts";
import { Kinetic } from "./parts2";
import { io } from "./kit";

const X = 60;
const Y = 192;
const BLUE = "#4E8DB5";

const Flake: React.FC<{ x: number; y: number; s: number; a: number; o: number }> = ({ x, y, s, a, o }) => (
  <svg width={60 * s} height={60 * s} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x, top: y, opacity: o, transform: `rotate(${a}deg)` }}>
    {[0, 60, 120].map((r) => (
      <path key={r} d="M0 -24 V24 M-8 -16 L0 -10 L8 -16 M-8 16 L0 10 L8 16" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" transform={`rotate(${r})`} />
    ))}
    {[0, 60, 120].map((r) => (
      <path key={`b${r}`} d="M0 -24 V24" stroke={BLUE} strokeWidth={2} strokeLinecap="round" fill="none" transform={`rotate(${r})`} />
    ))}
  </svg>
);

/** tn = 新时间（秒） */
export const Teaser: React.FC<{ tn: number }> = ({ tn }) => {
  if (tn > 5.7) return null;
  const bump = (a: number) => {
    const d = tn - a;
    return d > 0 && d < 0.5 ? 1 + Math.sin(d * 14) * 0.06 * Math.exp(-d * 6) : 1;
  };
  const strip = (children: React.ReactNode, tilt: number, s = 1) => (
    <div style={{ display: "flex", marginBottom: 12 }}>
      <div
        style={{
          transform: `rotate(${tilt}deg) scale(${s})`,
          transformOrigin: "0% 50%",
          background: C.card,
          borderRadius: 10,
          padding: "6px 22px 10px",
          boxShadow: "0 6px 0 rgba(205,191,168,0.95), 0 16px 30px rgba(40,30,15,0.28)",
          fontFamily: SERIF,
          fontSize: 92,
          lineHeight: 1.12,
          color: C.text,
          whiteSpace: "nowrap",
          letterSpacing: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
  const hl = (txt: string, col: string) => (
    <span style={{ position: "relative", display: "inline-block", padding: "0 0.08em", margin: "0 0.04em" }}>
      <span style={{ position: "absolute", left: 0, top: "10%", bottom: "4%", width: "100%", background: col, transform: "skewX(-10deg)", borderRadius: 6 }} />
      <span style={{ position: "relative", color: "#fff" }}>{txt}</span>
    </span>
  );
  // 闪白：5.05 起亮，5.15–5.35 全白，5.6 退完
  const flash = tn < 5.05 ? 0 : tn < 5.15 ? (tn - 5.05) / 0.1 : tn < 5.35 ? 1 : 1 - clamp((tn - 5.35) / 0.25);
  const snow = clamp((tn - 1.8) / 0.6);
  const out = tn > 5.1 ? 1 : 0;
  return (
    <>
      {out === 0 && (
        <>
          <div style={{ position: "absolute", left: X, top: Y, width: W - X * 2 }}>
            <div style={{ display: "flex", marginBottom: 14 }}>
              <div style={{ fontFamily: SANS, fontSize: 36, color: "#fff", background: C.deep, padding: "6px 20px 8px", borderRadius: 8, letterSpacing: 2, transform: "rotate(-1.5deg)", boxShadow: "0 6px 16px rgba(40,30,15,0.25)" }}>
                本地 · 示例花园
              </div>
            </div>
            {strip(<>楼王{hl("2 号楼", C.red)}</>, -1.2, bump(0.12))}
            {strip(<>屋里{hl("冷两度！", BLUE)}</>, 0.8, bump(4.68))}
          </div>
          {/* 头顶右侧飘雪 */}
          {snow > 0 &&
            Array.from({ length: 7 }).map((_, i) => {
              const sp = 60 + i * 13;
              const y = 200 + (((tn - 1.8) * sp + i * 71) % 420);
              return <Flake key={i} x={640 + ((i * 53) % 330)} y={y} s={0.7 + (i % 3) * 0.2} a={tn * (40 + i * 7)} o={snow * 0.9} />;
            })}
          <Kinetic t={tn} at={4.68} out={5.05} x={740} y={570} text="-2℃" kind="slam" size={100} accent={BLUE} rot={-5} />
        </>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </>
  );
};

/* ---------------- 结尾卡片：从圆环中心圆形展开，旧时间 95.85s 起 ---------------- */
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 95.85) return null;
  const k = E.inOutCubic(clamp((t - 95.85) / 0.55));
  const { p } = io(t, 96.25, Infinity, 0.5);
  const l2 = io(t, 96.55, Infinity, 0.5).p;
  const chip = E.outBack(clamp((t - 96.95) / 0.4), 1.8);
  const draw = E.outCubic(clamp((t - 97.15) / 0.6));
  const bob = Math.sin((t - 97.8) * 7) * 7 * clamp((t - 97.8) * 3);
  const d = "M440 1010 C 720 1000, 990 1000, 1000 1095";
  const tip: [number, number] = [1000, 1150];
  const strip = (children: React.ReactNode, tilt: number, kk: number) => (
    <div style={{ display: "flex", marginBottom: 16, opacity: clamp(kk * 2), transform: `translateY(${(1 - E.outQuart(kk)) * 60}px)` }}>
      <div style={{ transform: `rotate(${tilt}deg)`, background: C.card, borderRadius: 12, padding: "8px 26px 12px", boxShadow: "0 6px 0 rgba(205,191,168,0.95), 0 16px 30px rgba(40,30,15,0.2)", fontFamily: SERIF, fontSize: 96, color: C.text, whiteSpace: "nowrap" }}>
        {children}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ clipPath: k < 1 ? `circle(${lerp(0, 2100, k)}px at 880px 360px)` : undefined }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 110% 70% at 30% 25%, #FCF9F3 0%, ${C.bg} 55%, ${C.bg2} 100%)` }} />
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="endGrid" width={30} height={30} patternUnits="userSpaceOnUse">
            <path d="M30 0 H0 V30" fill="none" stroke="rgba(24,61,51,0.05)" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={W} height={1920} fill="url(#endGrid)" />
      </svg>
      <div style={{ position: "absolute", left: 70, top: 600 }}>
        {strip(<>你家是<span style={{ color: C.red }}>平面窗</span></>, -1.5, p)}
        {strip(<>还是<span style={{ color: C.green }}>凸窗</span>？</>, 1, l2)}
        <div style={{ display: "flex", marginTop: 26, transform: `scale(${chip})`, transformOrigin: "0 50%", opacity: clamp(chip * 3) }}>
          <div style={{ fontFamily: SANS, fontSize: 52, color: "#fff", background: C.orange, borderRadius: 999, padding: "10px 36px 16px", boxShadow: "0 6px 0 rgba(0,0,0,0.16), 0 14px 26px rgba(80,40,10,0.3)", whiteSpace: "nowrap" }}>评论区聊聊</div>
        </div>
      </div>
      {draw > 0 && (
        <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
          <path d={d} fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
          {draw > 0.95 && (
            <g transform={`translate(0 ${bob})`}>
              <path d={`M${tip[0] - 30} ${tip[1] - 34} L${tip[0]} ${tip[1]} L${tip[0] + 26} ${tip[1] - 36}`} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M${tip[0] - 30} ${tip[1] - 34} L${tip[0]} ${tip[1]} L${tip[0] + 26} ${tip[1] - 36}`} fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const _unusedInvLerp = invLerp;
