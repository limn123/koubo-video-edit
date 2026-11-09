// 73.15–96.23 缺点③：楼王 2 号楼
// （圆形展开）房子剖面：太阳绕一大圈“光照时间长”，屋里小人打哆嗦 →（横推）钥匙 + 门上挂“工作室”牌子，五格月份亮起“四五个月” →
// （上推）两支温度计，2 号楼往下掉，“-2℃”砸下 →（甩镜横推）俯视图：平面窗高亮、外凸窗打叉 →（斜擦）冬天低角度阳光只照进窗边一小条，客厅留在阴影里
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Stamp, Title } from "../kit";
import { Block, Kinetic } from "../parts2";
import { Fig, PAPER, Pill, bump, kIn, kPop } from "../parts4";

const Sun: React.FC<{ x: number; y: number; r?: number; spin: number; dim?: number }> = ({ x, y, r = 46, spin, dim = 0 }) => (
  <svg width={r * 4} height={r * 4} style={{ position: "absolute", left: x - r * 2, top: y - r * 2, overflow: "visible" }}>
    <g transform={`translate(${r * 2} ${r * 2}) rotate(${spin})`}>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <path key={i} d={`M${Math.cos(a) * r * 1.3} ${Math.sin(a) * r * 1.3} L${Math.cos(a) * r * 1.75} ${Math.sin(a) * r * 1.75}`} stroke="#F2B33D" strokeWidth={7} strokeLinecap="round" />;
      })}
      <circle r={r} fill={dim ? "#F5CF7A" : "#F6C343"} stroke="#E39A26" strokeWidth={4} />
    </g>
  </svg>
);

/** 温度计：level 0..1 */
const Thermo: React.FC<{ x: number; level: number; color: string; label: string; hl?: boolean }> = ({ x, level, color, label, hl }) => {
  const top = 640;
  const tube = 470;
  return (
    <div style={{ position: "absolute", left: x - 75, top, width: 150, height: tube + 150 }}>
      <div style={{ position: "absolute", left: 35, top: 0, width: 80, height: tube + 20, borderRadius: 40, background: "#fff", border: "6px solid #5E6B6F" }} />
      <div style={{ position: "absolute", left: 55, top: 20 + tube * (1 - level), width: 40, height: tube * level + 20, borderRadius: 20, background: color }} />
      <div style={{ position: "absolute", left: 10, top: tube - 20, width: 130, height: 130, borderRadius: "50%", background: color, border: "6px solid #5E6B6F" }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 120, top: 40 + i * 52, width: i % 2 ? 16 : 28, height: 5, background: "#5E6B6F" }} />
      ))}
      <div style={{ position: "absolute", left: -60, width: 270, top: tube + 120, textAlign: "center" }}>
        <Pill color={hl ? C.red : C.deep} size={44}>{label}</Pill>
      </div>
    </div>
  );
};

const Flake: React.FC<{ x: number; y: number; s: number; a: number; o: number }> = ({ x, y, s, a, o }) => (
  <svg width={60 * s} height={60 * s} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x, top: y, opacity: o, transform: `rotate(${a}deg)` }}>
    {[0, 60, 120].map((r) => (
      <path key={r} d="M0 -24 V24 M-8 -16 L0 -10 L8 -16 M-8 16 L0 10 L8 16" stroke="#6FA8C9" strokeWidth={4} strokeLinecap="round" fill="none" transform={`rotate(${r})`} />
    ))}
  </svg>
);

export const S3_Cold: React.FC<{ t: number }> = ({ t }) => {
  if (t < 73.1) return null;
  /* F1 太阳绕圈 */
  const arc = E.inOutCubic(clamp((t - 73.5) / 1.9));
  const sunA = lerp(Math.PI * 1.02, Math.PI * 1.98, arc);
  const sunX = 540 + Math.cos(sunA) * 290;
  const sunY = 960 + Math.sin(sunA) * 360;
  const cold = clamp((t - 75.6) / 0.6);
  const shiver = t > 76.4 ? Math.sin(t * 60) * 4 : 0;
  /* F2 门牌 */
  const sign = t - 81.05;
  const signSwing = sign > 0 ? Math.sin(sign * 6) * 22 * Math.exp(-sign * 1.6) : 0;
  const signDrop = E.outBack(clamp(sign / 0.4), 1.3);
  /* F3 温度计 */
  const rise = E.outCubic(clamp((t - 84.0) / 1.2));
  const drop = E.outBack(clamp((t - 86.5) / 0.5), 1.4);
  /* F5 冬日光束 */
  const beam = E.outCubic(clamp((t - 91.3) / 0.6));
  const push = E.inOutCubic(clamp((t - 94.2) / 0.7));
  return (
    <>
      <Title
        t={t}
        items={[
          [73.3, 78.35, "缺点 ③", "外面光照长\n屋里却不暖", C.red],
          [78.45, 83.55, "亲身住过", "我们在里面\n待了四五个月", C.deep],
          [83.66, 87.15, "整个屋子", "比别的楼\n低两度", C.red],
          [87.22, 90.98, "为什么", "窗子全是平的\n不是外凸的", C.orange],
          [91.1, 99, "冬天", "阳光照不进\n客厅", C.red],
        ]}
      />

      {/* F1 房子剖面 + 太阳绕一大圈 */}
      <Block t={t} at={73.25} out={78.4} enter="iris" exit="slideL" ox={880} oy={360} cam={[[73.25, 1, 540, 960], [75.4, 1, 540, 960], [77.0, 1.08, 540, 1050], [78.4, 1.08, 540, 1050]]}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d="M250 960 A290 360 0 0 1 830 960" fill="none" stroke="#E39A26" strokeWidth={4} strokeDasharray="10 14" opacity={kIn(t, 73.4, 0.4)} />
        </svg>
        {t > 73.45 && <Sun x={sunX} y={sunY} spin={t * 40} />}
        <div style={{ position: "absolute", left: 90, top: 630, opacity: kIn(t, 74.4, 0.3), transform: `scale(${kPop(t, 74.4)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.orange} size={46}>外面光照时间很长</Pill>
        </div>
        {/* 房子剖面 */}
        <div style={{ position: "absolute", left: 290, top: 860, width: 500, height: 340 }}>
          <svg width={500} height={340} viewBox="0 0 500 340" style={{ position: "absolute", left: 0, top: -120, overflow: "visible" }}>
            <path d="M20 140 L250 20 L480 140" fill="none" stroke="#5E6B6F" strokeWidth={10} strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", left: 40, top: 20, width: 420, height: 320, background: `rgba(${lerp(255, 207, cold)},${lerp(250, 226, cold)},${lerp(240, 238, cold)},1)`, border: "8px solid #5E6B6F", borderBottom: "none" }} />
          <div style={{ position: "absolute", left: 180, top: 85, transform: `translateX(${shiver}px)`, opacity: kIn(t, 75.9, 0.3) }}>
            <Fig s={1.55} c={C.deep} mood={t > 76.4 ? "sad" : "flat"} />
          </div>
        </div>
        {cold > 0 && [0, 1, 2, 3].map((i) => <Flake key={i} x={360 + i * 95} y={930 + ((t * 40 + i * 50) % 160)} s={0.8} a={t * 60 + i * 40} o={cold * 0.85} />)}
        <div style={{ position: "absolute", left: 300, top: 1212, opacity: kIn(t, 77.6, 0.3), transform: `scale(${kPop(t, 77.6)})`, transformOrigin: "50% 50%" }}>
          <Pill color={C.deep} size={44}>屋里待一待就知道</Pill>
        </div>
      </Block>

      {/* F2 工作室门牌 + 四五个月 */}
      <Block t={t} at={78.4} out={83.58} enter="slideL" exit="up" ox={540} oy={900} cam={[[78.4, 1.04, 400, 880], [81.8, 1.04, 400, 880], [82.4, 1, 540, 920], [83.5, 1.02, 540, 1000]]}>
        {/* 门 */}
        <div style={{ position: "absolute", left: 150, top: 600, width: 300, height: 470, borderRadius: "16px 16px 0 0", background: "#B98A5A", border: "8px solid #6B4E32", boxShadow: "0 16px 30px rgba(60,40,20,0.25)", opacity: kIn(t, 78.6, 0.35) }}>
          <div style={{ position: "absolute", left: 30, top: 30, right: 30, height: 160, border: "4px solid rgba(80,50,20,0.3)", borderRadius: 8 }} />
          <div style={{ position: "absolute", left: 30, top: 230, right: 30, height: 200, border: "4px solid rgba(80,50,20,0.3)", borderRadius: 8 }} />
          <div style={{ position: "absolute", right: 26, top: 240, width: 26, height: 26, borderRadius: "50%", background: "#F2C14E" }} />
        </div>
        {/* 钥匙 + “我们有一套房子” */}
        <div style={{ position: "absolute", left: 500, top: 640, opacity: kIn(t, 79.6, 0.35), transform: `scale(${kPop(t, 79.6)}) rotate(${(1 - kIn(t, 79.6, 0.5)) * -40}deg)`, transformOrigin: "0 50%" }}>
          <svg width={180} height={80} viewBox="0 0 90 40">
            <circle cx={20} cy={20} r={15} fill="none" stroke="#E39A26" strokeWidth={7} />
            <path d="M35 20 H86 M70 20 V32 M80 20 V30" stroke="#E39A26" strokeWidth={7} strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 500, top: 740, opacity: kIn(t, 79.9, 0.3), transform: `scale(${kPop(t, 79.9)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.deep} size={46}>我们有一套房子</Pill>
        </div>
        {/* 门牌“工作室”从上面挂下来晃 */}
        {sign > 0 && (
          <div style={{ position: "absolute", left: 175, top: 560 + (1 - signDrop) * -300, width: 250, transformOrigin: "125px -30px", transform: `rotate(${signSwing}deg)` }}>
            <svg width={250} height={40} style={{ position: "absolute", left: 0, top: -40 }}>
              <path d="M70 40 L125 2 L180 40" fill="none" stroke="#6B4E32" strokeWidth={4} />
            </svg>
            <div style={{ ...PAPER, borderRadius: 12, padding: "10px 0 16px", textAlign: "center", fontFamily: SERIF, fontSize: 64, color: C.text, border: `5px solid ${C.orange}` }}>工作室</div>
          </div>
        )}
        {/* 五格月份：亮到第 4 格，第 5 格半亮 */}
        <div style={{ position: "absolute", left: 70, top: 1110, display: "flex", gap: 14, opacity: kIn(t, 82.3, 0.3) }}>
          {[1, 2, 3, 4, 5].map((m, i) => {
            const lit = clamp((t - (82.45 + i * 0.2)) / 0.2) * (m === 5 ? 0.5 : 1);
            return (
              <div key={m} style={{ position: "relative", width: 142, height: 132, borderRadius: 16, border: `4px ${m === 5 ? "dashed" : "solid"} ${C.orange}`, background: C.card, overflow: "hidden", transform: `scale(${bump(t, 82.45 + i * 0.2, 0.1)})` }}>
                <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: `${lit * 100}%`, background: "rgba(224,122,53,0.35)" }} />
                <div style={{ position: "relative", textAlign: "center", fontFamily: NUM, fontSize: 64, color: C.text, marginTop: 12 }}>{m}</div>
                <div style={{ position: "absolute", bottom: 4, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 30, color: C.sub }}>月</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 600, top: 920, opacity: kIn(t, 83.0, 0.25), transform: `scale(${kPop(t, 83.0, 0.4, 2)})`, transformOrigin: "0 50%", fontFamily: NUM, fontSize: 110, color: C.orange, whiteSpace: "nowrap" }}>
          4–5<span style={{ fontFamily: SANS, fontSize: 50, color: C.text, marginLeft: 8 }}>个月</span>
        </div>
      </Block>

      {/* F3 两支温度计 */}
      <Block t={t} at={83.6} out={87.15} enter="up" exit="slideL" ox={540} oy={900} cam={[[83.6, 1, 540, 920], [86.4, 1, 540, 920], [87.1, 1.05, 760, 980]]}>
        <Thermo x={180} level={lerp(0.15, 0.7, rise)} color={C.orange} label="其他楼" />
        <Thermo x={840} level={lerp(0.15, 0.7, rise) - 0.24 * drop} color={drop > 0.3 ? "#5DA0C8" : C.orange} label="2 号楼" hl />
        {drop > 0 && [0, 1, 2].map((i) => <Flake key={i} x={880 + (i - 1) * 60} y={640 + ((t * 50 + i * 70) % 260)} s={0.9} a={t * 70 + i * 50} o={clamp(drop) * 0.9} />)}
        <Kinetic t={t} at={86.94} x={510} y={860} text="-2℃" kind="slam" size={104} accent="#4E8DB5" rot={-4} sub="整个屋子都冷" />
      </Block>

      {/* F4 俯视图：平面窗 vs 外凸窗 */}
      <Block t={t} at={87.2} out={91.0} enter="slideL" exit="wipe" ox={540} oy={900} cam={[[87.2, 1, 540, 900], [89.6, 1.04, 700, 900], [90.4, 1.04, 330, 900], [91.0, 1, 540, 900]]}>
        {/* 右：2 号楼 平面窗 */}
        <div style={{ position: "absolute", left: 518, top: 610, width: 380, opacity: kIn(t, 88.4, 0.35), transformOrigin: "0 0", transform: `translateY(${(1 - kIn(t, 88.4, 0.5)) * 60}px) scale(1.18)` }}>
          <div style={{ fontFamily: SANS, fontSize: 34, color: C.sub, marginBottom: 12 }}>2 号楼（俯视示意）</div>
          <svg width={380} height={380} viewBox="0 0 380 380">
            <rect x={20} y={80} width={340} height={280} fill={C.card} stroke="#5E6B6F" strokeWidth={10} />
            <rect x={90} y={70} width={200} height={20} fill={t > 89.24 ? C.red : "#9FC9DD"} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${120 + i * 70} 10 L${120 + i * 70} 70`} stroke="#F2B33D" strokeWidth={6} strokeLinecap="round" opacity={kIn(t, 88.9 + i * 0.1, 0.3)} />
            ))}
            <text x={190} y={240} textAnchor="middle" fontFamily={SERIF} fontSize={48} fill={C.text}>平面窗</text>
          </svg>
          {t > 89.24 && (
            <div style={{ position: "absolute", left: 90, top: 440, transform: `scale(${kPop(t, 89.24)})`, transformOrigin: "50% 50%" }}>
              <Pill color={C.red} size={42}>光只从正面进</Pill>
            </div>
          )}
        </div>
        {/* 左：外凸窗（不是这种） */}
        <div style={{ position: "absolute", left: 50, top: 610, width: 380, opacity: kIn(t, 89.85, 0.35) * 0.95, transformOrigin: "0 0", transform: "scale(1.18)" }}>
          <div style={{ fontFamily: SANS, fontSize: 34, color: C.sub, marginBottom: 12 }}>外凸窗</div>
          <svg width={380} height={380} viewBox="0 0 380 380">
            <rect x={20} y={80} width={340} height={280} fill={C.card} stroke="#5E6B6F" strokeWidth={10} strokeDasharray="22 12" />
            <path d="M90 80 L120 20 H260 L290 80" fill="#E6F1F6" stroke="#9FC9DD" strokeWidth={10} strokeLinejoin="round" />
            {[
              [70, 10, 105, 45],
              [190, -20, 190, 15],
              [310, 10, 275, 45],
            ].map(([x1, y1, x2, y2], i) => (
              <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#F2B33D" strokeWidth={6} strokeLinecap="round" />
            ))}
            <text x={190} y={240} textAnchor="middle" fontFamily={SERIF} fontSize={48} fill={C.muted}>三面进光</text>
          </svg>
          {t > 90.5 && (
            <svg width={380} height={380} viewBox="0 0 380 380" style={{ position: "absolute", left: 0, top: 52 }}>
              <path d="M40 60 L340 360 M340 60 L40 360" stroke={C.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={`${E.outCubic(clamp((t - 90.5) / 0.3))} 1`} />
            </svg>
          )}
        </div>
      </Block>

      {/* F5 冬天低角度阳光只照进窗边一小条 */}
      <Block t={t} at={91.0} out={99} enter="wipe" exit="fade" ox={540} oy={900} cam={[[91.0, 1, 540, 920], [92.8, 1.05, 330, 980], [94.2, 1.05, 330, 980], [95.3, 1.02, 600, 980]]}>
        {/* 剖面：左墙有窗，右边是客厅 */}
        <div style={{ position: "absolute", left: 160, top: 760, width: 780, height: 420, background: "#DCE6EC", border: "8px solid #5E6B6F" }} />
        <div style={{ position: "absolute", left: 152, top: 820, width: 16, height: 190, background: "#9FC9DD" }} />
        {/* 窗边亮着的一小条 */}
        <div style={{ position: "absolute", left: 168, top: 1100, width: 150 * beam, height: 72, background: "rgba(246,195,67,0.65)" }} />
        {/* 光束：从左上低角度射进来，只到窗边 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M60 640 L168 820 L${168 + 150 * beam} 1100 L168 1100 L168 1010 L60 700 Z`} fill="rgba(246,195,67,0.35)" opacity={beam} />
          {/* 想再往里照，被挡住 */}
          {push > 0 && <path d={`M318 1136 L${318 + 240 * push} 1136`} stroke="#F2B33D" strokeWidth={8} strokeDasharray="14 12" strokeLinecap="round" opacity={0.9} />}
          {push > 0.95 && <path d="M548 1112 L588 1160 M588 1112 L548 1160" stroke="#D9483B" strokeWidth={9} strokeLinecap="round" />}
        </svg>
        <Sun x={110} y={640} r={40} spin={t * 30} dim={1} />
        <div style={{ position: "absolute", left: 60, top: 560, opacity: kIn(t, 92.8, 0.3) }}>
          <Pill color={"#4E8DB5"} size={42}>冬天太阳低</Pill>
        </div>
        {/* 卡尺：“只有这一点点” */}
        {t > 92.2 && (
          <div style={{ position: "absolute", left: 168, top: 1040, width: 150, opacity: kIn(t, 92.2, 0.25) }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 150, height: 4, background: C.red }} />
            <div style={{ position: "absolute", left: 0, top: -14, width: 4, height: 32, background: C.red }} />
            <div style={{ position: "absolute", left: 146, top: -14, width: 4, height: 32, background: C.red }} />
            <div style={{ position: "absolute", left: 0, top: -84, transform: `scale(${kPop(t, 92.3)})`, transformOrigin: "0 100%" }}>
              <Pill color={C.red} size={40}>只有一点点</Pill>
            </div>
          </div>
        )}
        {/* 客厅：沙发在阴影里 */}
        <div style={{ position: "absolute", left: 600, top: 1040, opacity: kIn(t, 91.3, 0.35) }}>
          <svg width={280} height={140} viewBox="0 0 140 70">
            <rect x={6} y={26} width={128} height={30} rx={8} fill="#7E8E96" />
            <rect x={14} y={6} width={112} height={26} rx={8} fill="#8F9EA6" />
            <rect x={0} y={20} width={16} height={40} rx={6} fill="#6D7C84" />
            <rect x={124} y={20} width={16} height={40} rx={6} fill="#6D7C84" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 650, top: 950, opacity: kIn(t, 91.5, 0.3), transform: `scale(${kPop(t, 91.5)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.deep} size={46}>客厅</Pill>
        </div>
        <Stamp t={t} at={95.2} x={560} y={860} size={70} color={"#4E8DB5"} rot={-6}>阳光照不进</Stamp>
      </Block>
    </>
  );
};
