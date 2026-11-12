// 35.85–53.05 缺点①：物业收费
// （斜擦）手机评论区，示例评论一条条冒出来“物业管理不善 / 物业费收得不服 / 刷到了”，“刷到”时手指一划 →（下落）停车场：服务铃 + 硬币，
// 小车开到道闸、投币抬杆，“理所当然”章 →（横推）停车小票一张张叠起来，都盖“免费” →（圆形展开）三个小人摇头“不愿意”
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Stamp, Title } from "../kit";
import { Block, Bubble } from "../parts2";
import { Fig, PAPER, Pill, bump, kIn, kPop } from "../parts4";

/** 示例评论：[头像字, 内容, 出现时间, 头像底色] */
const COMMENTS: [string, string, number, string][] = [
  ["王", "物业管理不善！", 38.1, "#D9483B"],
  ["李", "物业费收得不服", 39.5, "#E07A35"],
  ["张", "这事我也刷到了", 41.85, "#2A8C5F"],
];

const Coin: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <div style={{ position: "absolute", left: x - 30 * s, top: y - 30 * s, width: 60 * s, height: 60 * s, borderRadius: "50%", background: "#F2C14E", border: `${5 * s}px solid #D9A22E`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: NUM, fontSize: 34 * s, color: "#9A6B12", boxShadow: "0 6px 10px rgba(80,50,10,0.25)" }}>¥</div>
);

const Car: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <svg width={260 * s} height={130 * s} viewBox="0 0 260 130" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <path d="M20 90 V62 L60 56 L90 22 H180 L215 56 L245 64 V90 Z" fill={C.orange} stroke="#B95F24" strokeWidth={4} strokeLinejoin="round" />
    <path d="M98 30 H140 V56 H74 Z M148 30 H176 L204 56 H148 Z" fill="#CFE3DA" />
    <circle cx={70} cy={96} r={22} fill="#2F3A3D" />
    <circle cx={70} cy={96} r={9} fill="#C9CED0" />
    <circle cx={196} cy={96} r={22} fill="#2F3A3D" />
    <circle cx={196} cy={96} r={9} fill="#C9CED0" />
  </svg>
);

/** 摇头的小人 */
const Shaker: React.FC<{ t: number; at: number; x: number; y: number; c: string; ph: number }> = ({ t, at, x, y, c, ph }) => {
  const k = kPop(t, at, 0.4, 1.6);
  if (k <= 0) return null;
  const shake = t > 51.8 ? Math.sin((t - 51.8) * 18 + ph) * 10 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${k}) rotate(${shake}deg)`, transformOrigin: "50% 100%" }}>
      <Fig s={2.25} c={c} mood={t > 51.8 ? "sad" : "flat"} />
    </div>
  );
};

export const S2_Fee: React.FC<{ t: number }> = ({ t }) => {
  if (t < 35.8 || t > 53.6) return null;
  /* 信息流滚动：37.0 新闻卡滚到中间，41.96 “刷到”手指一划 */
  const swipe = clamp((t - 41.75) / 0.6);
  /* 停车场 */
  const carX = lerp(-360, 290, E.outCubic(clamp((t - 46.2) / 0.75)));
  const bar = E.outBack(clamp((t - 47.3) / 0.4), 1.4);
  const coin1 = clamp((t - 45.2) / 0.4);
  const coin2 = clamp((t - 46.95) / 0.38);
  const bell = t > 44.6 ? Math.sin((t - 44.6) * 30) * 14 * Math.exp(-(t - 44.6) * 5) : 0;
  return (
    <>
      <Title
        t={t}
        items={[
          [35.92, 42.55, "缺点 ①", "物业收费\n有人不服", C.red],
          [42.7, 50.6, "主播认为", "做了服务\n就该给钱", C.green],
          [50.68, 52.95, "当然", "有些业主\n肯定不愿意", C.orange],
        ]}
      />

      {/* C 手机信息流 */}
      <Block t={t} at={35.9} out={42.55} enter="wipe" exit="drop" ox={540} oy={900} cam={[[35.9, 1, 540, 900], [39.4, 1.04, 540, 860], [42.5, 1, 540, 900]]}>
        <div style={{ position: "absolute", left: 300, top: 575, width: 520, height: 700, borderRadius: 52, background: "#26302F", boxShadow: "0 24px 50px rgba(30,20,10,0.35)" }}>
          <div style={{ position: "absolute", left: 16, top: 16, right: 16, bottom: 16, borderRadius: 40, background: "#F7F3EC", overflow: "hidden" }}>
            {/* 顶栏：评论区（示例） */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 86, background: "#fff", borderBottom: "2px solid rgba(24,61,51,0.08)", display: "flex", alignItems: "center", padding: "0 26px", gap: 12 }}>
              <span style={{ fontFamily: SERIF, fontSize: 40, color: C.text }}>评论</span>
              <span style={{ fontFamily: SANS, fontSize: 26, color: C.muted, border: `2px solid ${C.muted}`, borderRadius: 8, padding: "0 8px 2px" }}>示例</span>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 108 }}>
              {COMMENTS.map(([who, txt, at, col], i) => {
                const k = E.outBack(clamp((t - at) / 0.35), 1.6);
                if (t < at) return null;
                return (
                  <div key={i} style={{ display: "flex", gap: 12, margin: "0 14px 34px", alignItems: "flex-start", opacity: clamp(k * 3), transform: `translateX(${(1 - k) * -60}px)` }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: col, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 34, color: "#fff" }}>{who}</div>
                    <div style={{ background: "#fff", borderRadius: 18, padding: "10px 18px 14px", boxShadow: "0 6px 14px rgba(60,40,20,0.12)" }}>
                      <div style={{ fontFamily: SANS, fontSize: 28, color: C.muted }}>业主</div>
                      <div style={{ fontFamily: SERIF, fontSize: 48, color: C.text, whiteSpace: "nowrap" }}>{txt}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* 手指一划 */}
        {swipe > 0 && swipe < 1 && (
          <div style={{ position: "absolute", left: 640, top: lerp(1150, 760, E.inOutCubic(swipe)), width: 70, height: 70, borderRadius: "50%", background: "rgba(24,61,51,0.35)", border: "4px solid #fff", opacity: Math.sin(swipe * Math.PI) }} />
        )}
        <div style={{ position: "absolute", left: 230, top: 1180, opacity: kIn(t, 42.1, 0.3), transform: `scale(${kPop(t, 42.1)})`, transformOrigin: "50% 50%" }}>
          <Pill color={C.deep} size={44}>大家应该都刷到了</Pill>
        </div>
      </Block>

      {/* D1 停车场：服务 → 给钱，停车 → 给钱 */}
      <Block t={t} at={42.66} out={48.72} enter="drop" exit="slideL" ox={540} oy={900} cam={[[42.66, 1.05, 330, 820], [45.7, 1.05, 330, 820], [46.6, 1, 540, 920], [48.7, 1.03, 600, 940]]}>
        {/* 服务铃 + 第一枚硬币 */}
        <div style={{ position: "absolute", left: 110, top: 600, opacity: kIn(t, 44.1, 0.35) }}>
          <div style={{ ...PAPER, width: 470, height: 250, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", whiteSpace: "nowrap" }}>
            <svg width={120} height={110} viewBox="0 0 60 55" style={{ transform: `rotate(${bell}deg)`, transformOrigin: "50% 90%" }}>
              <circle cx={30} cy={8} r={4} fill={C.orange} />
              <path d="M8 44 C8 24, 18 14, 30 14 C42 14, 52 24, 52 44 Z" fill={C.orange} />
              <rect x={2} y={44} width={56} height={8} rx={4} fill="#B95F24" />
            </svg>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 52, color: C.text }}>做了服务</div>
              <div style={{ fontFamily: SANS, fontSize: 42, color: C.green, marginTop: 6, opacity: kIn(t, 45.2, 0.3) }}>→ 要给钱</div>
            </div>
          </div>
        </div>
        {coin1 > 0 && coin1 < 1 && <Coin x={lerp(760, 420, coin1)} y={lerp(560, 700, coin1) - Math.sin(coin1 * Math.PI) * 120} s={1.1} />}
        {/* 地面 + P 位 + 道闸 */}
        <div style={{ position: "absolute", left: 60, top: 1180, width: 900, height: 10, background: "#5E6B6F", borderRadius: 5 }} />
        <div style={{ position: "absolute", left: 300, top: 1192, width: 320, height: 60, border: "4px dashed rgba(24,61,51,0.35)", borderTop: "none", fontFamily: SERIF, fontSize: 44, color: C.green, textAlign: "center" }}>P</div>
        <div style={{ position: "absolute", left: 700, top: 980, width: 44, height: 200, background: "#5E6B6F", borderRadius: 8 }} />
        <div style={{ position: "absolute", left: 720, top: 990, width: 230, height: 22, borderRadius: 11, background: `repeating-linear-gradient(90deg, ${C.red} 0 30px, #fff 30px 60px)`, transformOrigin: "0 50%", transform: `rotate(${-80 * clamp(bar)}deg)` }} />
        <div style={{ position: "absolute", left: 660, top: 900, width: 124, height: 70, borderRadius: 12, background: C.deep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 28, color: "#fff", transform: `scale(${bump(t, 47.25, 0.12)})` }}>
          停车费
        </div>
        {coin2 > 0 && coin2 < 1 && <Coin x={lerp(520, 722, coin2)} y={lerp(1000, 930, coin2) - Math.sin(coin2 * Math.PI) * 140} />}
        <Car x={carX} y={1032} s={1.25} />
        <div style={{ position: "absolute", left: 230, top: 880, opacity: kIn(t, 46.4, 0.3) * (1 - kIn(t, 47.9, 0.2)), transform: `scale(${kPop(t, 46.4)})`, transformOrigin: "50% 100%" }}>
          <Pill color={C.orange} size={44}>停了车 → 要给钱</Pill>
        </div>
        <Stamp t={t} at={48.1} x={520} y={940} size={80} color={C.green} rot={-7}>理所当然</Stamp>
      </Block>

      {/* D2 之前免费停的小票 */}
      <Block t={t} at={48.72} out={50.6} enter="slideL" exit="fade" ox={540} oy={900}>
        {Array.from({ length: 6 }).map((_, i) => {
          const at = 48.9 + i * 0.2;
          const k = E.outBack(clamp((t - at) / 0.3), 1.3);
          if (t < at) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 110 + (i % 2) * 30, top: 1090 - i * 72 - (1 - k) * 300, width: 430, height: 160, transform: `rotate(${(i % 3) * 3 - 3}deg)`, ...PAPER, borderRadius: 10, display: "flex", alignItems: "center", gap: 20, padding: "0 26px" }}>
              <div style={{ fontFamily: SERIF, fontSize: 52, color: C.green }}>P</div>
              <div style={{ fontFamily: SANS, fontSize: 30, color: C.sub }}>停车小票</div>
              <div style={{ marginLeft: "auto", fontFamily: SERIF, fontSize: 40, color: C.green, border: `4px solid ${C.green}`, borderRadius: 10, padding: "0 12px 4px", transform: "rotate(-10deg)" }}>免费</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 640, top: 740, opacity: kIn(t, 49.6, 0.3), transform: `scale(${kPop(t, 49.6)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.green} size={46}>之前</Pill>
        </div>
        <div style={{ position: "absolute", left: 560, top: 840, opacity: kIn(t, 49.9, 0.3), transform: `scale(${kPop(t, 49.9)})`, transformOrigin: "0 50%" }}>
          <Pill color={C.deep} size={46}>免费停了那么多</Pill>
        </div>
      </Block>

      {/* D3 有些业主不愿意 */}
      <Block t={t} at={50.6} out={52.95} enter="iris" exit="fade" ox={540} oy={950}>
        <Shaker t={t} at={50.8} x={140} y={830} c={C.deep} ph={0} />
        <Shaker t={t} at={51.0} x={430} y={810} c={C.orange} ph={1.3} />
        <Shaker t={t} at={51.2} x={720} y={830} c={"#4E9C7A"} ph={2.6} />
        <Bubble t={t} at={52.3} x={520} y={790} text="不愿意！" color={C.red} />
      </Block>
    </>
  );
};
