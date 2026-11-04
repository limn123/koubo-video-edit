// 开场 0–6.5s 的钩子（人物全屏，原片色彩，所有元素只放在脸两侧的空白处，不压脸）：
// 全部放在标题纸条右边那一列（头顶上方，不压脸）：“挂牌价”价签第 0 帧就挂着晃，3.15s 说“买家”时被猛甩一下；
// 4.1s 说“砍”时一把菜刀从右边劈下，价签被剁掉下半截飞出去；4.6s 说“心慌”时，剁口下面跳出一颗随心跳扑通的心；6.2s 前全部收走
import React from "react";
import { E, clamp, lerp } from "./engine/ease";
import { C } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";
import { Cleaver } from "./parts4";

const TAG_X = 915; // 价签左上角
const TAG_Y = 215;
const CUT_Y = 118; // 剁口在价签上的高度（价签内部坐标）
const TW = 140;
const TH = 250;

/** 全屏段的镜头冲击：说到关键词时人物画面快速推近一下（只缩放，不改颜色），hold 秒后缓回。
 *  [起点, 幅度, 保持秒数]；开场 0–0.5s 另有一个从 1.06 拉回 1 的开机推拉，第 0 帧起画面就在动 */
const PUNCH: [number, number, number][] = [
  [2.55, 0.045, 3.35], // 大实话
  [4.1, 0.06, 1.8], // 砍
  [28.8, 0.05, 1.2], // 看什么
  [114.9, 0.05, 0.5], // 一个毛病
  [130.74, 0.05, 1.3], // 都有人疼
  [147.66, 0.045, 1.4], // 两回
  [150.72, 0.05, 0.9], // 2019
  [153.55, 0.035, 0.5], // 真实成交价
  [161.66, 0.045, 1.5], // 评论区
  [163.3, 0.04, 2.0], // 这一刀该不该接
];
export const punch = (t: number) => {
  let s = t < 0.55 ? 0.06 * (1 - E.outCubic(clamp(t / 0.55))) : 0;
  for (const [a, amp, hold] of PUNCH) {
    if (t < a) continue;
    const up = E.outCubic(clamp((t - a) / 0.16));
    const back = 1 - E.inOutCubic(clamp((t - a - hold) / 0.55));
    s += amp * up * back;
  }
  return 1 + s;
};

/** 心跳缩放（标题里“心慌”两个字跟着跳） */
export const heartBeat = (t: number) =>
  [4.62, 4.98, 5.3].reduce((s, b) => {
    const d = t - b;
    return s + (d > 0 && d < 0.3 ? Math.sin((d / 0.3) * Math.PI) * 0.18 : 0);
  }, 0);

export const OpenHook: React.FC<{ t: number }> = ({ t }) => {
  if (t > 6.5) return null;
  const out = E.inCubic(clamp((t - 6.0) / 0.35));

  /* 价签：甩进来 + 阻尼摆动 */
  // 价签第 0 帧就挂在封面上并晃着（开场画面就在动），说到“买家”时再被猛甩一下
  const drop = 1;
  const swing = Math.sin(t * 6) * 9 * Math.exp(-t * 0.9) + (t > 3.1 ? Math.sin((t - 3.1) * 7) * 16 * Math.exp(-(t - 3.1) * 1.8) : 0);
  /* 菜刀 */
  const raise = E.outCubic(clamp((t - 3.75) / 0.25));
  const slam = E.inCubic(clamp((t - 4.0) / 0.12));
  const hit = t >= 4.12;
  const knifeAng = lerp(-55 * raise, 0, slam);
  const knifeAway = E.inCubic(clamp((t - 4.75) / 0.35));
  const fall = clamp((t - 4.12) / 0.8);
  const flash = hit ? Math.exp(-(t - 4.12) * 9) : 0;
  /* 心跳 */
  const beats = [4.62, 4.98, 5.3];
  const beat = beats.reduce((s, b) => {
    const d = t - b;
    return s + (d > 0 && d < 0.3 ? Math.sin((d / 0.3) * Math.PI) * 0.22 : 0);
  }, 0);
  const heartIn = E.outBack(clamp((t - 4.5) / 0.35), 2);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, pointerEvents: "none" }}>
      {/* —— 价签 —— */}
      {t >= 0 && (
        <div style={{ position: "absolute", left: TAG_X, top: TAG_Y - (1 - drop) * 700, width: TW, height: TH, transformOrigin: "70px -40px", transform: `rotate(${hit ? swing * 0.4 : swing}deg)` }}>
          {/* 吊绳 */}
          <svg width={TW} height={60} style={{ position: "absolute", left: 0, top: -40, overflow: "visible" }}>
            <path d="M70 0 L70 40" stroke="#5B3A22" strokeWidth={4} />
          </svg>
          {/* 上半截（留在绳上） */}
          <div style={{ position: "absolute", left: 0, top: 0, width: TW, height: hit ? CUT_Y : TH, background: C.orange, borderRadius: hit ? "20px 20px 0 0" : 20, boxShadow: "0 14px 24px rgba(80,40,10,0.3)", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 58, top: 14, width: 24, height: 24, borderRadius: 12, background: C.card }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", fontFamily: SERIF, fontSize: 38, color: "#fff" }}>挂牌价</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center", fontFamily: NUM, fontWeight: 800, fontSize: 48, color: "#fff" }}>¥ ???</div>
          </div>
          {/* 被剁下的下半截 */}
          {hit && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: CUT_Y,
                width: TW,
                height: TH - CUT_Y,
                background: C.red,
                borderRadius: "0 0 20px 20px",
                transform: `translate(${fall * 160}px, ${E.inCubic(fall) * 300}px) rotate(${fall * 50}deg)`,
                opacity: 1 - clamp((fall - 0.7) / 0.3),
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: NUM, fontWeight: 800, fontSize: 48, color: "#fff" }}>¥ ???</div>
            </div>
          )}
        </div>
      )}
      {/* 剁口白光 */}
      {flash > 0.02 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M${TAG_X - 60} ${TAG_Y + CUT_Y} H${TAG_X + 200}`} stroke="#fff" strokeWidth={18 * flash} strokeLinecap="round" />
          {[-50, -20, 20, 50].map((a, i) => (
            <path
              key={i}
              d={`M${TAG_X + 70 + Math.cos((a * Math.PI) / 180) * 120} ${TAG_Y + CUT_Y + Math.sin((a * Math.PI) / 180) * 120} L${TAG_X + 70 + Math.cos((a * Math.PI) / 180) * (120 + 90 * (1 - flash))} ${TAG_Y + CUT_Y + Math.sin((a * Math.PI) / 180) * (120 + 90 * (1 - flash))}`}
              stroke={C.orange}
              strokeWidth={6}
              strokeLinecap="round"
              opacity={flash}
              transform={`rotate(${i < 2 ? 180 : 0} ${TAG_X + 70} ${TAG_Y + CUT_Y})`}
            />
          ))}
        </svg>
      )}
      {/* 菜刀：从右上举起 → 劈下 → 抽走 */}
      {t > 3.72 && (
        <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - knifeAway, transform: `translate(${knifeAway * 300}px, ${-knifeAway * 200}px)` }}>
          <Cleaver x={TAG_X - 86} y={TAG_Y + CUT_Y - 141 - (1 - slam) * 40 * raise} ang={knifeAng} s={0.9} />
        </div>
      )}
      {/* —— 心慌：剁口下面跳出一颗心 —— */}
      {t > 4.45 && (
        <div style={{ position: "absolute", left: TAG_X + 4, top: TAG_Y + CUT_Y + 26, transform: `scale(${heartIn * (1 + beat)})`, transformOrigin: "66px 60px" }}>
          <svg width={132} height={120} viewBox="0 0 48 44">
            <path d="M24 42 C10 32 2 24 2 14 C2 7 7 2 13 2 C18 2 22 5 24 9 C26 5 30 2 35 2 C41 2 46 7 46 14 C46 24 38 32 24 42 Z" fill={C.red} stroke="#fff" strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", left: 18, right: 18, top: 116, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#fff", background: C.red, borderRadius: 999, padding: "1px 0 5px", boxShadow: "0 6px 14px rgba(120,30,20,0.3)" }}>心慌</div>
        </div>
      )}
    </div>
  );
};
