// 开场 0–7.5s 的钩子（人物全屏，原片色彩；远景人物脸在 y≈850，道具全放在头顶上方的天空里，不压脸）：
// 标题纸条右边挂一张“小区体检单”，第 0 帧就在晃；2.4s 说“优点”时“优点”一栏打绿勾，4.8s 再说“优点”时贴一张“简单讲”；
// 7.0s 说“缺点”时红笔在“缺点”一栏狠狠画一个圈、红色“重点”章砸下，体检单被震歪，人物推近
import React from "react";
import { E, clamp, invLerp, lerp } from "./engine/ease";
import { C } from "./engine/theme";
import { SANS, SERIF } from "./engine/fonts";
import { TEASER } from "./project";

const BX = 690; // 体检单左上角
const BY = 196;
const BW = 290;
const BH = 330;

/** 全屏段的镜头冲击：说到关键词时人物画面快速推近一下（只缩放，不改颜色），hold 秒后缓回。
 *  [起点, 幅度, 保持秒数]；开场 0–0.55s 另有一个从 1.06 拉回 1 的开机推拉，第 0 帧起画面就在动 */
const PUNCH: [number, number, number][] = [
  [-5.25, 0.04, 1.2], // 钩子：楼王 2 号楼
  [-1.14, 0.06, 0.7], // 钩子：少个两度
  [0.05, 0.03, 0.5], // 闪白后开场
  [2.3, 0.035, 1.6], // 优点
  [6.98, 0.06, 0.45], // 缺点
  [34.62, 0.055, 0.9], // 缺点来了
  [53.62, 0.04, 1.3], // 个人意见
  [69.6, 0.045, 1.0], // 楼王 2 号楼
  [71.48, 0.04, 1.2], // 不太喜欢
];
export const punch = (t: number) => {
  // 开机推拉按新时间第 0 帧算（旧时间 -TEASER）
  const t0 = t + TEASER;
  let s = t0 < 0.55 ? 0.06 * (1 - E.outCubic(clamp(t0 / 0.55))) : 0;
  for (const [a, amp, hold] of PUNCH) {
    if (t < a) continue;
    const up = E.outCubic(clamp((t - a) / 0.16));
    const back = 1 - E.inOutCubic(clamp((t - a - hold) / 0.55));
    s += amp * up * back;
  }
  return 1 + s;
};

/** 手绘勾 */
const Tick: React.FC<{ k: number; x: number; y: number; s?: number; color?: string }> = ({ k, x, y, s = 1, color = C.green }) => (
  <svg width={70 * s} height={60 * s} viewBox="0 0 70 60" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <path d="M6 32 L26 52 L64 8" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
  </svg>
);

export const OpenHook: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0 || t > 7.75) return null;
  const out = E.inCubic(clamp((t - 7.25) / 0.35));
  // 第 0 帧起就挂着轻轻晃；7.0s 被红笔砸歪
  const hitD = t - 7.0;
  const swing = Math.sin(t * 2.6) * 3.2 + (hitD > 0 ? Math.sin(hitD * 26) * 9 * Math.exp(-hitD * 6) + 4 * E.outCubic(clamp(hitD / 0.2)) : 0);
  const tick1 = E.outCubic(clamp((t - 2.35) / 0.3));
  const note = E.outBack(clamp((t - 4.8) / 0.4), 2);
  const circ = E.inOutCubic(clamp((t - 6.95) / 0.28));
  const stamp = clamp((t - 7.08) / 0.16);
  const flash = hitD > 0 ? Math.exp(-hitD * 9) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-50 * out}px)`, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: BX, top: BY, width: BW, height: BH, transformOrigin: `${BW / 2}px -10px`, transform: `rotate(${swing}deg)` }}>
        {/* 板夹 */}
        <div style={{ position: "absolute", inset: 0, background: "#C99A62", borderRadius: 18, boxShadow: "0 18px 30px rgba(60,40,20,0.35)" }} />
        <div style={{ position: "absolute", left: 14, top: 22, right: 14, bottom: 14, background: C.card, borderRadius: 8 }} />
        <div style={{ position: "absolute", left: BW / 2 - 52, top: -14, width: 104, height: 40, background: "#8C949A", borderRadius: 10, boxShadow: "inset 0 -5px 0 rgba(0,0,0,0.2)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: SERIF, fontSize: 40, color: C.text }}>小区体检单</div>
        <div style={{ position: "absolute", left: 34, right: 34, top: 96, height: 2, background: "rgba(24,61,51,0.2)" }} />
        {/* 两栏 */}
        {[
          ["优点", 124, C.green],
          ["缺点", 214, C.red],
        ].map(([label, y, col]) => (
          <div key={label as string} style={{ position: "absolute", left: 34, top: y as number, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, border: `4px solid ${col}` }} />
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, color: C.text }}>{label}</div>
          </div>
        ))}
        <Tick k={tick1} x={30} y={108} />
        {/* “简单讲”小贴纸 */}
        {note > 0 && (
          <div style={{ position: "absolute", left: 160, top: 128, transform: `scale(${note}) rotate(-6deg)`, transformOrigin: "0 50%", fontFamily: SANS, fontWeight: 600, fontSize: 32, color: "#fff", background: C.green, borderRadius: 999, padding: "2px 16px 6px", whiteSpace: "nowrap", boxShadow: "0 5px 0 rgba(0,0,0,0.14)" }}>
            简单讲
          </div>
        )}
        {/* 红笔圈住“缺点” */}
        {circ > 0 && (
          <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d="M40 222 C 70 192, 230 190, 262 228 C 284 264, 160 290, 70 276 C 20 266, 18 236, 60 214" fill="none" stroke={C.red} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${circ} 1`} />
          </svg>
        )}
      </div>
      {/* “重点”章：从 2.3 倍砸下，落在体检单右下角 */}
      {stamp > 0 && (
        <div
          style={{
            position: "absolute",
            left: BX + 150,
            top: BY + 290,
            transform: `translate(-50%,-50%) rotate(-12deg) scale(${lerp(2.3, 1, E.outCubic(stamp))})`,
            opacity: Math.min(1, stamp * 3),
            border: `6px double ${C.red}`,
            borderRadius: 14,
            padding: "2px 20px 8px",
            color: C.red,
            fontFamily: SERIF,
            fontSize: 54,
            whiteSpace: "nowrap",
            background: "rgba(255,250,242,0.92)",
            boxShadow: "0 14px 30px rgba(96,70,36,0.3)",
          }}
        >
          重点
        </div>
      )}
      {flash > 0.02 && (
        <svg width={1080} height={700} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            const cx = BX + 150;
            const cy = BY + 290;
            const r0 = 90 + (1 - flash) * 60;
            return <path key={i} d={`M${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L${cx + Math.cos(a) * (r0 + 40)} ${cy + Math.sin(a) * (r0 + 40)}`} stroke={C.red} strokeWidth={7} strokeLinecap="round" opacity={flash} />;
          })}
        </svg>
      )}
    </div>
  );
};

/** 兼容旧引用 */
export const heartBeat = (_t: number) => 0;
export const _unused = invLerp;
