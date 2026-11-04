// 叠加层：评论区箭头（全屏段）、B-roll 段底部压暗（平台白字可读；人物全屏时不压暗）
import React from "react";
import { AbsoluteFill } from "remotion";
import { E, clamp } from "./engine/ease";
import { C, W } from "./engine/theme";
import { NUM, SANS } from "./engine/fonts";
import { io } from "./kit";

/* ---------------- 评论区箭头：从标题下方的标签右端出发，沿右边缘（脸的右侧外面）弯下去指向评论按钮 ---------------- */
const Arrow: React.FC<{ t: number; at: number; out: number; d: string; tip: [number, number] }> = ({ t, at, out, d, tip }) => {
  const { p, o, live } = io(t, at, out, 0.6, 0.3);
  if (!live) return null;
  const draw = E.outCubic(clamp((t - at) / 0.75));
  const a = Math.min(1, p * 3) * (1 - E.inCubic(o));
  const bob = Math.sin((t - at) * 6) * 6 * clamp((t - at - 0.9) * 2);
  const [x, y] = tip;
  return (
    <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: a }}>
      <path d={d} fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} opacity={0.9} />
      <path d={d} fill="none" stroke={C.orange} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
      {draw > 0.95 && (
        <g transform={`translate(0 ${bob})`}>
          <path d={`M${x - 28} ${y - 30} L${x} ${y} L${x + 28} ${y - 30}`} fill="none" stroke="#fff" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          <path d={`M${x - 28} ${y - 30} L${x} ${y} L${x + 28} ${y - 30}`} fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};
export const CommentArrow: React.FC<{ t: number }> = ({ t }) => (
  <Arrow t={t} at={160.95} out={163.7} d="M835 458 C 970 458, 1024 530, 1020 700 L 1012 1020" tip={[1012, 1030]} />
);

/* ---------------- 底部压暗：只在 B-roll 段（米白底上平台作者名/文案是白字）；人物全屏时不压暗 ---------------- */
export const BottomShade: React.FC<{ pip: number }> = ({ pip }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(16,40,33,0) 0px, rgba(16,40,33,0) 1480px, rgba(16,40,33,0.22) 1680px, rgba(16,40,33,0.5) 1920px)", opacity: pip }} />
);

/* ---------------- 结尾评论框示范：标题“打在评论区”下面一条评论输入框，随口播逐项打出示例（标“示例”），
   位置在头顶上方（y 410–506），不压脸；箭头从框右端出发指向评论按钮 ---------------- */
const ITEMS: [string, number][] = [
  ["A小区", 158.3],
  ["两室", 158.8],
  ["挂 55 万", 159.4],
  ["买家出 48 万", 160.45],
];
export const CommentBox: React.FC<{ t: number }> = ({ t }) => {
  if (t < 157.95 || t > 162.0) return null;
  const k = E.outCubic(clamp((t - 158.0) / 0.4));
  const o = E.inCubic(clamp((t - 161.6) / 0.32));
  const caret = Math.floor(t * 3) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 60, top: 410, width: 760, height: 96, opacity: k * (1 - o), transform: `translateY(${(1 - k) * 30 - 50 * o}px)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", borderRadius: 48, boxShadow: "0 6px 0 rgba(205,191,168,0.95), 0 16px 30px rgba(40,30,15,0.28)", display: "flex", alignItems: "center", padding: "0 26px", gap: 14 }}>
        <svg width={40} height={40} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
          <path d="M6 10 H42 V32 H22 L13 40 V32 H6 Z" fill="none" stroke={C.orange} strokeWidth={4} strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.text, whiteSpace: "nowrap", flexShrink: 0 }}>
          {ITEMS.map(([txt, at], i) => {
            const n = Math.floor(clamp((t - at) / 0.32) * txt.length + (t >= at ? 1 : 0));
            if (t < at) return null;
            return (
              <span key={txt}>
                {i > 0 && <span style={{ color: C.muted, margin: "0 8px" }}>·</span>}
                <span style={{ color: i >= 2 ? C.red : C.text, fontFamily: i >= 2 ? `${NUM}, ${SANS}` : SANS }}>{txt.slice(0, Math.min(txt.length, n))}</span>
              </span>
            );
          })}
          <span style={{ width: 3, height: 38, background: C.orange, marginLeft: 4, opacity: caret ? 1 : 0 }} />
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 600, fontSize: 22, color: C.muted, border: `2px solid ${C.muted}`, borderRadius: 8, padding: "0 8px 2px" }}>示例</div>
      </div>
    </div>
  );
};
