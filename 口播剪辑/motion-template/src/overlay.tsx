// 叠加层：评论区箭头（全屏段）、B-roll 段底部压暗（平台白字可读；人物全屏时不压暗）
import React from "react";
import { AbsoluteFill } from "remotion";
import { E, clamp } from "./engine/ease";
import { C, W } from "./engine/theme";
import { SANS } from "./engine/fonts";
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
export const CommentArrow: React.FC<{ t: number }> = ({ t }) => (t < 0 ? <Arrow t={t} at={0} out={0} d="" tip={[0, 0]} /> : null);

/* ---------------- 底部压暗：只在 B-roll 段（米白底上平台作者名/文案是白字）；人物全屏时不压暗 ---------------- */
export const BottomShade: React.FC<{ pip: number }> = ({ pip }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(16,40,33,0) 0px, rgba(16,40,33,0) 1480px, rgba(16,40,33,0.22) 1680px, rgba(16,40,33,0.5) 1920px)", opacity: pip }} />
);

/* ---------------- 人工湖实景标注（全屏段，人物不在画面里，镜头在拍湖）：
   59.0s 湖面出现时“人工湖”标签带箭头落下，63.5s 说“清理干净”时圈住水面左边漂着的落叶，标“落叶要清理” ---------------- */
export const LakeMark: React.FC<{ t: number }> = ({ t }) => {
  if (t < 58.9 || t > 65.8) return null;
  const { p, o } = io(t, 59.0, 65.3, 0.5, 0.35);
  const a = Math.min(1, p * 3) * (1 - E.inCubic(o));
  const k = E.outBack(p, 1.6);
  const bob = Math.sin((t - 59) * 4) * 8;
  const circ = E.outCubic(clamp((t - 63.55) / 0.55));
  const co = E.inCubic(clamp((t - 65.1) / 0.35));
  return (
    <>
      <div style={{ position: "absolute", left: 300, top: 880 + bob, opacity: a, transform: `scale(${k})`, transformOrigin: "50% 100%" }}>
        <div style={{ fontFamily: SANS, fontSize: 64, color: "#fff", background: C.red, borderRadius: 999, padding: "6px 30px 10px", boxShadow: "0 6px 0 rgba(0,0,0,0.18), 0 14px 26px rgba(40,20,10,0.35)", whiteSpace: "nowrap" }}>人工湖</div>
        <svg width={80} height={110} style={{ position: "absolute", left: 90, top: 100, overflow: "visible" }}>
          <path d="M30 0 V80 M8 58 L30 84 L52 58" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 0 V80 M8 58 L30 84 L52 58" fill="none" stroke={C.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {circ > 0 && (
        <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - co, overflow: "visible" }}>
          <ellipse cx={330} cy={1290} rx={290} ry={105} fill="none" stroke="#fff" strokeWidth={14} pathLength={1} strokeDasharray={`${circ} 1`} transform="rotate(-4 330 1290)" opacity={0.85} />
          <ellipse cx={330} cy={1290} rx={290} ry={105} fill="none" stroke={C.orange} strokeWidth={8} pathLength={1} strokeDasharray={`${circ} 1`} transform="rotate(-4 330 1290)" />
        </svg>
      )}
      {circ > 0 && (
        <div style={{ position: "absolute", left: 80, top: 1112, opacity: 1 - co, transform: `scale(${E.outBack(clamp((t - 63.9) / 0.35), 1.8)})`, transformOrigin: "0 100%" }}>
          <div style={{ fontFamily: SANS, fontSize: 44, color: "#fff", background: C.orange, borderRadius: 999, padding: "4px 26px 8px", boxShadow: "0 6px 0 rgba(0,0,0,0.16), 0 12px 22px rgba(40,20,10,0.35)", whiteSpace: "nowrap" }}>落叶要清理</div>
        </div>
      )}
    </>
  );
};
