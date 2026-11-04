// 132.48–146.72 所以先别急着回他，先问三句
// （圆形展开）手机对话框：你已经打出“行吧，那就……”，说到“别急”时字一个个删掉，发送键被按住 →
// 一条横向长舞台，镜头先拉远再横移到下一站：① 卷尺量“他的出价”到“同小区真实成交”的距离 → ② 雷达扫一圈：
// 先扫出“备选”光点，说到“随口试探”光点全灭只剩一句“随便问问” → ③ 三个月的时间轴，沙漏人一步步往前走，尽头是虚线的“第二个出价的人”
import React from "react";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { IHourglass, Title } from "../kit";
import { Block } from "../parts2";
import { Fig, PAPER, Pill, QMark, bump, kIn, kPop, tw } from "../parts4";

const TYPED = "行吧，那就这个价……";

/** 舞台镜头：横向位置（第几站）与缩放；站与站之间先拉远再推近 */
const STOPS: [number, number][] = [
  [134.5, 0],
  [138.7, 0],
  [139.4, 1],
  [141.45, 1],
  [142.15, 2],
];
const stageAt = (t: number) => {
  let x = 0;
  let s = 1;
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, xa] = STOPS[i];
    const [b, xb] = STOPS[i + 1];
    if (t >= a && t <= b && xa !== xb) {
      const k = E.inOutCubic((t - a) / (b - a));
      x = lerp(xa, xb, k);
      s = 1 - 0.14 * Math.sin(k * Math.PI);
      return { x, s };
    }
    if (t > b) x = xb;
  }
  return { x, s };
};

export const S6_Ask: React.FC<{ t: number }> = ({ t }) => {
  if (t < 132.3 || t > 147.4) return null;

  /* F0 打字 → 删掉 */
  const typedN = Math.floor(clamp((t - 132.75) / 0.8) * TYPED.length);
  const delN = Math.floor(clamp((t - 133.55) / 0.5) * TYPED.length);
  const shown = TYPED.slice(0, Math.max(0, typedN - delN));
  const caret = Math.floor(t * 3) % 2 === 0;

  /* 舞台 */
  const { x: stop, s: zoom } = stageAt(t);
  const panX = stop * 1080;

  /* ① 卷尺 */
  const tape = E.inOutCubic(clamp((t - 136.4) / 1.1));
  /* ② 雷达 */
  const sweep = (t - 138.9) * 240;
  const dotsOff = clamp((t - 140.5) / 0.3);
  /* ③ 时间轴 */
  const walk = E.inOutCubic(clamp((t - 142.5) / 2.6));

  return (
    <>
      <Title
        t={t}
        items={[
          [132.65, 134.45, "所以", "先别急着回他", C.green],
          [134.55, 138.7, "先问一", "他这个价离同小区\n真实成交差多少", C.green],
          [138.8, 141.45, "先问二", "他是真有备选\n还是随口试探", C.green],
          [141.55, 146.6, "先问三", "他走了之后三个月\n等得到下一个吗", C.green],
        ]}
      />

      {/* F0 手机 */}
      <Block t={t} at={132.5} out={134.48} enter="iris" exit="zoomOut" ox={880} oy={360} cam={[[132.5, 1, 540, 880], [134.4, 1.04, 540, 940]]}>
        <div style={{ position: "absolute", left: 230, top: 570, width: 620, height: 600, borderRadius: 50, background: "#1F2A2A", padding: 16, boxSizing: "border-box", boxShadow: "0 24px 44px rgba(30,30,20,0.3)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 38, background: "#F2F4F1", position: "relative", overflow: "hidden" }}>
            <div style={{ height: 70, background: "#E4E8E3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.text }}>买家</div>
            <div style={{ position: "absolute", left: 24, top: 100, display: "flex", alignItems: "center", gap: 10, transform: `scale(${kPop(t, 132.55, 0.4, 2)})`, transformOrigin: "0% 50%" }}>
              <div style={{ background: "#fff", borderRadius: "6px 24px 24px 24px", padding: "14px 22px", fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.text, boxShadow: "0 4px 10px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>就这个价，行就定</div>
            </div>
            {/* 输入框 */}
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 24, height: 90, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, height: 80, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.text, whiteSpace: "nowrap", overflow: "hidden" }}>
                {shown}
                <span style={{ width: 3, height: 38, background: C.green, marginLeft: 2, opacity: caret ? 1 : 0 }} />
              </div>
              <div style={{ width: 120, height: 80, borderRadius: 18, background: t > 133.55 ? "#B7BFBB" : C.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#fff" }}>发送</div>
            </div>
            {/* 按住发送键 */}
            <div style={{ position: "absolute", right: 30, bottom: 120, transform: `scale(${kPop(t, 133.55, 0.4, 2.2)})`, transformOrigin: "100% 100%", opacity: clamp(kPop(t, 133.55) * 2) }}>
              <Pill color={C.red} size={34}>✋ 先别急</Pill>
            </div>
          </div>
        </div>
      </Block>

      {/* 三站横向舞台 */}
      <Block t={t} at={134.5} out={146.65} enter="zoom" exit="iris" ox={540} oy={880}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 3240, height: 1920, transformOrigin: `${panX + 540}px 880px`, transform: `translateX(${-panX}px) scale(${zoom})` }}>
          {/* 舞台底下贯穿的路线 */}
          <svg width={3240} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d="M120 1140 H3120" stroke="rgba(24,61,51,0.18)" strokeWidth={4} strokeDasharray="14 14" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <circle cx={540 + i * 1080} cy={1140} r={22} fill={i <= stop + 0.01 ? C.green : C.card} stroke={C.green} strokeWidth={4} />
                <text x={540 + i * 1080} y={1149} textAnchor="middle" fontFamily={NUM} fontWeight={700} fontSize={24} fill={i <= stop + 0.01 ? "#fff" : C.green}>{`${i + 1}`}</text>
              </g>
            ))}
          </svg>

          {/* ① 卷尺：出价 ↔ 同小区真实成交 */}
          <div style={{ position: "absolute", left: 90, top: 600, width: 880, height: 500, ...PAPER }} />
          <div style={{ position: "absolute", left: 150, top: 660, opacity: kIn(t, 134.9, 0.3) }}>
            <Pill color={C.orange} size={34}>他的出价</Pill>
          </div>
          <div style={{ position: "absolute", left: 600, top: 660, opacity: kIn(t, 136.1, 0.3) }}>
            <Pill color={C.green} size={34}>同小区真实成交</Pill>
          </div>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={240} y1={740} x2={240} y2={1010} stroke={C.orange} strokeWidth={5} strokeDasharray="8 8" opacity={kIn(t, 135.0, 0.3)} />
            <line x1={760} y1={740} x2={760} y2={1010} stroke={C.green} strokeWidth={5} strokeDasharray="8 8" opacity={kIn(t, 136.2, 0.3)} />
            {/* 卷尺盒 + 尺带 */}
            <rect x={150} y={880} width={110} height={110} rx={24} fill="#F2C14E" stroke="#C9962B" strokeWidth={5} opacity={kIn(t, 136.2, 0.3)} />
            <circle cx={205} cy={935} r={22} fill="#C9962B" opacity={kIn(t, 136.2, 0.3)} />
            <rect x={258} y={950} width={502 * tape} height={34} fill="#F6D27A" stroke="#C9962B" strokeWidth={3} />
            {Array.from({ length: 25 }).map((_, i) =>
              258 + i * 20 < 258 + 502 * tape ? <line key={i} x1={258 + i * 20} y1={950} x2={258 + i * 20} y2={i % 5 === 0 ? 972 : 962} stroke="#8A6A1E" strokeWidth={2} /> : null,
            )}
          </svg>
          <div style={{ position: "absolute", left: 500, top: 830, transform: `translateX(-50%) scale(${kPop(t, 137.9, 0.4, 2) * bump(t, 138.3)})`, opacity: clamp(kPop(t, 137.9) * 2), fontFamily: SERIF, fontSize: 64, color: C.red, whiteSpace: "nowrap" }}>差多少？</div>

          {/* ② 雷达：真有备选？还是随口试探？ */}
          <div style={{ position: "absolute", left: 1170, top: 600, width: 880, height: 500, ...PAPER }} />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 1080, top: 0, overflow: "visible" }}>
            <defs>
              <radialGradient id="radarG">
                <stop offset="0" stopColor="#1E4D3F" />
                <stop offset="1" stopColor="#183D33" />
              </radialGradient>
            </defs>
            <circle cx={400} cy={850} r={210} fill="url(#radarG)" />
            {[70, 140, 210].map((r) => (
              <circle key={r} cx={400} cy={850} r={r} fill="none" stroke="rgba(120,220,170,0.3)" strokeWidth={2} />
            ))}
            <line x1={190} y1={850} x2={610} y2={850} stroke="rgba(120,220,170,0.25)" strokeWidth={2} />
            <line x1={400} y1={640} x2={400} y2={1060} stroke="rgba(120,220,170,0.25)" strokeWidth={2} />
            <g transform={`rotate(${sweep} 400 850)`}>
              <path d="M400 850 L400 640 A210 210 0 0 1 548 701 Z" fill="rgba(120,220,170,0.35)" />
            </g>
            {[
              [330, 760, 139.35],
              [500, 800, 139.6],
              [460, 960, 139.85],
            ].map(([x, y, a], i) => (
              <circle key={i} cx={x} cy={y} r={14 * kPop(t, a, 0.3, 2)} fill="#9BF0C3" opacity={(1 - dotsOff) * (0.6 + 0.4 * Math.sin(t * 6 + i))} />
            ))}
          </svg>
          <div style={{ position: "absolute", left: 1720, top: 700, opacity: kIn(t, 139.4, 0.3) * (1 - dotsOff), display: "flex", flexDirection: "column", gap: 14 }}>
            <Pill color={C.green} size={32}>真有备选？</Pill>
          </div>
          <div style={{ position: "absolute", left: 1700, top: 870, transform: `scale(${kPop(t, 140.55, 0.4, 2)})`, transformOrigin: "0% 50%", opacity: clamp(kPop(t, 140.55) * 2) }}>
            <div style={{ ...PAPER, borderRadius: "24px 24px 24px 6px", padding: "12px 24px 16px", fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.text, whiteSpace: "nowrap" }}>“随便问问”</div>
            <div style={{ marginTop: 12 }}>
              <Pill color={C.orange} size={30}>还是随口试探？</Pill>
            </div>
          </div>

          {/* ③ 三个月时间轴 */}
          <div style={{ position: "absolute", left: 2250, top: 600, width: 880, height: 500, ...PAPER }} />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 2160, top: 0, overflow: "visible" }}>
            <line x1={160} y1={960} x2={860} y2={960} stroke="rgba(24,61,51,0.25)" strokeWidth={10} strokeLinecap="round" />
            <line x1={160} y1={960} x2={160 + 700 * walk} y2={960} stroke={C.green} strokeWidth={10} strokeLinecap="round" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <circle cx={160 + i * 233} cy={960} r={14} fill={walk * 3 >= i - 0.01 ? C.green : C.card} stroke={C.green} strokeWidth={4} />
                {i > 0 && (
                  <text x={160 + i * 233} y={1020} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={30} fill={C.sub}>{`第${i}个月`}</text>
                )}
              </g>
            ))}
          </svg>
          <div style={{ position: "absolute", left: 2160 + 160 + 700 * walk - 45, top: 760, transform: `translateY(${Math.abs(Math.sin(t * 9)) * -8 * (walk > 0 && walk < 1 ? 1 : 0)}px)` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IHourglass s={70} k={walk} />
              <Fig s={0.8} c={C.deep} />
            </div>
          </div>
          {/* 尽头：第二个肯出价的人 */}
          <div style={{ position: "absolute", left: 2160 + 860 - 60, top: 760, opacity: kIn(t, 144.3, 0.35) }}>
            <svg width={100} height={170} viewBox="0 0 60 100" style={{ overflow: "visible" }}>
              <circle cx={30} cy={16} r={12} fill="none" stroke={C.orange} strokeWidth={2.6} strokeDasharray="4 4" />
              <path d="M12 94 V62 C12 38 19 31 30 31 C41 31 48 38 48 62 V94" fill="none" stroke={C.orange} strokeWidth={2.6} strokeDasharray="4 4" />
            </svg>
          </div>
          <QMark t={t} at={145.4} x={2160 + 860 - 10} y={720} size={90} />
          <div style={{ position: "absolute", left: 2160 + 380, top: 660, opacity: kIn(t, 145.3, 0.3), transform: `scale(${kPop(t, 145.3, 0.4, 1.8)})`, transformOrigin: "50% 50%" }}>
            <Pill color={C.orange} size={32}>第二个肯出价的人</Pill>
          </div>
          <div style={{ position: "absolute", left: 2160 + 160, top: 660, opacity: kIn(t, 142.4, 0.3) * (1 - kIn(t, 145.2, 0.3)) }}>
            <Pill color={C.deep} size={30} solid={false}>他走了之后</Pill>
          </div>
        </div>
      </Block>
    </>
  );
};
