// 115.58–129.12 一个毛病：拿心慌做决定，不是拿市场做决定；接太急 / 拖太久都疼
// （圆形展开）“决定”按钮：一根狂跳的心电线插在上面，“市场”的插头垂在一边没插 →（右推）你的硬币一枚枚飞进买家的礼盒，
// 盒盖弹开“送给人家” →（下落）买家背影淡出、房子卡蒙灰挂蛛网，撕页日历一张张飞走，每张都扣一笔“月供”
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { IHouse, Title } from "../kit";
import { Block } from "../parts2";
import { Fig, Gift, PAPER, Pill, bump, ecgPath, kIn, kPop } from "../parts4";

const COIN_AT = [120.75, 121.0, 121.25, 121.5, 121.75, 122.0];
const TEAR_AT = [127.5, 127.95, 128.35, 128.75];

export const S5_Cost: React.FC<{ t: number }> = ({ t }) => {
  if (t < 115.4 || t > 129.8) return null;
  const ecgDraw = E.inOutCubic(clamp((t - 115.8) / 1.0));
  const ecgShift = (t * 260) % 160;
  const glow = 0.5 + 0.5 * Math.sin(t * 18);

  return (
    <>
      <Title
        t={t}
        items={[
          [115.75, 119.62, "毛病在哪", "拿心慌做决定\n不是拿市场", C.red],
          [119.75, 123.82, "接得太急", "白白多让几万\n等于送给人家", C.orange],
          [123.95, 129.0, "拖得太久", "买家走了\n月供一天不少", C.deep],
        ]}
      />

      {/* E1 决定按钮 */}
      <Block t={t} at={115.62} out={119.68} enter="iris" exit="slideR" ox={880} oy={360} cam={[[115.62, 1, 540, 880], [119.6, 1.05, 600, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 590, width: 880, height: 570, ...PAPER }} />
        {/* 心电线（心慌） */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <clipPath id="ecgc">
              <rect x={120} y={600} width={500 * ecgDraw} height={300} />
            </clipPath>
          </defs>
          <g clipPath="url(#ecgc)">
            <g transform={`translate(${-ecgShift} 0)`}>
              <path d={ecgPath(120, 760, 800, 5, 110, 20)} stroke={C.red} strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          </g>
          {/* 接入按钮的线 */}
          <path d="M620 760 C 680 760, 690 820, 700 860" stroke={C.red} strokeWidth={7} fill="none" opacity={ecgDraw} />
          {/* 市场：垂下来的线 + 插头 */}
          <path d={`M130 1110 C 260 1110, 330 ${1040 + Math.sin(t * 2) * 8}, 420 ${1070 + Math.sin(t * 2) * 8}`} stroke={C.green} strokeWidth={7} fill="none" opacity={kIn(t, 118.1, 0.35)} />
        </svg>
        <div style={{ position: "absolute", left: 130, top: 640, opacity: kIn(t, 115.9, 0.3) }}>
          <Pill color={C.red} size={36}>💓 心慌</Pill>
        </div>
        {/* 决定按钮 */}
        <div style={{ position: "absolute", left: 640, top: 860, width: 270, height: 170, borderRadius: 30, background: C.red, boxShadow: `0 10px 0 #A8352B, 0 0 ${40 * glow * ecgDraw}px rgba(217,72,59,0.6)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 72, color: "#fff", transform: `scale(${kPop(t, 115.7, 0.45, 1.6) * (1 + 0.02 * glow * ecgDraw)})` }}>决定</div>
        {/* 市场插头（没插上） */}
        <div style={{ position: "absolute", left: 410, top: 1040 + Math.sin(t * 2) * 8, display: "flex", alignItems: "center", gap: 12, opacity: kIn(t, 118.1, 0.35) }}>
          <div style={{ width: 54, height: 40, borderRadius: 8, background: C.green, position: "relative" }}>
            <div style={{ position: "absolute", right: -14, top: 8, width: 16, height: 6, background: "#8A9590" }} />
            <div style={{ position: "absolute", right: -14, top: 26, width: 16, height: 6, background: "#8A9590" }} />
          </div>
          <Pill color={C.green} size={34} solid={false}>市场 · 没接上</Pill>
        </div>
      </Block>

      {/* E2 硬币飞进买家礼盒 */}
      <Block t={t} at={119.72} out={123.86} enter="slideR" exit="drop" cam={[[119.72, 1, 540, 880], [123.8, 1.04, 560, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 600, width: 880, height: 560, ...PAPER }} />
        {/* 你 */}
        <div style={{ position: "absolute", left: 130, top: 700, opacity: kIn(t, 119.8, 0.3) }}>
          <Fig s={1.1} c={C.deep} mood="sad" />
        </div>
        <div style={{ position: "absolute", left: 120, top: 880, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.sub }}>你</div>
        {/* 你的硬币堆（越来越少） */}
        {Array.from({ length: 6 }).map((_, i) => {
          const gone = t > COIN_AT[5 - i];
          return gone ? null : <div key={i} style={{ position: "absolute", left: 240, top: 1040 - i * 22, width: 120, height: 30, borderRadius: "50%", background: "#F6D27A", border: "4px solid #D9A93E", boxSizing: "border-box", opacity: kIn(t, 119.85, 0.3) }} />;
        })}
        {/* 飞行硬币 */}
        {COIN_AT.map((a, i) => {
          const k = clamp((t - a) / 0.5);
          if (k <= 0 || k >= 1) return null;
          const x = lerp(300, 720, E.inOutCubic(k));
          const y = lerp(1040 - (5 - i) * 22, 880, k) - Math.sin(k * Math.PI) * 220;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: 70, height: 70, borderRadius: 35, background: "radial-gradient(circle at 35% 30%, #FFE9A8, #F2C14E)", border: "4px solid #D9A93E", boxSizing: "border-box", transform: `rotate(${k * 540}deg)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NUM, fontWeight: 800, fontSize: 30, color: "#B8862B" }}>
              ¥
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 300, top: 690, transform: `scale(${kPop(t, 121.25, 0.4, 2)})`, transformOrigin: "0% 50%", opacity: clamp(kPop(t, 121.25) * 2) }}>
          <span style={{ position: "relative", fontFamily: SERIF, fontSize: 56, color: C.text, whiteSpace: "nowrap" }}>
            白白多让出<span style={{ color: C.red }}>几万</span>
          </span>
        </div>
        {/* 买家的礼盒 */}
        <Gift t={t} x={660} y={880} openAt={123.15} s={1} />
        <div style={{ position: "absolute", left: 660, top: 1100, width: 220, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.sub }}>买家</div>
        <div style={{ position: "absolute", left: 600, top: 780, transform: `scale(${kPop(t, 123.2, 0.4, 2.2)}) rotate(-5deg)`, opacity: clamp(kPop(t, 123.2) * 2) }}>
          <Pill color={C.red} size={40}>送给人家 🎁</Pill>
        </div>
      </Block>

      {/* E3 拖太久：买家走了，月供一天天扣 */}
      <Block t={t} at={123.9} out={129.0} enter="drop" exit="fade" cam={[[123.9, 1, 540, 880], [126.9, 1, 540, 880], [129, 1.05, 600, 960]]}>
        <div style={{ position: "absolute", left: 90, top: 590, width: 880, height: 570, ...PAPER }} />
        {/* 买家背影淡出 */}
        <div style={{ position: "absolute", left: lerp(700, 800, kIn(t, 124.6, 0.8)), top: 610, opacity: kIn(t, 123.95, 0.3) * (1 - kIn(t, 124.7, 0.6)) }}>
          <Fig s={1.3} c={C.green} />
        </div>
        <div style={{ position: "absolute", left: 660, top: 820, opacity: kIn(t, 124.75, 0.3) * (1 - kIn(t, 125.6, 0.3)) }}>
          <Pill color={C.green} size={30} solid={false}>买家走了</Pill>
        </div>
        {/* 房子：蒙灰 + 蛛网 */}
        <div style={{ position: "absolute", left: 120, top: 630, width: 380, height: 330, ...PAPER, filter: `grayscale(${kIn(t, 125.5, 0.6)})`, opacity: kIn(t, 124.0, 0.3), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <IHouse s={180} c={C.deep} w={3} />
          <Pill color={C.orange} size={34}>又没人问了</Pill>
          <svg width={140} height={140} viewBox="0 0 100 100" style={{ position: "absolute", right: 0, top: 0, opacity: kIn(t, 125.7, 0.5) }}>
            <path d="M100 0 L0 0 M100 0 L100 100 M100 0 L20 80 M100 0 L50 100 M100 0 L0 40" stroke="#8E968F" strokeWidth={1.5} />
            {[25, 45, 65].map((r) => (
              <path key={r} d={`M${100 - r} 0 Q ${100 - r * 0.8} ${r * 0.5} ${100 - r * 0.6} ${r * 0.75} Q ${100 - r * 0.35} ${r * 0.85} 100 ${r}`} stroke="#8E968F" strokeWidth={1.5} fill="none" />
            ))}
          </svg>
        </div>
        {/* 撕页日历 */}
        <div style={{ position: "absolute", left: 540, top: 880, width: 340, height: 240, opacity: kIn(t, 127.2, 0.3), transform: "scale(1.12)", transformOrigin: "0% 0%" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 340, height: 240, ...PAPER, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: SERIF, fontSize: 48, color: C.red }}>月供照扣</span>
          </div>
          {TEAR_AT.map((a, i) => {
            const k = clamp((t - a) / 0.6);
            if (k >= 1) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 340,
                  height: 240,
                  ...PAPER,
                  borderRadius: 16,
                  zIndex: 10 - i,
                  transformOrigin: "50% 0%",
                  transform: `translate(${E.inCubic(k) * 260}px, ${E.inCubic(k) * -420}px) rotate(${k * 40}deg)`,
                  opacity: 1 - E.inCubic(k),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 46, background: C.red, borderRadius: "16px 16px 0 0" }} />
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.sub, marginTop: 30 }}>又过一天</span>
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.red, transform: `scale(${bump(t, a - 0.3, 0.1)})` }}>－ 月供</span>
              </div>
            );
          })}
        </div>
      </Block>
    </>
  );
};
