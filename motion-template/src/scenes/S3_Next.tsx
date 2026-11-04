// 62.95–87.45 第二样：看他走了之后，你还等不等得到下一个
// （甩镜横推）排队格子：第一位买家离开，后面的格子全是虚线问号 →（下落）挂牌照片一张张砸进库存堆、“↑两成多”，漏斗只滴出一颗“成交 <1%”
// →（圆形收拢）100 个小人点阵：先剩十个，镜头推进，再只剩一个坐下来谈 →（斜擦）B小区实拍、出价单 97 万、房主心里话、
// “没卖”印章、价签滚到 39.8 万 →（放大穿越）门口：买家推门走掉，门关上，下一位是虚线人影“不一定出得更多”
import React from "react";
import { Img, staticFile } from "remotion";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Stamp, Title } from "../kit";
import { Block, Odo, Snap } from "../parts2";
import { Walker } from "../parts3";
import { Big, Fig, PAPER, Pill, QMark, Tag, bump, kIn, kPop, tw } from "../parts4";

const PILE = ["p05", "p08", "p11", "p12", "p14", "p15", "p20", "p21"];

/** 虚线人影 */
const Ghost: React.FC<{ s?: number; c?: string }> = ({ s = 1, c = C.muted }) => (
  <svg width={90 * s} height={150 * s} viewBox="0 0 60 100" style={{ display: "block", overflow: "visible" }}>
    <circle cx={30} cy={16} r={12} fill="none" stroke={c} strokeWidth={2.4} strokeDasharray="4 4" />
    <path d="M12 94 V62 C12 38 19 31 30 31 C41 31 48 38 48 62 V94" fill="none" stroke={c} strokeWidth={2.4} strokeDasharray="4 4" />
  </svg>
);

export const S3_Next: React.FC<{ t: number }> = ({ t }) => {
  if (t < 62.8 || t > 88.2) return null;

  /* C2 点阵 */
  const keep10 = clamp((t - 72.35) / 0.5);
  const keep1 = clamp((t - 74.1) / 0.5);
  const isTen = (i: number) => [3, 17, 28, 34, 45, 52, 66, 71, 83, 97].includes(i);
  const ONE = 45;

  /* C3 价签滚动 97 → 39.8 */
  const drop = E.inOutCubic(clamp((t - 81.3) / 0.75));
  const price = lerp(97, 39.8, drop);

  /* C4 门 */
  const doorClose = E.inOutCubic(clamp((t - 85.0) / 0.35));

  return (
    <>
      <Title
        t={t}
        items={[
          [63.1, 66.9, "第二样", "他走了之后\n你还等得到下一个吗", C.green],
          [67.0, 75.45, "本地现在", "挂的人多了\n肯谈的人少了", C.green],
          [75.6, 82.2, "B小区 · 一套房", "出到97万没卖\n现在挂39万8", C.red],
          [82.3, 87.35, "你嫌他砍得狠", "可他一走\n下一个未必出得多", C.green],
        ]}
      />

      {/* C0 排队格子 */}
      <Block t={t} at={62.95} out={66.95} enter="slideL" exit="drop" cam={[[62.95, 1, 540, 880], [66.9, 1.05, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 620, width: 880, height: 500, ...PAPER }} />
        <div style={{ position: "absolute", left: 130, top: 650, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub }}>来谈价的买家</div>
        {[0, 1, 2, 3].map((i) => {
          const x = 140 + i * 205;
          const k = kPop(t, 63.2 + i * 0.12, 0.4, 1.6);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 730, width: 180, height: 300, borderRadius: 18, border: `3px ${i === 0 ? "solid" : "dashed"} ${i === 0 ? C.green : "rgba(24,61,51,0.25)"}`, background: i === 0 ? "rgba(42,140,95,0.07)" : "transparent", transform: `scale(${k})`, opacity: clamp(k * 2) }}>
              <div style={{ position: "absolute", left: 14, top: 10, fontFamily: NUM, fontWeight: 700, fontSize: 30, color: i === 0 ? C.green : C.muted }}>{`No.${i + 1}`}</div>
              <div style={{ position: "absolute", left: 45, top: 90 }}>{i === 0 ? null : <Ghost s={1} />}</div>
              {i > 0 && <QMark t={t} at={65.9 + i * 0.15} x={90} y={170} size={80} />}
            </div>
          );
        })}
        <Walker t={t} x0={230} x1={230} x2={-120} y={1015} inA={63.0} inB={63.05} turn={63.7} outB={64.7} s={1.05} color={C.green} label="这一位" />
        <div style={{ position: "absolute", left: 140, top: 1045, opacity: kIn(t, 64.6, 0.3) }}>
          <Pill color={C.red} size={30} solid={false}>走了</Pill>
        </div>
      </Block>

      {/* C1 库存堆 + 漏斗 */}
      <Block t={t} at={66.98} out={71.62} enter="drop" exit="iris" ox={540} oy={880} cam={[[66.98, 1, 540, 880], [71.6, 1.04, 560, 900]]}>
        {/* 库存堆 */}
        {PILE.map((src, i) => {
          const at = 67.25 + i * 0.2;
          if (t < at) return null;
          const k = E.outBack(clamp((t - at) / 0.32), 1.2);
          const x = 110 + (i % 2) * 40 + Math.sin(i * 2.3) * 20;
          const y = 1010 - i * 46;
          return (
            <div key={src} style={{ position: "absolute", left: x, top: y - (1 - k) * 700, width: 300, height: 170, background: "#fff", padding: 6, boxShadow: "0 8px 14px rgba(60,40,20,0.22)", transform: `rotate(${Math.sin(i * 1.7) * 7}deg)` }}>
              <Img src={staticFile(`clips/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", right: 10, top: 10 }}>
                <Pill color={C.orange} size={20}>挂牌</Pill>
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 120, top: 1150, transform: `scale(${kPop(t, 68.85, 0.4, 2) * bump(t, 69.25)})`, transformOrigin: "0% 50%", opacity: clamp(kPop(t, 68.85) * 2) }}>
          <Pill color={C.orange} size={42}>库存 ↑ 两成多</Pill>
        </div>
        {/* 漏斗 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 69.3, 0.35) }}>
          <path d="M560 660 H940 L790 900 V1040 H710 V900 Z" fill="rgba(24,61,51,0.06)" stroke={C.text} strokeWidth={4} strokeLinejoin="round" />
          {Array.from({ length: 9 }).map((_, i) => {
            const ph = ((t - 69.5) * 1.2 + i / 9) % 1;
            const x = lerp(600 + (i % 3) * 120, 750, ph);
            const y = lerp(640, 900, ph);
            return t > 69.5 ? <rect key={i} x={x - 22} y={y - 14} width={44} height={28} rx={5} fill={C.orange} opacity={(1 - ph) * 0.9} /> : null;
          })}
        </svg>
        {t > 70.6 && (
          <div style={{ position: "absolute", left: 750, top: tw(t, 70.6, 71.0, 1000, 1070, E.outCubic), transform: `translateX(-50%) scale(${kPop(t, 70.6, 0.35, 2)})` }}>
            <Pill color={C.green} size={36}>成交 不到1%</Pill>
          </div>
        )}
        <div style={{ position: "absolute", left: 600, top: 610, fontFamily: SANS, fontSize: 24, color: C.muted, opacity: kIn(t, 69.4, 0.3) }}>能转成交的（口播数据）</div>
      </Block>

      {/* C2 点阵：少数里面的少数 */}
      <Block
        t={t}
        at={71.64}
        out={75.5}
        enter="iris"
        exit="wipe"
        ox={540}
        oy={880}
      >
        <div style={{ position: "absolute", left: 90, top: 580, width: 880, height: 600, ...PAPER }} />
        {/* 点阵装在版心里推镜：只在纸面内放大，不盖标题和圆环 */}
        <div style={{ position: "absolute", left: 90, top: 580, width: 880, height: 600, overflow: "hidden", borderRadius: 20 }}>
        <div style={{ position: "absolute", left: -90, top: -580, width: 1080, height: 1920, transformOrigin: `${140 + (ONE % 10) * 84 + 30}px ${610 + Math.floor(ONE / 10) * 56 + 26}px`, transform: `scale(${1 + 1.6 * E.inOutCubic(clamp((t - 73.9) / 0.75))})` }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const x = 140 + (i % 10) * 84;
          const y = 610 + Math.floor(i / 10) * 56;
          const k = kPop(t, 71.7 + (i % 10) * 0.03 + Math.floor(i / 10) * 0.03, 0.3, 1.6);
          const ten = isTen(i);
          let op = 1;
          if (!ten) op = lerp(1, 0.12, keep10);
          else if (i !== ONE) op = lerp(1, 0.18, keep1);
          const col = i === ONE && keep1 > 0.5 ? C.orange : ten && keep10 > 0.5 ? C.green : C.text;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${k * (i === ONE ? bump(t, 74.3, 0.2) : 1)})`, opacity: op }}>
              <svg width={60} height={52} viewBox="0 0 60 52">
                <circle cx={30} cy={13} r={10} fill={col} />
                <path d="M14 50 C14 32 20 26 30 26 C40 26 46 32 46 50 Z" fill={col} />
              </svg>
            </div>
          );
        })}
        </div>
        </div>
        <div style={{ position: "absolute", left: 640, top: 1110, opacity: kIn(t, 72.5, 0.3) * (1 - keep1) }}>
          <Pill color={C.green} size={30}>肯坐下来谈的</Pill>
        </div>
        {/* 只剩一个：坐下来谈的那位 */}
        <div style={{ position: "absolute", left: 540, top: 1040, transform: `translateX(-50%) scale(${kPop(t, 74.55, 0.4, 2)})`, opacity: clamp(kPop(t, 74.55) * 2) }}>
          <Pill color={C.orange} size={40}>少数里面的少数</Pill>
        </div>
      </Block>

      {/* C3 B小区 */}
      <Block t={t} at={75.52} out={82.22} enter="wipe" exit="zoomOut" cam={[[75.52, 1, 540, 880], [80.5, 1, 540, 880], [82.2, 1.06, 560, 900]]}>
        <Snap t={t} at={75.65} x={90} y={570} w={520} h={340} src="p10" rot={-3} caption="B小区" />
        {/* 出价单 */}
        <div style={{ position: "absolute", left: 630, top: 600, width: 320, height: 300, ...PAPER, border: `3px solid ${C.green}`, transform: `rotate(3deg) translateX(${(1 - kPop(t, 77.55, 0.5, 1.4)) * 500}px)`, opacity: lerp(1, 0.6, kIn(t, 80.5, 0.3)) }}>
          <div style={{ position: "absolute", left: 26, top: 22, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.green }}>有人出到</div>
          <div style={{ position: "absolute", left: 26, top: 80 }}>
            <Big v="97" unit="万" size={110} color={C.text} />
          </div>
          <div style={{ position: "absolute", left: 26, top: 230, fontFamily: SANS, fontSize: 26, color: C.muted }}>买家出价单</div>
        </div>
        <Stamp t={t} at={80.5} x={850} y={845} color={C.red} size={60} rot={-12}>
          没卖
        </Stamp>
        {/* 房主心里话 */}
        <div style={{ position: "absolute", left: 110, top: 990, transform: `scale(${kPop(t, 78.7, 0.45, 1.8)})`, transformOrigin: "10% 0%", opacity: clamp(kPop(t, 78.7) * 2) * (1 - kIn(t, 81.1, 0.3)) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Fig s={0.75} c={C.deep} mood="smile" />
            <div style={{ ...PAPER, borderRadius: 40, padding: "14px 30px 18px", fontFamily: SERIF, fontSize: 50, color: C.text, whiteSpace: "nowrap" }}>“我的房子不止这个价”</div>
          </div>
        </div>
        {/* 现在挂到 */}
        {t > 81.1 && (
          <div style={{ position: "absolute", left: 140, top: lerp(960, 1010, drop), transform: `scale(${kPop(t, 81.1, 0.35, 1.6) * bump(t, 82.05, 0.1)})`, transformOrigin: "0% 50%" }}>
            <Tag
              color={drop > 0.6 ? C.red : C.deep}
              size={56}
              text={
                <>
                  现在挂到&nbsp;
                  <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 80 }}>{price.toFixed(1)}</span>
                  <span style={{ fontSize: 40 }}>万</span>
                </>
              }
            />
          </div>
        )}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: kIn(t, 81.4, 0.3) }}>
          <path d="M800 910 C 900 960, 920 1030, 820 1090" stroke={C.red} strokeWidth={6} fill="none" strokeDasharray="10 10" strokeLinecap="round" />
          <path d="M836 1068 L818 1092 L846 1098" stroke={C.red} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Block>

      {/* C4 门口：他一走，下一个未必出得多 */}
      <Block t={t} at={82.25} out={87.4} enter="zoom" exit="slideL" cam={[[82.25, 1.05, 520, 880], [84.9, 1, 520, 880], [87.4, 1, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 590, width: 880, height: 570, ...PAPER }} />
        {/* 门框 */}
        <div style={{ position: "absolute", left: 640, top: 640, width: 220, height: 420, background: "#2C3E50", borderRadius: "12px 12px 0 0" }} />
        <div style={{ position: "absolute", left: 640, top: 640, width: 220, height: 420, background: "#C9A26B", borderRadius: "12px 12px 0 0", transformOrigin: "100% 50%", transform: `perspective(900px) rotateY(${lerp(-70, 0, doorClose)}deg)`, boxShadow: "inset 0 0 0 10px #B88C55" }}>
          <div style={{ position: "absolute", left: 24, top: 210, width: 18, height: 18, borderRadius: 9, background: "#F6D27A" }} />
        </div>
        <div style={{ position: "absolute", left: 620, top: 1060, width: 260, height: 8, background: C.text, borderRadius: 4 }} />
        {/* 砍得狠的那位：出价 97 万 */}
        <Walker t={t} x0={300} x1={330} x2={760} y={1060} inA={82.3} inB={82.8} turn={83.9} outB={84.95} s={1.45} color={C.green} label="出 97 万的他" />
        <div style={{ position: "absolute", left: 150, top: 640, opacity: kIn(t, 82.4, 0.3) * (1 - kIn(t, 83.8, 0.3)) }}>
          <Pill color={C.red} size={34} solid={false}>嫌他砍得狠</Pill>
        </div>
        {/* 下一个 */}
        <div style={{ position: "absolute", left: 240, top: 840, opacity: kIn(t, 85.3, 0.4) }}>
          <Ghost s={1.5} />
        </div>
        <QMark t={t} at={85.6} x={310} y={800} size={100} />
        <div style={{ position: "absolute", left: 130, top: 640, display: "flex", flexDirection: "column", gap: 14, opacity: kIn(t, 85.5, 0.35) }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub }}>下一个来的人</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${kPop(t, 86.5, 0.4, 2)})`, transformOrigin: "0% 50%" }}>
            <span style={{ fontFamily: SERIF, fontSize: 54, color: C.text }}>出价</span>
            <span style={{ fontFamily: NUM, fontWeight: 800, fontSize: 64, color: C.red }}>≤ ?</span>
          </div>
        </div>
      </Block>
    </>
  );
};
