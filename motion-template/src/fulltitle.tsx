// 人物全屏段的版式：不加任何压暗 / 渐变 / 滤镜，人物保持原片色彩。
// 标题做成米白纸条（墨绿字 + 关键词彩色斜切色块），贴在头顶车顶区域（y 185–540），逐行从遮罩里推上来，出场向上收走。
// 头顶空出的那一条（人物下移 fullDY 露出的部分）就是米白纸面本身，和 B-roll 段同一张纸。
import React from "react";
import { AbsoluteFill } from "remotion";
import { E, clamp, invLerp, lerp } from "./engine/ease";
import { C, W } from "./engine/theme";
import { SANS, SERIF } from "./engine/fonts";
import { fullDY } from "./project";
import { heartBeat } from "./hook";

export type FullTitleSpec = {
  at: number;
  out: number;
  kicker?: string;
  text: string; // 用 \n 分行
  hl?: string | string[]; // 关键词色块（可多个，每行取包含的那个）
  lineAt?: number[]; // 第 2 行起（或全部行）单独出现的时间：长度=行数时逐行对应，长度=行数-1 时从第 2 行开始
  size?: number;
  color?: string; // 关键词色块颜色
  chips?: [string, string][]; // 标题下方的小标签 [文字, 颜色]
  chipsAt?: number;
  chipTimes?: number[]; // 每个小标签单独出现的时间（跟口播逐个点名）
};

const X = 60;
const Y = 192;

/** 一行纸条：米白底、轻微倾斜，从下往上推出来；关键词垫一块斜切色块（从左往右擦出来），字变白 */
const Strip: React.FC<{ t: number; at: number; text: string; hl?: string; size: number; color: string; tilt: number }> = ({ t, at, text, hl, size, color, tilt }) => {
  const k = E.outQuart(clamp(invLerp(at, at + 0.45, t)));
  const paper = E.outExpo(clamp(invLerp(at - 0.05, at + 0.4, t)));
  const wipe = E.outExpo(clamp(invLerp(at + 0.2, at + 0.65, t)));
  const i = hl ? text.indexOf(hl) : -1;
  const parts = i >= 0 ? [text.slice(0, i), text.slice(i, i + hl!.length), text.slice(i + hl!.length)] : [text, "", ""];
  return (
    <div style={{ display: "flex", marginBottom: 12 }}>
      <div
        style={{
          position: "relative",
          transform: `rotate(${tilt}deg)`,
          transformOrigin: "0% 50%",
          clipPath: `inset(0 ${(1 - paper) * 100}% 0 0 round 10px)`,
          opacity: paper > 0.001 ? 1 : 0,
        }}
      >
        <div
          style={{
            background: C.card,
            borderRadius: 10,
            padding: `${size * 0.06}px ${size * 0.2}px ${size * 0.1}px`,
            boxShadow: "0 6px 0 rgba(205,191,168,0.95), 0 16px 30px rgba(40,30,15,0.28)",
            overflow: "hidden",
          }}
        >
          <div style={{ transform: `translateY(${(1 - k) * 110}%)`, whiteSpace: "nowrap", lineHeight: 1.12, fontFamily: SERIF, fontSize: size, color: C.text, letterSpacing: 1 }}>
            <span>{parts[0]}</span>
            {parts[1] && (
              <span style={{ position: "relative", display: "inline-block", padding: "0 0.08em", margin: "0 0.02em" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "10%",
                    bottom: "4%",
                    width: `${wipe * 100}%`,
                    background: color,
                    transform: "skewX(-10deg)",
                    borderRadius: 6,
                  }}
                />
                <span style={{ position: "relative", color: wipe > 0.45 ? "#fff" : C.text }}>{parts[1]}</span>
              </span>
            )}
            <span>{parts[2]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 小标签（kicker）：彩色胶带条 */
const Kicker: React.FC<{ t: number; at: number; text: string; color: string }> = ({ t, at, text, color }) => {
  const k = E.outExpo(clamp(invLerp(at, at + 0.45, t)));
  return (
    <div style={{ display: "flex", marginBottom: 14 }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 34,
          color: "#fff",
          background: color,
          padding: "6px 20px 8px",
          borderRadius: 8,
          letterSpacing: 2,
          whiteSpace: "nowrap",
          transform: `translateX(${(1 - k) * -40}px) rotate(-1.5deg)`,
          opacity: k,
          boxShadow: "0 6px 16px rgba(40,30,15,0.25)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const FullTitle: React.FC<{ t: number; s: FullTitleSpec }> = ({ t, s }) => {
  if (t < s.at - 0.06 || t > s.out + 0.4) return null;
  const o = E.inCubic(clamp(invLerp(s.out, s.out + 0.32, t)));
  const lines = s.text.split("\n");
  const size = s.size ?? 92;
  const color = s.color ?? C.orange;
  const hls = s.hl === undefined ? [] : Array.isArray(s.hl) ? s.hl : [s.hl];
  const lineAt = (i: number) => {
    if (!s.lineAt) return s.at + 0.1 + i * 0.12;
    if (s.lineAt.length === lines.length) return s.lineAt[i];
    return i === 0 ? s.at + 0.1 : s.lineAt[i - 1];
  };
  return (
    <div style={{ position: "absolute", left: X, top: Y, width: W - X * 2, opacity: 1 - o, transform: `translateY(${-50 * o}px)` }}>
      {s.kicker && <Kicker t={t} at={s.at} text={s.kicker} color={color === C.orange ? C.deep : color} />}
      {lines.map((l, i) => (
        <Strip key={i} t={t} at={lineAt(i)} text={l} hl={hls.find((h) => l.includes(h))} size={size} color={color} tilt={i % 2 === 0 ? -1.2 : 0.8} />
      ))}
      {s.chips && (
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          {s.chips.map(([c, col], i) => {
            const a0 = s.chipTimes?.[i] ?? (s.chipsAt ?? s.at + 0.5) + i * 0.14;
            const k = E.outBack(clamp(invLerp(a0, a0 + 0.38, t)), 1.8);
            return (
              <div
                key={c}
                style={{
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 36,
                  color: "#fff",
                  background: col,
                  padding: "8px 24px 10px",
                  borderRadius: 999,
                  opacity: clamp(k * 2),
                  transform: `translateY(${(1 - k) * 30}px) scale(${lerp(0.5, 1, k)})`,
                  boxShadow: "0 6px 0 rgba(0,0,0,0.16), 0 12px 24px rgba(40,30,15,0.28)",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** 全屏段的框：只有顶部两个橙色裁切角标 + 人物下移露出的米白纸边上一条发丝线；full=人物全屏程度 0..1 */
export const FullFrame: React.FC<{ t: number; full: number }> = ({ t, full }) => {
  if (full < 0.01) return null;
  const m = 46;
  const L = 34;
  const dy = fullDY(t);
  return (
    <AbsoluteFill style={{ opacity: full, pointerEvents: "none" }}>
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g stroke={C.orange} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d={`M${m} ${178 + L} V178 H${m + L}`} />
          <path d={`M${W - m} ${178 + L} V178 H${W - m - L}`} />
        </g>
      </svg>
      {dy > 0 && <div style={{ position: "absolute", left: 0, top: dy * full - 2, width: W, height: 2, background: "rgba(24,61,51,0.18)" }} />}
    </AbsoluteFill>
  );
};

/** 首帧封面：第 0 帧即完整显示（可直接当封面）；说到“这一刀”时一道刀光斜劈过纸条，6.3s 向上收走，人物缩进圆环 */
export const Cover: React.FC<{ t: number }> = ({ t }) => {
  if (t > 6.8) return null;
  const o = E.inCubic(clamp(invLerp(6.25, 6.6, t)));
  const hl = E.outExpo(clamp(invLerp(-0.2, 0.45, t)));
  // 说到“买家把价砍到你心慌”“这一刀该不该接”时两行各弹一下
  const bump = (a: number) => {
    const d = t - a;
    return d > 0 && d < 0.5 ? 1 + Math.sin(d * 14) * 0.06 * Math.exp(-d * 6) : 1;
  };
  // 菜刀落下时纸条跟着震一下
  const shk = (a: number, ph: number) => {
    const d = t - a;
    return d > 0 && d < 0.35 ? Math.sin(d * 70 + ph) * 9 * Math.exp(-d * 10) : 0;
  };
  // 刀光：5.45s 从右上斜劈到左下，留下一道细红口子
  const cut = clamp((t - 5.45) / 0.22);
  const glow = cut > 0 ? Math.exp(-(t - 5.67) * 5) : 0;
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
          fontSize: 84,
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
  return (
    <div style={{ position: "absolute", left: X, top: Y, width: W - X * 2, opacity: 1 - o, transform: `translateY(${-60 * o}px) translate(${shk(4.12, 1)}px, ${shk(4.12, 2)}px)` }}>
      <div style={{ display: "flex", marginBottom: 14 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#fff", background: C.deep, padding: "6px 20px 8px", borderRadius: 8, letterSpacing: 2, transform: "rotate(-1.5deg)", boxShadow: "0 6px 16px rgba(40,30,15,0.25)" }}>
          想卖房的房东看过来
        </div>
      </div>
      {strip(
        <>
          买家把价砍到你
          <span style={{ display: "inline-block", color: t > 4.58 ? C.red : C.text, transform: `scale(${1 + heartBeat(t)})` }}>心慌</span>
        </>,
        -1.2,
        bump(3.2),
      )}
      {strip(
        <>
          这一刀
          <span style={{ position: "relative", display: "inline-block", padding: "0 0.08em", marginLeft: 10 }}>
            <span style={{ position: "absolute", left: 0, top: "10%", bottom: "4%", width: `${hl * 100}%`, background: C.red, transform: "skewX(-10deg)", borderRadius: 6 }} />
            <span style={{ position: "relative", color: "#fff" }}>该不该接？</span>
          </span>
        </>,
        0.8,
        bump(5.42),
      )}
      {cut > 0 && (
        <svg width={W} height={420} style={{ position: "absolute", left: -X, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <path d="M1000 40 L80 400" stroke="#fff" strokeWidth={14 * glow + 2} strokeLinecap="round" pathLength={1} strokeDasharray={`${cut} 1`} opacity={0.9 * glow + 0.1 * (1 - glow)} />
          <path d="M1000 40 L80 400" stroke={C.red} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={`${cut} 1`} opacity={0.85} />
        </svg>
      )}
    </div>
  );
};
