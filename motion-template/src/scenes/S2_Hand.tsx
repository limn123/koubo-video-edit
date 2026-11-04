// 30.42–62.95 第一样：看他手里拿的是哪一个价
// （圆形展开）买家手里扇开三张背面朝上的牌 → 你的房子摆上桌，旁边三套“更便宜的”落下 →（横推）本地新房走势线：最贵一万七八 → 现在一万左右，
// “↓四成多” →（斜擦）A小区航拍 + 新房/二手两根横条 + 二手实拍小照片，“差了一多半” →（放大）买家站在一圈价签中间，
// 你的价签被往下拽、刀光一闪“像被砍了” →（右推）挂着的价 vs 真能买到的价 →（上推）仪表盘：狠 / 正常，指针来回晃“判断不了”
import React from "react";
import { Img, staticFile } from "remotion";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { IHouse, Stamp, Title } from "../kit";
import { Block, Snap } from "../parts2";
import { Big, Fig, Gauge, PAPER, Pill, QMark, Tag, bump, kIn, kPop, tw } from "../parts4";

/** 一张房源小卡：房子图标 + 价签 */
const HouseCard: React.FC<{ t: number; at: number; x: number; y: number; label: string; color: string; s?: number; dim?: number; from?: number }> = ({ t, at, x, y, label, color, s = 1, dim = 0, from = -500 }) => {
  const k = E.outBack(clamp((t - at) / 0.45), 1.4);
  if (t < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - k) * from, transform: `scale(${s})`, transformOrigin: "50% 100%", opacity: clamp(k * 3) * (1 - dim * 0.55) }}>
      <div style={{ ...PAPER, width: 200, height: 190, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <IHouse s={92} c={color} w={3.4} />
        <Pill color={color} size={28}>{label}</Pill>
      </div>
    </div>
  );
};

export const S2_Hand: React.FC<{ t: number }> = ({ t }) => {
  if (t < 30.3 || t > 63.6) return null;

  /* B1/B2 牌与桌面 */
  const fan = E.outBack(clamp((t - 31.3) / 0.5), 1.5);
  const cardsAway = E.inCubic(clamp((t - 34.9) / 0.4));

  /* B3 新房走势 */
  const draw = E.inOutCubic(clamp((t - 37.25) / 3.2));
  const PTS: [number, number][] = [
    [150, 1010],
    [260, 940],
    [360, 820],
    [440, 700], // 最贵
    [540, 760],
    [640, 860],
    [760, 950],
    [880, 990], // 现在
  ];
  const linePath = "M" + PTS.map(([x, y]) => `${x} ${y}`).join(" L");

  /* B5 价签环 */
  const orbit = (t - 48.3) * 0.35;
  const pull = E.inOutCubic(clamp((t - 52.35) / 0.55));
  const slash = clamp((t - 53.62) / 0.18);

  /* B7 仪表盘 */
  let needle = -75;
  if (t > 59.7) needle = tw(t, 59.7, 60.2, -75, -10, E.outCubic);
  if (t > 60.9) needle = tw(t, 60.9, 61.2, -10, 55, E.outBack);
  if (t > 61.75) needle = tw(t, 61.75, 62.05, 55, -45, E.outBack);
  if (t > 62.3) needle = Math.sin((t - 62.3) * 22) * 60;
  const blur = t > 62.3 ? 2.5 : 0;

  return (
    <>
      <Title
        t={t}
        items={[
          [30.6, 37.0, "第一样", "他手里拿的\n是哪一个价", C.orange],
          [37.12, 48.15, "旁边更便宜的摆着", "新房都降了\n二手还更便宜", C.orange],
          [48.3, 57.25, "你挂得再合理", "他拿的是\n真能买到的价", C.orange],
          [57.38, 62.8, "他手里是哪个价你不知道", "这一刀狠不狠\n你判断不了", C.red],
        ]}
      />

      {/* B1 + B2：买家手里的牌 → 桌上的房子 */}
      <Block t={t} at={30.45} out={37.02} enter="iris" exit="slideL" ox={880} oy={360} cam={[[30.45, 1.08, 520, 880], [33.0, 1.08, 520, 880], [34.2, 1, 540, 880], [37, 1, 540, 880]]}>
        {/* 桌面 */}
        <div style={{ position: "absolute", left: 70, top: 980, width: 900, height: 150, borderRadius: 24, background: "#E7D9C2", boxShadow: "0 14px 0 #CDBB9E, 0 26px 40px rgba(70,50,20,0.18)" }} />
        {/* 买家 */}
        <div style={{ position: "absolute", left: 130, top: 760, opacity: kIn(t, 30.55, 0.4), transform: `translateX(${(1 - kIn(t, 30.55, 0.5)) * -200}px)` }}>
          <Fig s={1.5} c={C.text} />
        </div>
        {/* 扇形三张牌 */}
        <div style={{ position: "absolute", left: 275, top: 700, opacity: 1 - cardsAway }}>
          {[-1, 0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 120,
                height: 170,
                borderRadius: 14,
                background: `repeating-linear-gradient(45deg, ${C.orange}, ${C.orange} 10px, #E9904F 10px, #E9904F 20px)`,
                border: "6px solid #fff",
                boxShadow: "0 10px 18px rgba(80,50,20,0.25)",
                transformOrigin: "50% 120%",
                transform: `translateY(${-cardsAway * 200}px) rotate(${i * 22 * fan}deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontSize: 70,
                color: "#fff",
              }}
            >
              ？
            </div>
          ))}
        </div>
        <QMark t={t} at={32.55} x={440} y={650} size={110} />
        {/* 你的房子 */}
        <HouseCard t={t} at={33.6} x={560} y={790} label="你的" color={C.deep} s={1.25} />
        {/* 旁边更便宜的 */}
        <HouseCard t={t} at={35.55} x={330} y={800} label="更便宜" color={C.green} s={1.0} />
        <HouseCard t={t} at={35.8} x={755} y={800} label="更便宜" color={C.green} s={1.0} />
        <HouseCard t={t} at={36.05} x={455} y={600} label="更便宜" color={C.green} s={0.86} />
        <div style={{ position: "absolute", left: 560, top: 1160 - 140, opacity: kIn(t, 34.0, 0.3) * (1 - kIn(t, 35.5, 0.3)) }}>
          <Pill color={C.red} size={30} solid={false}>不是凭空砍你</Pill>
        </div>
      </Block>

      {/* B3 本地新房走势 */}
      <Block t={t} at={37.05} out={42.12} enter="slideL" exit="wipe" cam={[[37.05, 1, 540, 880], [42.1, 1.04, 520, 860]]}>
        <div style={{ position: "absolute", left: 90, top: 580, width: 880, height: 590, ...PAPER }} />
        <div style={{ position: "absolute", left: 130, top: 610, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub }}>本地新房单价</div>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="nf" x1="0" y1="680" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={C.orange} stopOpacity={0.3} />
              <stop offset="1" stopColor={C.orange} stopOpacity={0} />
            </linearGradient>
            <clipPath id="nfclip">
              <rect x={0} y={0} width={150 + 730 * draw + 10} height={1920} />
            </clipPath>
          </defs>
          <line x1={140} y1={1080} x2={920} y2={1080} stroke="rgba(24,61,51,0.25)" strokeWidth={2} />
          <g clipPath="url(#nfclip)">
            <path d={`${linePath} L880 1080 L150 1080 Z`} fill="url(#nf)" />
            <path d={linePath} stroke={C.orange} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {t > 38.85 && <circle cx={440} cy={700} r={14 * kPop(t, 38.85)} fill={C.red} />}
          {t > 40.3 && <circle cx={880} cy={990} r={14 * kPop(t, 40.3)} fill={C.deep} />}
          {t > 41.5 && <path d="M470 720 Q 700 760 860 960" stroke={C.red} strokeWidth={5} strokeDasharray="10 12" fill="none" opacity={kIn(t, 41.5, 0.3)} />}
        </svg>
        <div style={{ position: "absolute", left: 300, top: 600, transform: `scale(${kPop(t, 38.9, 0.4, 2) * bump(t, 39.3)})`, transformOrigin: "50% 100%", opacity: clamp(kPop(t, 38.9) * 2) }}>
          <div style={{ ...PAPER, padding: "6px 20px 10px", borderRadius: 14, border: `3px solid ${C.red}` }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.sub }}>最贵时 </span>
            <Big v="1.7~1.8" unit="万/平" size={50} color={C.red} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 620, top: 1000, transform: `scale(${kPop(t, 40.3, 0.4, 2)})`, transformOrigin: "50% 0%", opacity: clamp(kPop(t, 40.3) * 2) }}>
          <div style={{ ...PAPER, padding: "6px 20px 10px", borderRadius: 14 }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.sub }}>现在 </span>
            <Big v="1" unit="万左右" size={50} color={C.deep} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 170, top: 975, transform: `rotate(-6deg) scale(${lerp(2.2, 1, E.outCubic(clamp((t - 41.6) / 0.22)))})`, opacity: clamp((t - 41.6) / 0.1) }}>
          <Pill color={C.red} size={52}>↓ 降了四成多</Pill>
        </div>
        <Snap t={t} at={37.25} x={650} y={600} w={290} h={150} src="p18" rot={4} caption="本地" />
        <div style={{ position: "absolute", left: 130, top: 1110, fontFamily: SANS, fontSize: 24, color: C.muted }}>数字为口播所述 · 走势示意</div>
      </Block>

      {/* B4 A小区：新房 vs 二手 */}
      <Block t={t} at={42.15} out={48.22} enter="wipe" exit="zoomOut" cam={[[42.15, 1, 540, 880], [48.2, 1.03, 540, 900]]}>
        <Snap t={t} at={42.4} x={90} y={570} w={880} h={300} src="p04" rot={-1.5} caption="A小区" pos="50% 60%" />
        <div style={{ position: "absolute", left: 90, top: 960, width: 880, height: 210, ...PAPER, opacity: kIn(t, 43.3, 0.3) }} />
        {/* 新房 */}
        <div style={{ position: "absolute", left: 120, top: 985, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.sub, opacity: kIn(t, 43.4, 0.3) }}>新房</div>
        <div style={{ position: "absolute", left: 200, top: 978, height: 62, width: tw(t, 43.6, 44.3, 0, 740, E.outCubic), borderRadius: 12, background: C.orange, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14, boxSizing: "border-box", overflow: "hidden" }}>
          {t > 44.2 && <Big v="1.1" unit="万上下" size={40} color="#fff" />}
        </div>
        {/* 二手 */}
        <div style={{ position: "absolute", left: 120, top: 1078, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.sub, opacity: kIn(t, 45.0, 0.3) }}>二手</div>
        <div style={{ position: "absolute", left: 200, top: 1070, height: 62, width: tw(t, 45.2, 45.9, 0, 340, E.outCubic), borderRadius: 12, background: C.deep }} />
        <div style={{ position: "absolute", left: 540, top: 1070, height: 62, width: tw(t, 45.7, 46.2, 0, 70, E.outCubic), borderRadius: "0 12px 12px 0", background: "rgba(24,61,51,0.35)" }} />
        <div style={{ position: "absolute", left: 220, top: 1082, opacity: kIn(t, 46.1, 0.3) }}>
          <Big v="5~6" unit="千/平 成交" size={38} color="#fff" />
        </div>
        {/* 二手实拍小照片 */}
        {[["p06", 600, 755, -6, 45.35], ["p07", 710, 745, 4, 45.55], ["p09", 820, 760, -3, 45.75]].map(([src, x, y, r, at]) => {
          const k = E.outBack(clamp((t - (at as number)) / 0.35), 1.6);
          return t > (at as number) ? (
            <div key={src as string} style={{ position: "absolute", left: x as number, top: y as number, width: 110, height: 130, background: "#fff", padding: 6, boxShadow: "0 8px 14px rgba(60,40,20,0.25)", transform: `rotate(${(r as number) * k}deg) scale(${lerp(1.4, 1, k)})`, opacity: clamp(k * 3) }}>
              <Img src={staticFile(`clips/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : null;
        })}
        {/* 差了一多半 */}
        <div style={{ position: "absolute", left: 630, top: 1068, transform: `scale(${lerp(0.5, 1, E.outBack(kIn(t, 47.25, 0.35), 2)) * bump(t, 47.7)})`, transformOrigin: "0% 50%", opacity: kIn(t, 47.25, 0.2), fontFamily: SERIF, fontSize: 48, color: C.red, whiteSpace: "nowrap" }}>← 差了一多半</div>
      </Block>

      {/* B5 买家站在价格中间 */}
      <Block t={t} at={48.25} out={54.45} enter="zoom" exit="slideR" cam={[[48.25, 0.94, 540, 880], [51.8, 1, 540, 880], [54.4, 1.06, 540, 820]]}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 49.7, 0.5) }}>
          <ellipse cx={520} cy={990} rx={290} ry={130} fill="none" stroke="rgba(24,61,51,0.18)" strokeWidth={3} strokeDasharray="6 12" />
        </svg>
        {/* 你的价签（顶上） */}
        <div style={{ position: "absolute", left: 120, top: lerp(615, 690, pull), transform: `scale(${kPop(t, 48.4, 0.45, 1.6)}) rotate(${-3 + pull * 6}deg)`, transformOrigin: "0% 50%" }}>
          <Tag text={<>你的挂牌价 <span style={{ fontSize: 30, opacity: 0.85 }}>挂得再合理</span></>} color={C.deep} size={42} />
          {slash > 0 && (
            <svg width={520} height={120} style={{ position: "absolute", left: -20, top: -20, overflow: "visible" }}>
              <path d="M10 100 L500 0" stroke="#fff" strokeWidth={14 * Math.exp(-(t - 53.8) * 4) + 2} strokeLinecap="round" pathLength={1} strokeDasharray={`${slash} 1`} />
              <path d="M10 100 L500 0" stroke={C.red} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={`${slash} 1`} />
            </svg>
          )}
        </div>
        {/* 环绕的价签 */}
        {(
          [
            ["新房 1万左右", C.orange, 0, 49.75],
            ["二手 5~6千", C.green, 2.1, 50.0],
            ["更便宜的", "#5B6F8A", 4.2, 50.25],
          ] as [string, string, number, number][]
        ).map(([txt, col, ph, at]) => {
          const a = orbit + ph;
          const k = kPop(t, at, 0.4, 1.8);
          // 说到“这些价格中间”时，环上的价签依次亮一下
          const lit = bump(t, 50.66 + (ph / 2.1) * 0.16, 0.14);
          return (
            <div key={txt} style={{ position: "absolute", left: 520 + Math.cos(a) * 290, top: 990 + Math.sin(a) * 130, transform: `translate(-50%,-50%) scale(${k * lit})`, opacity: clamp(k * 2) }}>
              <Tag text={txt} color={col} size={38} />
            </div>
          );
        })}
        {/* 买家 */}
        <div style={{ position: "absolute", left: 439, top: 870, opacity: kIn(t, 49.8, 0.35) }}>
          <Fig s={1.8} c={C.text} />
        </div>
        <div style={{ position: "absolute", left: 640, top: 640, transform: `scale(${kPop(t, 51.95, 0.4, 2)})`, transformOrigin: "0% 100%", opacity: clamp(kPop(t, 51.95) * 2) }}>
          <div style={{ ...PAPER, borderRadius: "24px 24px 24px 6px", padding: "10px 22px 14px", fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.text, whiteSpace: "nowrap" }}>能不能再少点？</div>
        </div>
        {/* 往下拽的箭头 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 52.3, 0.2) * (1 - kIn(t, 53.5, 0.3)) }}>
          <path d="M610 640 V740 M586 712 L610 740 L634 712" stroke={C.red} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", left: 560, top: 770, transform: `rotate(-4deg) scale(${lerp(2, 1, E.outCubic(clamp((t - 53.75) / 0.22)))})`, opacity: clamp((t - 53.75) / 0.1), fontFamily: SERIF, fontSize: 54, color: C.red, whiteSpace: "nowrap" }}>听着像被砍了</div>
      </Block>

      {/* B6 挂着的价 vs 真能买到的价 */}
      <Block t={t} at={54.5} out={57.32} enter="slideR" exit="up" cam={[[54.5, 1, 540, 880], [57.3, 1.05, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 640, width: 400, height: 440, ...PAPER, transform: `rotate(-2deg)`, opacity: lerp(1, 0.55, kIn(t, 56.7, 0.4)) }}>
          <div style={{ position: "absolute", left: 30, top: 30, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.sub }}>你的</div>
          <div style={{ position: "absolute", left: 30, top: 80, fontFamily: SERIF, fontSize: 64, color: C.text }}>挂牌价</div>
          <div style={{ position: "absolute", left: 40, top: 200 }}>
            <IHouse s={150} c={C.muted} w={3} />
          </div>
          <div style={{ position: "absolute", left: 30, top: 370 }}>
            <Pill color="#8E968F" size={30}>只是挂着</Pill>
          </div>
        </div>
        <div style={{ position: "absolute", left: 520, top: 630, width: 420, height: 460, ...PAPER, border: `4px solid ${C.green}`, transform: `rotate(1.5deg) translateY(${(1 - kPop(t, 55.6, 0.5, 1.5)) * 500}px) scale(${bump(t, 56.9, 0.05)})`, opacity: clamp((t - 55.55) / 0.12) }}>
          <div style={{ position: "absolute", left: 30, top: 30, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.green }}>他手里的</div>
          <div style={{ position: "absolute", left: 30, top: 80, fontFamily: SERIF, fontSize: 60, color: C.text, whiteSpace: "nowrap" }}>真能买到的价</div>
          <div style={{ position: "absolute", left: 40, top: 190, display: "flex", flexDirection: "column", gap: 16 }}>
            {["同小区刚成交", "隔壁新房特价", "同价位二手"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, opacity: kIn(t, 55.9 + i * 0.18, 0.25) }}>
                <svg width={34} height={34} viewBox="0 0 48 48">
                  <path d="M8 26 L19 36 L40 12" stroke={C.green} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.text, whiteSpace: "nowrap" }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 30, top: 390, fontFamily: SANS, fontSize: 24, color: C.muted }}>示意</div>
        </div>
        <div style={{ position: "absolute", left: 465, top: 820, transform: `scale(${kPop(t, 56.85, 0.35, 2.4)})`, opacity: clamp(kPop(t, 56.85) * 2), fontFamily: NUM, fontWeight: 800, fontSize: 64, color: C.red, background: C.card, borderRadius: 999, width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(80,50,20,0.25)" }}>VS</div>
      </Block>

      {/* B7 仪表盘：狠还是正常 */}
      <Block t={t} at={57.35} out={62.92} enter="up" exit="slideL" cam={[[57.35, 1, 540, 880], [59.5, 1, 540, 880], [62.9, 1.08, 520, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 600, width: 880, height: 560, ...PAPER }} />
        {/* 你手里：一张空白的牌 */}
        <div style={{ position: "absolute", left: 140, top: 640, display: "flex", alignItems: "center", gap: 20, opacity: kIn(t, 57.4, 0.35) }}>
          <div style={{ width: 120, height: 160, borderRadius: 14, border: `4px dashed ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 80, color: C.orange, transform: `rotate(${Math.sin(t * 4) * 4}deg)` }}>？</div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.text, lineHeight: 1.4 }}>
            他手里是哪个价
            <br />
            <span style={{ color: C.red }}>你不知道</span>
          </div>
        </div>
        <Gauge cx={600} cy={1110} r={260} needle={needle} k={kIn(t, 59.6, 0.5)} blur={blur} />
        <div style={{ position: "absolute", left: 600, top: 1000, opacity: t > 62.35 ? 1 : 0 }}>
          <Stamp t={t} at={62.4} x={0} y={0} color={C.red} size={56} rot={-8}>
            判断不了
          </Stamp>
        </div>
      </Block>
    </>
  );
};
