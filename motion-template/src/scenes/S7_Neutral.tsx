// 154.26–157.86 差价我一分不挣，不劝你接，也不劝你不接
// （圆形展开）一枚“差价”硬币被划成 0 → 天平两头“接 / 不接”，各盖一个“不劝”，横梁始终放平，支柱上写“只看真实成交”
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Stamp, Title } from "../kit";
import { Block } from "../parts2";
import { PAPER, Pill, bump, kIn, kPop } from "../parts4";

export const S7_Neutral: React.FC<{ t: number }> = ({ t }) => {
  if (t < 154.1 || t > 158.5) return null;
  // 横梁：轻轻晃两下后停平
  const wob = Math.sin((t - 155.0) * 5) * 6 * Math.exp(-Math.max(0, t - 155.0) * 1.4) * (t > 155 ? 1 : 0);
  const strike = E.outCubic(clamp((t - 155.15) / 0.3));
  return (
    <>
      <Title t={t} items={[[154.4, 157.75, "差价我一分不挣", "不劝你接\n也不劝你不接", C.green]]} />
      <Block t={t} at={154.3} out={157.8} enter="iris" exit="fade" ox={880} oy={360} cam={[[154.3, 1.04, 540, 880], [157.8, 1, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 580, width: 880, height: 580, ...PAPER }} />
        {/* 差价硬币 */}
        <div style={{ position: "absolute", left: 130, top: 620, display: "flex", alignItems: "center", gap: 16, transform: `scale(${kPop(t, 154.4, 0.45, 1.8)})`, transformOrigin: "0% 50%" }}>
          <div style={{ position: "relative", width: 110, height: 110, borderRadius: 55, background: "radial-gradient(circle at 35% 30%, #FFE9A8, #F2C14E)", border: "5px solid #D9A93E", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NUM, fontWeight: 800, fontSize: 52, color: "#B8862B" }}>
            ¥
            <div style={{ position: "absolute", left: -10, top: 50, width: 130 * strike, height: 8, background: C.red, borderRadius: 4, transform: "rotate(-35deg)", transformOrigin: "0% 50%" }} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 50, color: C.text, whiteSpace: "nowrap" }}>
            差价 <span style={{ fontFamily: NUM, fontWeight: 800, color: C.red, display: "inline-block", transform: `scale(${bump(t, 155.4, 0.12)})` }}>0</span> 元
          </span>
        </div>
        {/* 天平 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 155.0, 0.35) }}>
          <path d="M540 820 V1060" stroke={C.text} strokeWidth={14} strokeLinecap="round" />
          <path d="M440 1070 H640" stroke={C.text} strokeWidth={16} strokeLinecap="round" />
          <circle cx={540} cy={812} r={18} fill={C.orange} />
          <g transform={`rotate(${wob} 540 820)`}>
            <path d="M230 820 H850" stroke={C.text} strokeWidth={10} strokeLinecap="round" />
            {[
              [270, "接", C.green],
              [810, "不接", C.red],
            ].map(([x, label, col]) => (
              <g key={label as string} transform={`rotate(${-wob} ${x as number} 820)`}>
                <path d={`M${x as number} 820 L${(x as number) - 90} 950 M${x as number} 820 L${(x as number) + 90} 950`} stroke="#8A9590" strokeWidth={3} />
                <path d={`M${(x as number) - 120} 950 H${(x as number) + 120} Q ${x as number} 1010 ${(x as number) - 120} 950 Z`} fill={col as string} opacity={0.9} />
                <text x={x as number} y={935} textAnchor="middle" fontFamily={SERIF} fontSize={56} fill={col as string}>
                  {label as string}
                </text>
              </g>
            ))}
          </g>
        </svg>
        <Stamp t={t} at={155.9} x={270} y={1050} color={C.green} size={44} rot={-10}>
          不劝
        </Stamp>
        <Stamp t={t} at={156.85} x={810} y={1050} color={C.red} size={44} rot={8}>
          不劝
        </Stamp>
        <div style={{ position: "absolute", left: 540, top: 1094, transform: `translateX(-50%) scale(${lerp(0.6, 1, kIn(t, 157.2, 0.3))})`, opacity: kIn(t, 157.2, 0.3) }}>
          <Pill color={C.deep} size={30}>只看真实成交</Pill>
        </div>
      </Block>
    </>
  );
};
