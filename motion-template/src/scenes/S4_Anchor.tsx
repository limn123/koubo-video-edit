// 87.45–113.6 第三样：看你心里的那个价，是对着什么定的
// （甩镜横推）侧脸剪影里挂着一张价签，价签的绳子拴向一个问号锚点 →（斜擦）C片区实拍、“中介建议 160 万”、房东嫌低、
// “非得挂 170 万”把 160 顶开、12 格年轮一格格走满“0 人问” →（上推）收入条缩短、月供锁链崩断、法槌砸下“130 万 法拍”
// →（圆形展开）瀑布柱：130 被扣税削掉一截剩 110，虚线 160 浮现，“整整 50 万”的落差 →（落下）罗盘：指针死死指着“自己”，
// “市场”被划掉后带着速度线开走
import React from "react";
import { Img, staticFile } from "remotion";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Title } from "../kit";
import { Block, Kinetic, Snap } from "../parts2";
import { Big, Fig, Gavel, PAPER, Pill, QMark, Tag, bump, kIn, kPop, tw } from "../parts4";

const BASE = 1110; // D3 瀑布柱的地面线
const PX = 2.7; // 每万元的像素高度

export const S4_Anchor: React.FC<{ t: number }> = ({ t }) => {
  if (t < 87.3 || t > 114.2) return null;

  /* D1 一年 12 格 */
  const months = Math.floor(clamp((t - 96.3) / 1.2) * 12.99);

  /* D2 收入与锁链 */
  const income = tw(t, 98.3, 99.0, 1, 0.45, E.inOutCubic);
  const snap = clamp((t - 99.55) / 0.35);

  /* D3 瀑布柱 */
  const h130 = 130 * PX * kIn(t, 101.9, 0.01);
  const ghost = kIn(t, 104.3, 0.5);
  const gap = kIn(t, 106.2, 0.4);

  /* D4 罗盘 */
  let needle = Math.sin((t - 107.6) * 9) * 40 * (1 - clamp((t - 108.3) / 0.6));
  if (t > 108.6) needle = tw(t, 108.6, 109.1, 0, -62, E.outBack) + Math.sin(t * 7) * 2;
  const marketGo = E.inCubic(clamp((t - 112.1) / 0.9));

  return (
    <>
      <Title
        t={t}
        items={[
          [87.6, 90.75, "第三样", "你心里那个价\n是对着什么定的", C.red],
          [90.9, 97.6, "C片区 · 一套房", "中介建议160万\n房东非挂170万", C.red],
          [97.7, 101.75, "一挂一年没人问", "月供断了\n130万被法拍", C.red],
          [101.85, 107.45, "扣完税到手才110万", "比当初听劝\n少了整整50万", C.red],
          [107.6, 113.5, "他心里那个价", "对着的是自己\n不是市场", C.red],
        ]}
      />

      {/* D0 心里的价签拴在哪 */}
      <Block t={t} at={87.47} out={90.82} enter="slideL" exit="wipe" cam={[[87.47, 1, 540, 880], [90.8, 1.06, 520, 880]]}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* 侧脸剪影 */}
          <path
            d="M200 1150 C200 1060 180 1010 150 960 C120 910 130 860 160 840 C140 800 150 760 170 740 C160 700 170 680 180 660 C190 560 280 600 360 600 C520 600 600 700 600 830 C600 960 540 1040 520 1150 Z"
            fill="rgba(24,61,51,0.08)"
            stroke={C.text}
            strokeWidth={5}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={`${kIn(t, 87.55, 0.9)} 1`}
          />
          {/* 绳子：价签 → 锚点 */}
          <path d="M470 840 C 620 760, 720 900, 840 860" stroke={C.red} strokeWidth={4} fill="none" strokeDasharray="10 8" opacity={kIn(t, 89.4, 0.4)} pathLength={1} />
        </svg>
        <div style={{ position: "absolute", left: 300, top: 790, transform: `rotate(${Math.sin(t * 2.4) * 5}deg) scale(${kPop(t, 88.2, 0.45, 1.6)})`, transformOrigin: "0% 50%" }}>
          <Tag text="心里的价" color={C.red} size={40} />
        </div>
        <div style={{ position: "absolute", left: 790, top: 800, width: 120, height: 120, borderRadius: 60, border: `5px dashed ${C.red}`, transform: `scale(${kPop(t, 89.5, 0.4, 2)})`, opacity: clamp(kPop(t, 89.5) * 2) }} />
        <QMark t={t} at={89.6} x={850} y={860} size={90} color={C.red} />
        <div style={{ position: "absolute", left: 700, top: 960, opacity: kIn(t, 89.9, 0.3) }}>
          <Pill color={C.red} size={34} solid={false}>对着什么定的？</Pill>
        </div>
      </Block>

      {/* D1 C片区：160 → 170，一挂一年 */}
      <Block t={t} at={90.85} out={97.62} enter="wipe" exit="up" cam={[[90.85, 1, 540, 880], [96.0, 1, 540, 880], [97.6, 1.05, 680, 990]]}>
        <Snap t={t} at={91.0} x={90} y={570} w={500} h={330} src="p13" rot={-2.5} caption="C片区" />
        {/* 160 → 被 170 顶开 */}
        <div style={{ position: "absolute", left: 640, top: lerp(780, 815, kIn(t, 95.35, 0.3)), transform: `scale(${kPop(t, 92.4, 0.45, 1.6)}) rotate(${lerp(0, 8, kIn(t, 95.35, 0.3))}deg)`, transformOrigin: "0% 50%", opacity: lerp(1, 0.35, kIn(t, 95.35, 0.3)) * (1 - kIn(t, 96.1, 0.3)) }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.green, marginBottom: 6 }}>中介建议</div>
          <Tag text={<><span style={{ fontFamily: NUM, fontWeight: 700 }}>160</span> 万</>} color={C.green} size={48} />
        </div>
        <div style={{ position: "absolute", left: 650, top: lerp(380, 610, E.outBack(clamp((t - 95.1) / 0.35), 1.3)), opacity: clamp((t - 95.1) / 0.1), transform: `scale(${bump(t, 95.45, 0.08)})`, transformOrigin: "0% 50%" }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.red, marginBottom: 6 }}>房东非得挂</div>
          <Tag text={<><span style={{ fontFamily: NUM, fontWeight: 700 }}>170</span> 万</>} color={C.red} size={56} />
        </div>
        {/* 房东嫌低 */}
        <div style={{ position: "absolute", left: 120, top: 960, display: "flex", alignItems: "flex-end", gap: 10, opacity: kIn(t, 93.85, 0.3), transform: `translateY(${(1 - kIn(t, 93.85, 0.35)) * 40}px)` }}>
          <Fig s={0.9} c={C.deep} mood="sad" />
          <div style={{ ...PAPER, borderRadius: "28px 28px 28px 6px", padding: "10px 24px 14px", fontFamily: SERIF, fontSize: 46, color: C.text, marginBottom: 80 }}>嫌低！</div>
        </div>
        {/* 一年 12 格 */}
        <div style={{ position: "absolute", left: 470, top: 940, width: 470, height: 230, ...PAPER, opacity: kIn(t, 96.2, 0.3) }}>
          <div style={{ position: "absolute", left: 24, top: 18, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.sub }}>挂了一年</div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 24 + (i % 6) * 72, top: 70 + Math.floor(i / 6) * 70, width: 60, height: 58, borderRadius: 10, background: i < months ? "rgba(217,72,59,0.14)" : "rgba(24,61,51,0.05)", border: `2px solid ${i < months ? C.red : "rgba(24,61,51,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NUM, fontWeight: 700, fontSize: 22, color: i < months ? C.red : C.muted }}>
              {i < months ? "0人" : ""}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 760, top: 900, transform: `scale(${kPop(t, 97.35, 0.35, 2.2)}) rotate(-6deg)`, opacity: clamp(kPop(t, 97.35) * 2) }}>
          <Pill color={C.red} size={34}>没人问</Pill>
        </div>
      </Block>

      {/* D2 收入少了 → 月供断 → 法拍 */}
      <Block t={t} at={97.65} out={101.8} enter="up" exit="iris" ox={540} oy={900} cam={[[97.65, 1, 540, 880], [101.8, 1.04, 540, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 590, width: 880, height: 570, ...PAPER }} />
        {/* 夫妻俩 */}
        <div style={{ position: "absolute", left: 130, top: 640, display: "flex", gap: 0, opacity: kIn(t, 97.75, 0.3) }}>
          <Fig s={0.95} c={C.deep} mood="sad" />
          <Fig s={0.86} c={C.orange} mood="sad" />
        </div>
        <div style={{ position: "absolute", left: 300, top: 652, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub, opacity: kIn(t, 98.0, 0.3) }}>收入</div>
        <div style={{ position: "absolute", left: 300, top: 705, height: 48, width: 420 * income * kIn(t, 98.0, 0.3), borderRadius: 10, background: income < 0.8 ? C.orange : C.green }} />
        {t > 98.6 && <div style={{ position: "absolute", left: 290 + 420 * income + 12, top: 712, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.red, opacity: kIn(t, 98.6, 0.3) }}>少了</div>}
        {/* 锁链：收入 ↔ 月供 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 98.9, 0.3) }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const x = 200 + i * 62;
            const left = i < 3;
            const off = i === 3 ? 0 : (left ? -1 : 1) * E.outCubic(snap) * (30 + Math.abs(i - 3) * 6);
            const dy = E.inCubic(snap) * (i === 3 ? 160 : 40);
            return i === 3 && snap > 0.1 ? (
              <g key={i} transform={`translate(${x} ${870 + dy}) rotate(${snap * 70})`} opacity={1 - snap}>
                <path d="M-26 -16 A16 16 0 0 0 -26 16 M26 -16 A16 16 0 0 1 26 16" stroke={C.red} strokeWidth={8} fill="none" />
              </g>
            ) : (
              <rect key={i} x={x - 30 + off} y={854 + dy} width={60} height={32} rx={16} fill="none" stroke={i === 3 ? C.red : "#8A9590"} strokeWidth={8} transform={i % 2 ? `rotate(0)` : undefined} />
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 130, top: 920, fontFamily: SERIF, fontSize: 48, color: C.text, opacity: kIn(t, 99.0, 0.3) }}>月供</div>
        <div style={{ position: "absolute", left: 360, top: 910, transform: `scale(${lerp(2, 1, E.outCubic(clamp((t - 99.6) / 0.2)))}) rotate(-5deg)`, opacity: clamp((t - 99.6) / 0.08), fontFamily: SERIF, fontSize: 60, color: C.red }}>断了</div>
        {/* 法拍 */}
        <div style={{ position: "absolute", left: 640, top: 640, width: 290, height: 220, background: "#fff", padding: 8, boxShadow: "0 12px 22px rgba(60,40,20,0.25)", transform: `rotate(3deg) scale(${kPop(t, 100.0, 0.45, 1.4)})`, opacity: clamp(kPop(t, 100.0) * 2) }}>
          <Img src={staticFile("clips/p17.jpg")} style={{ width: "100%", height: 170, objectFit: "cover" }} />
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.text, marginTop: 4 }}>法拍房 · 示意</div>
        </div>
        <Gavel t={t} hit={100.95} x={600} y={900} />
        <div style={{ position: "absolute", left: 380, top: 1040, transform: `scale(${kPop(t, 100.95, 0.35, 2) * bump(t, 101.3)})`, transformOrigin: "50% 50%", opacity: clamp(kPop(t, 100.95) * 3) }}>
          <Pill color={C.red} size={46}>
            <span style={{ fontFamily: NUM, fontWeight: 800 }}>130</span>万 被法拍
          </Pill>
        </div>
      </Block>

      {/* D3 瀑布柱：130 → 扣税 → 110，对比 160 */}
      <Block t={t} at={101.82} out={107.5} enter="iris" exit="drop" ox={540} oy={900} cam={[[101.82, 1, 540, 880], [105.5, 1, 540, 880], [107.5, 1.06, 640, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 560, width: 880, height: 620, ...PAPER }} />
        <div style={{ position: "absolute", left: 120, top: BASE, width: 820, height: 4, background: "rgba(24,61,51,0.3)" }} />
        {/* 法拍 130 */}
        <div style={{ position: "absolute", left: 170, top: BASE - h130, width: 170, height: h130, borderRadius: "12px 12px 0 0", background: C.orange }} />
        <div style={{ position: "absolute", left: 255, top: BASE - h130 - 70, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <Big v="130" unit="万" size={52} color={C.orange} />
        </div>
        <div style={{ position: "absolute", left: 170, top: BASE + 12, width: 170, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.sub }}>法拍</div>
        {/* 税：从 130 顶上削下的一截 */}
        <div style={{ position: "absolute", left: 400, top: BASE - 130 * PX, width: 170, height: 20 * PX, borderRadius: 10, background: C.red, opacity: kIn(t, 101.9, 0.2), transform: `translateX(${(1 - E.outCubic(clamp((t - 101.9) / 0.3))) * -230}px)` }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 6, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#fff" }}>扣税</div>
        </div>
        {/* 到手 110 */}
        {t > 102.55 && (
          <>
            <div style={{ position: "absolute", left: 630, top: BASE - 110 * PX * kIn(t, 102.55, 0.5), width: 170, height: 110 * PX * kIn(t, 102.55, 0.5), borderRadius: "12px 12px 0 0", background: C.deep }} />
            <div style={{ position: "absolute", left: 715, top: BASE - 110 * PX - 70, transform: `translateX(-50%) scale(${kPop(t, 103.1, 0.35, 2) * bump(t, 103.5)})`, whiteSpace: "nowrap" }}>
              <Big v="110" unit="万" size={56} color={C.deep} />
            </div>
            <div style={{ position: "absolute", left: 630, top: BASE + 12, width: 170, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.sub }}>到手</div>
          </>
        )}
        {/* 当初听劝 160（虚线） */}
        {ghost > 0 && (
          <>
            <div style={{ position: "absolute", left: 630, top: BASE - 160 * PX, width: 170, height: 50 * PX, border: `4px dashed ${C.green}`, borderBottom: "none", borderRadius: "12px 12px 0 0", boxSizing: "border-box", opacity: ghost, background: "rgba(42,140,95,0.07)" }} />
            <div style={{ position: "absolute", left: 830, top: BASE - 160 * PX - 10, opacity: ghost, whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.green }}>当初听劝</div>
              <Big v="160" unit="万" size={44} color={C.green} />
            </div>
          </>
        )}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: gap }}>
          <path d={`M610 ${BASE - 160 * PX} V${BASE - 110 * PX}`} stroke={C.red} strokeWidth={6} />
          <path d={`M596 ${BASE - 160 * PX} H624 M596 ${BASE - 110 * PX} H624`} stroke={C.red} strokeWidth={6} />
        </svg>
        <Kinetic t={t} at={106.7} x={380} y={BASE - 150 * PX} text="整整50万" kind="slam" size={84} color={C.red} rot={-4} />
      </Block>

      {/* D4 罗盘：对着自己，不是市场 */}
      <Block t={t} at={107.52} out={113.55} enter="drop" exit="fade" cam={[[107.52, 1, 540, 880], [111.8, 1, 540, 880], [113.5, 0.96, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 580, width: 880, height: 580, ...PAPER }} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform="translate(600 880) scale(1) translate(-540 -900)">
          <circle cx={540} cy={900} r={210} fill="#FBF6EC" stroke={C.text} strokeWidth={6} />
          <circle cx={540} cy={900} r={180} fill="none" stroke="rgba(24,61,51,0.15)" strokeWidth={2} strokeDasharray="4 10" />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return <line key={i} x1={540 + Math.sin(a) * 196} y1={900 - Math.cos(a) * 196} x2={540 + Math.sin(a) * (i % 6 === 0 ? 168 : 182)} y2={900 - Math.cos(a) * (i % 6 === 0 ? 168 : 182)} stroke={C.text} strokeOpacity={0.4} strokeWidth={3} />;
          })}
          <g transform={`rotate(${needle} 540 900)`}>
            <path d="M540 900 L524 900 L540 730 L556 900 Z" fill={C.red} />
            <path d="M540 900 L524 900 L540 1060 L556 900 Z" fill="#B7BFBB" />
          </g>
          <circle cx={540} cy={900} r={16} fill={C.text} />
          </g>
        </svg>
        {/* 自己买进来的 */}
        <div style={{ position: "absolute", left: 120, top: 612, transform: `scale(${kPop(t, 108.6, 0.4, 1.8) * bump(t, 109.3, 0.06)})`, transformOrigin: "0% 50%", opacity: clamp(kPop(t, 108.6) * 2) }}>
          <Pill color={C.red} size={38}>自己买进来时的想法</Pill>
        </div>
        {/* 市场 */}
        <div style={{ position: "absolute", left: lerp(780, 1300, marketGo), top: 1072, opacity: kIn(t, 110.6, 0.3) * (1 - marketGo * 0.8) }}>
          <div style={{ position: "relative" }}>
            <Pill color={C.green} size={44} solid={false}>
              市场
            </Pill>
            <div style={{ position: "absolute", left: -8, top: "48%", height: 6, width: `${E.outCubic(clamp((t - 111.2) / 0.3)) * 112}%`, background: C.red, borderRadius: 3 }} />
            {marketGo > 0 && (
              <svg width={200} height={80} style={{ position: "absolute", left: -210, top: 0, overflow: "visible", opacity: 1 - marketGo }}>
                {[10, 36, 62].map((y, i) => (
                  <line key={i} x1={200 - 60 - i * 30} y1={y} x2={190} y2={y} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
                ))}
              </svg>
            )}
          </div>
        </div>
        <div style={{ position: "absolute", left: 130, top: 1088, opacity: kIn(t, 112.25, 0.3), transform: `translateY(${(1 - kIn(t, 112.25, 0.35)) * 20}px)` }}>
          <span style={{ fontFamily: SERIF, fontSize: 44, color: C.text }}>市场不会等你想通</span>
        </div>
      </Block>
    </>
  );
};
