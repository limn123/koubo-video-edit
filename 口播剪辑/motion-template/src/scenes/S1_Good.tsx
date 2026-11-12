// 7.7–29.0 优点（简单讲；旧时间。原来的“体量大、物业管理着重”一句已删）
// （圆形展开）11 栋楼一栋栋长出来、数字滚到 11，商超遮阳棚 + 购物车滑进来 →（甩镜横推）衣架尺码表：每说一个面积挂上一件，
// “加上”时第二根衣架滑进来挂大号 →（放大）集卡册 8 格逐个点亮，“基本集齐”章；“特殊户型”划掉
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Stamp, Title } from "../kit";
import { Block, Kinetic } from "../parts2";
import { PAPER, Pill, bump, kIn, kPop } from "../parts4";

/* ---------- A1 楼群 ---------- */
const TOWERS: [x: number, h: number][] = [
  [92, 300],
  [168, 380],
  [244, 330],
  [320, 420],
  [396, 350],
  [472, 400],
  [548, 310],
  [624, 390],
  [700, 340],
  [776, 410],
  [852, 320],
];
const GROUND = 1180;
const Tower: React.FC<{ x: number; h: number; k: number; lit: number; i: number }> = ({ x, h, k, lit, i }) => {
  if (k <= 0) return null;
  const hh = h * E.outBack(k, 1.2);
  return (
    <div style={{ position: "absolute", left: x, top: GROUND - hh, width: 66, height: hh, background: i % 2 ? "#E9DFCC" : "#F3EADB", border: "3px solid #5E6B6F", borderBottom: "none", borderRadius: "8px 8px 0 0", overflow: "hidden", boxShadow: "6px 0 0 rgba(94,107,111,0.18)" }}>
      {Array.from({ length: Math.floor(h / 34) }).map((_, r) =>
        [0, 1].map((c) => (
          <div key={`${r}-${c}`} style={{ position: "absolute", left: 10 + c * 26, top: 16 + r * 34, width: 16, height: 18, borderRadius: 3, background: (r * 3 + c + i) % 5 < lit * 5 ? "#F6D27A" : "rgba(94,107,111,0.25)" }} />
        )),
      )}
    </div>
  );
};

/* ---------- A2 衣架尺码表 ---------- */
const Shirt: React.FC<{ t: number; at: number; x: number; y: number; area: number; color: string; s: number }> = ({ t, at, x, y, area, color, s }) => {
  if (t < at - 0.02) return null;
  const k = E.outCubic(clamp((t - at) / 0.32));
  const d = t - at;
  const sw = Math.sin(d * 7) * 16 * Math.exp(-d * 2.2);
  return (
    <div style={{ position: "absolute", left: x, top: y - (1 - k) * 260, opacity: clamp(k * 3), transformOrigin: "50% 0%", transform: `rotate(${sw}deg)` }}>
      <svg width={150 * s} height={200 * s} viewBox="0 0 150 200" style={{ position: "absolute", left: -75 * s, top: 0, overflow: "visible" }}>
        {/* 衣架 */}
        <path d="M75 0 C 75 -14, 92 -14, 90 -2 C 89 6, 78 8, 75 14" fill="none" stroke="#6B5A48" strokeWidth={5} strokeLinecap="round" />
        <path d="M75 14 L18 40 H132 Z" fill="none" stroke="#6B5A48" strokeWidth={5} strokeLinejoin="round" />
        {/* T 恤 */}
        <path d="M48 34 L18 50 L4 86 L30 96 L36 80 V190 H114 V80 L120 96 L146 86 L132 50 L102 34 C 96 46, 54 46, 48 34 Z" fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: -60 * s, width: 120 * s, top: (area >= 100 ? 98 : 92) * s, textAlign: "center", fontFamily: NUM, fontSize: (area >= 100 ? 40 : 50) * s, letterSpacing: area >= 100 ? -3 : 0, color: "#fff", lineHeight: 1 }}>{area}</div>
      <div style={{ position: "absolute", left: -60 * s, width: 120 * s, top: 148 * s, textAlign: "center", fontFamily: SANS, fontSize: 28 * s, color: "rgba(255,255,255,0.9)" }}>平</div>
    </div>
  );
};
const SIZES1: [number, number][] = [
  [81, 13.5],
  [89, 14.22],
  [97, 14.84],
  [99, 15.42],
  [105, 16.24],
];
const SIZES2: [number, number][] = [
  [117, 18.4],
  [126, 19.46],
  [145, 20.66],
];
const SHIRT_COL = [C.green, "#4E9C7A", C.orange, "#E9904F", "#C8693A"];
const SHIRT_COL2 = [C.red, "#B83E33", C.deep];

/* ---------- A3 集卡册 ---------- */
const CARDS = [81, 89, 97, 99, 105, 117, 126, 145];

export const S1_Good: React.FC<{ t: number }> = ({ t }) => {
  if (t < 7.6 || t > 29.1) return null;
  const n11 = lerp(0, 11, E.outCubic(clamp((t - 8.75) / 1.25)));
  const cart = E.outCubic(clamp((t - 10.5) / 0.55));
  const rack2 = E.outExpo(clamp((t - 17.85) / 0.5));
  // 第一排先挂在画面中间（下面不空着），“加上”第二根衣架滑进来时一起往上让位
  const r1 = lerp(850, 700, E.inOutCubic(clamp((t - 17.7) / 0.6)));
  return (
    <>
      <Title
        t={t}
        items={[
          [7.8, 11.1, "优点 ①", "11 栋楼\n自带商超", C.green],
          [11.35, 22.15, "优点 ②", "户型多\n81 到 145 平", C.green],
          [22.45, 28.55, "优点 ③", "开发商特色户型\n基本集齐", C.green],
        ]}
      />

      {/* A1 楼群 + 商超 */}
      <Block t={t} at={7.75} out={11.1} enter="iris" exit="slideL" ox={880} oy={360} cam={[[7.75, 1.06, 540, 950], [10.3, 1, 540, 950], [11.1, 1.03, 700, 1000]]}>
        <div style={{ position: "absolute", left: 60, top: GROUND, width: 900, height: 10, background: "#5E6B6F", borderRadius: 5, opacity: kIn(t, 7.9, 0.3) }} />
        {TOWERS.map(([x, h], i) => (
          <Tower key={i} x={x} h={h} i={i} k={clamp((t - (8.4 + i * 0.13)) / 0.42)} lit={clamp((t - 9.9) / 0.6)} />
        ))}
        <div style={{ position: "absolute", left: 80, top: 600, display: "flex", alignItems: "baseline", gap: 10, opacity: kIn(t, 8.7, 0.25), transform: `scale(${bump(t, 9.36, 0.12)})`, transformOrigin: "0 80%" }}>
          <span style={{ fontFamily: SANS, fontSize: 44, color: C.sub }}>一共</span>
          <span style={{ fontFamily: NUM, fontSize: 130, color: C.green, lineHeight: 1, letterSpacing: -6, display: "inline-block", minWidth: 120, textAlign: "center" }}>{Math.round(n11)}</span>
          <span style={{ fontFamily: SERIF, fontSize: 64, color: C.text }}>栋楼</span>
        </div>
        {/* 商超：遮阳棚门面 + 购物车 */}
        <div style={{ position: "absolute", left: 600, top: 1000 + (1 - cart) * 400, width: 330, opacity: clamp(cart * 3) }}>
          <div style={{ ...PAPER, height: 180, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ height: 56, background: `repeating-linear-gradient(90deg, ${C.orange} 0 33px, #fff 33px 66px)`, borderBottom: "4px solid #C8693A" }} />
            <div style={{ textAlign: "center", fontFamily: SERIF, fontSize: 54, color: C.text, marginTop: 14 }}>商 超</div>
          </div>
        </div>
        <svg width={150} height={120} viewBox="0 0 60 48" style={{ position: "absolute", left: lerp(1100, 470, cart), top: 1060, opacity: cart > 0 ? 1 : 0 }}>
          <path d="M2 6 H12 L18 32 H48 L54 12 H15" fill="none" stroke={C.deep} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={22} cy={41} r={4.5} fill={C.deep} />
          <circle cx={44} cy={41} r={4.5} fill={C.deep} />
          <rect x={22} y={16} width={10} height={10} fill={C.green} />
          <rect x={34} y={18} width={10} height={8} fill={C.orange} />
        </svg>
        <div style={{ position: "absolute", left: 650, top: 860, opacity: kIn(t, 10.75, 0.3), transform: `scale(${kPop(t, 10.75)})`, transformOrigin: "50% 100%" }}>
          <Pill color={C.green} size={46}>自带商超</Pill>
        </div>
      </Block>

      {/* A2 衣架尺码表 */}
      <Block t={t} at={11.3} out={22.15} enter="slideL" exit="zoomOut" ox={540} oy={900} cam={[[11.3, 1, 540, 900], [17.6, 1.03, 540, 820], [18.3, 1, 540, 960], [22.1, 1.03, 540, 960]]}>
        <div style={{ position: "absolute", left: 70, top: r1 - 106, fontFamily: SANS, fontSize: 40, color: C.sub, opacity: kIn(t, 11.5, 0.4) }}>现有户型 · 像尺码表一样排开</div>
        {/* 第一根衣架 */}
        <div style={{ position: "absolute", left: 60, top: r1, width: 900 * kIn(t, 11.6, 0.6, E.outExpo), height: 12, background: "#8C949A", borderRadius: 6 }} />
        {SIZES1.map(([a, at], i) => (
          <Shirt key={a} t={t} at={at} x={148 + i * 182} y={r1 + 6} area={a} color={SHIRT_COL[i]} s={1.0 + i * 0.04} />
        ))}
        {/* 第二根衣架：“加上”时滑进来，挂大号 */}
        <div style={{ position: "absolute", left: 60 + (1 - rack2) * 1000, top: 1010, width: 900, height: 12, background: "#8C949A", borderRadius: 6, opacity: rack2 > 0 ? 1 : 0 }} />
        <div style={{ position: "absolute", left: 70 + (1 - rack2) * 1000, top: 950, opacity: rack2 > 0 ? 1 : 0 }}>
          <Pill color={C.red} size={40}>加上大户型</Pill>
        </div>
        {SIZES2.map(([a, at], i) => (
          <Shirt key={a} t={t} at={at} x={220 + i * 290} y={1016} area={a} color={SHIRT_COL2[i]} s={1.18 + i * 0.06} />
        ))}
      </Block>

      {/* A3 集卡册 */}
      <Block t={t} at={22.4} out={28.55} enter="zoom" exit="up" ox={540} oy={850} cam={[[22.4, 1, 540, 850], [26.4, 1.04, 540, 820], [27.4, 1, 540, 900]]}>
        <div style={{ position: "absolute", left: 76, top: 578, width: 884, height: 528, borderRadius: 26, background: "#E7D9C2", boxShadow: "0 14px 0 #CDBB9E, 0 26px 40px rgba(70,50,20,0.18)" }} />
        {CARDS.map((a, i) => {
          const lit = clamp((t - (23.0 + i * 0.42)) / 0.25);
          const col = i < 5 ? C.green : C.orange;
          return (
            <div
              key={a}
              style={{
                position: "absolute",
                left: 100 + (i % 4) * 212,
                top: 600 + Math.floor(i / 4) * 250,
                width: 200,
                height: 232,
                borderRadius: 16,
                background: lit > 0.5 ? C.card : "rgba(255,253,248,0.35)",
                border: lit > 0.5 ? `4px solid ${col}` : "4px dashed rgba(24,61,51,0.25)",
                boxShadow: lit > 0.5 ? "0 8px 18px rgba(70,50,20,0.2)" : undefined,
                transform: `scale(${bump(t, 23.0 + i * 0.42, 0.1)}) rotateY(${(1 - lit) * 90}deg)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {lit > 0.5 && (
                <>
                  <svg width={70} height={56} viewBox="0 0 48 40">
                    <path d="M4 18 L24 4 L44 18 V36 H4 Z" fill="none" stroke={col} strokeWidth={3.5} strokeLinejoin="round" />
                    <rect x={19} y={23} width={10} height={13} fill={col} />
                  </svg>
                  <div style={{ fontFamily: NUM, fontSize: 64, color: C.text, lineHeight: 1 }}>{a}</div>
                  <div style={{ fontFamily: SANS, fontSize: 34, color: C.sub }}>平</div>
                </>
              )}
            </div>
          );
        })}
        <Stamp t={t} at={26.62} x={540} y={845} size={90} color={C.green} rot={-8}>基本集齐</Stamp>
        <Kinetic t={t} at={27.55} x={380} y={1190} text="特殊户型" kind="strike" size={64} />
        <div style={{ position: "absolute", left: 600, top: 1152, opacity: kIn(t, 28.0, 0.3), transform: `scale(${kPop(t, 28.0)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.red} size={44}>没有特例</Pill>
        </div>
      </Block>

    </>
  );
};
