// 6.5–27.72 开场痛点：
// （圆形展开）挂牌价长条沿虚线断下一截、放大镜凑过去看，“砍了多少”→“关系不大”被划掉 →（上推）左右两块：砍得狠≠欺负你 / 砍得少≠帮你
// →（横推）挂牌卡片+月份翻页，买家消息弹出，开口价短条与心里价的落差“一大截” →（斜擦）接/不接两个按钮，光标来回犹豫，
// 买家头顶翻牌“真心要买？/随口试探？”→（落下）夜里窗口：月亮、时钟、空中翻转的硬币（接/不接）
import React from "react";
import { Img, staticFile } from "remotion";
import { E, clamp, lerp } from "../engine/ease";
import { C } from "../engine/theme";
import { NUM, SANS, SERIF } from "../engine/fonts";
import { Title } from "../kit";
import { Block } from "../parts2";
import { Big, Fig, PAPER, Pill, bump, kIn, kPop, tw } from "../parts4";
import { Magnifier } from "../parts3";

/** 一根挂牌价长条：cut=被剁掉的比例（从右端），fall=剁下那截的下落进度 */
const PriceBar: React.FC<{ x: number; y: number; w: number; h?: number; cut: number; fall: number; color?: string; label?: string }> = ({ x, y, w, h = 92, cut, fall, color = C.deep, label }) => {
  const keep = w * (1 - cut);
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: keep, height: h, borderRadius: "16px 0 0 16px", background: color, boxShadow: "0 8px 0 rgba(0,0,0,0.12)" }}>
        {label && <div style={{ position: "absolute", left: 24, top: h * 0.2, fontFamily: SANS, fontWeight: 600, fontSize: h * 0.4, color: "#fff", whiteSpace: "nowrap" }}>{label}</div>}
      </div>
      {cut > 0 && (
        <div
          style={{
            position: "absolute",
            left: x + keep + 6,
            top: y,
            width: w * cut,
            height: h,
            borderRadius: "0 16px 16px 0",
            background: C.red,
            opacity: 1 - fall * 0.7,
            transform: `translate(${fall * 60}px, ${E.inCubic(fall) * 380}px) rotate(${fall * 24}deg)`,
            transformOrigin: "0% 0%",
          }}
        />
      )}
    </>
  );
};

/** 左右对比小面板：一根被剁掉 cut 的条 + 名称 + “≠ xx” */
const Panel: React.FC<{ t: number; at: number; neqAt: number; x: number; name: string; cut: number; color: string; neq: string }> = ({ t, at, neqAt, x, name, cut, color, neq }) => {
  const k = kPop(t, at, 0.5, 1.4);
  const chop = clamp((t - at - 0.35) / 0.12);
  const fall = E.inCubic(clamp((t - at - 0.47) / 0.6));
  const nk = kPop(t, neqAt, 0.36, 2.2);
  return (
    <div style={{ position: "absolute", left: x, top: 640, width: 420, height: 470, ...PAPER, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 80}px) scale(${lerp(0.85, 1, k)})` }}>
      <div style={{ position: "absolute", left: 30, top: 26, fontFamily: SERIF, fontSize: 58, color }}>{name}</div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 420, height: 470, overflow: "hidden", borderRadius: 20 }}>
        <PriceBar x={30} y={130} w={360} h={70} cut={cut * chop} fall={fall} color={C.deep} />
        <svg width={420} height={300} style={{ position: "absolute", left: 0, top: 110, overflow: "visible" }}>
          <path d={`M${30 + 360 * (1 - cut)} 0 V112`} stroke={color} strokeWidth={4} strokeDasharray="8 8" opacity={chop} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 30, top: 270, display: "flex", alignItems: "center", gap: 14, transform: `scale(${lerp(0.4, 1, nk)})`, transformOrigin: "0% 50%", opacity: clamp(nk * 2) }}>
        <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 110, color: C.red, lineHeight: 1 }}>≠</span>
        <span style={{ fontFamily: SERIF, fontSize: 64, color: C.text, whiteSpace: "nowrap" }}>{neq}</span>
      </div>
    </div>
  );
};

/** 翻牌：front→back 在 flip 秒翻过去 */
const FlipCard: React.FC<{ t: number; at: number; flip: number; x: number; y: number; front: string; back: string }> = ({ t, at, flip, x, y, front, back }) => {
  const k = kPop(t, at, 0.4, 1.8);
  const f = E.inOutCubic(clamp((t - flip) / 0.45));
  const showBack = f > 0.5;
  const ry = showBack ? (1 - f) * -180 : f * 180;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${k}) perspective(900px) rotateY(${ry}deg)`, opacity: clamp(k * 2) }}>
      <div style={{ ...PAPER, borderRadius: 18, padding: "16px 34px 20px", fontFamily: SERIF, fontSize: 56, color: showBack ? C.red : C.green, whiteSpace: "nowrap", border: `4px solid ${showBack ? C.red : C.green}` }}>{showBack ? back : front}</div>
    </div>
  );
};

export const S1_Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t < 6.4 || t > 28.4) return null;

  /* ---- A1 菜刀剁挂牌价 ---- */
  // 挂牌价长条：沿虚线断开，被砍掉的一截掉下去；放大镜飘过去看“砍了多少”
  const cutK = t >= 7.02 ? 1 : 0;
  const dash = kIn(t, 6.75, 0.25);
  const fall = E.inCubic(clamp((t - 7.12) / 0.7));
  const magK = E.outBack(clamp((t - 7.25) / 0.45), 1.4);
  const magX = lerp(1000, 820, magK) + Math.sin(t * 3) * 6;
  const magY = lerp(660, 815, magK);
  const brace = kIn(t, 7.35, 0.35);
  const strike = E.outCubic(clamp((t - 8.15) / 0.35));

  /* ---- A2 挂牌 + 开口价 ---- */
  const monthI = Math.floor(clamp((t - 14.45) / 0.85) * 5);
  const offerW = tw(t, 17.4, 17.9, 0, 360, E.outCubic);
  const gap = kIn(t, 18.85, 0.45);

  /* ---- A3 接 / 不接 ---- */
  const cx = t < 20.9 ? tw(t, 19.6, 19.95, 980, 300) : tw(t, 20.95, 21.35, 300, 730);
  const cy = t < 20.9 ? tw(t, 19.6, 19.95, 1250, 780) : 780;
  const press = (a: number) => (t > a && t < a + 0.25 ? 0.94 : 1);

  /* ---- A4 夜里抛硬币 ---- */
  const air = 25.05;
  const spin = (t - air) * 900;
  const settle = t < 25.85 ? 0 : t < 26.6 ? 1 : 2; // 1=接 2=不接（定格一下）
  const coinRot = settle === 1 && t < 26.3 ? 0 : settle === 2 && t < 27.2 ? 180 : spin;
  const coinFace = Math.cos((coinRot * Math.PI) / 180) >= 0;
  const coinY = 860 + Math.sin((t - air) * 3.2) * 40;

  return (
    <>
      <Title
        t={t}
        items={[
          [6.75, 12.7, "先说句大实话", "砍多少\n其实不是关键", C.red],
          [12.98, 19.5, "你是不是也这样", "挂了好几个月\n一开口低一大截", C.orange],
          [19.7, 24.8, "接？还是不接？", "接吧亏得慌\n不接又拿不准", C.green],
          [24.95, 27.6, "夜里翻来覆去", "一会想接\n一会又不想接", C.deep],
        ]}
      />

      {/* A1 */}
      <Block t={t} at={6.55} out={8.82} enter="iris" exit="zoomOut" ox={880} oy={360} cam={[[6.55, 1.06, 540, 860], [8.8, 1, 540, 860]]}>
        <div style={{ position: "absolute", left: 110, top: 600, ...PAPER, width: 860, height: 520 }} />
        <div style={{ position: "absolute", left: 150, top: 640, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub }}>你的挂牌价</div>
        <div style={{ position: "absolute", left: 110, top: 600, width: 860, height: 520, overflow: "hidden", borderRadius: 20 }}>
          <PriceBar x={40} y={150} w={780} h={110} cut={0.3 * cutK} fall={fall} />
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: dash * (1 - cutK) }}>
          <path d="M696 720 V900" stroke={C.red} strokeWidth={5} strokeDasharray="12 10" />
        </svg>
        {t > 7.02 && <div style={{ position: "absolute", left: 693, top: 735, width: 6, height: 140, background: "#fff", opacity: Math.exp(-(t - 7.02) * 6) }} />}
        {t > 7.2 && (
          <Magnifier x={magX} y={magY} r={78}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 60, color: C.red }}>？</div>
          </Magnifier>
        )}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: brace }}>
          <path d="M700 905 V935 H934 V905" stroke={C.red} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${brace} 1`} />
        </svg>
        <div style={{ position: "absolute", left: 817, top: 960, transform: `translateX(-50%) scale(${lerp(0.6, 1, brace)})`, opacity: brace, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.red, whiteSpace: "nowrap" }}>砍了多少</div>
        <div style={{ position: "absolute", left: 200, top: 1010, opacity: kIn(t, 8.05, 0.3), transform: `translateY(${(1 - kIn(t, 8.05, 0.3)) * 20}px)` }}>
          <span style={{ position: "relative", fontFamily: SERIF, fontSize: 64, color: C.text }}>
            决定该不该接
            <span style={{ position: "absolute", left: -6, top: "52%", height: 7, width: `${strike * 104}%`, background: C.red, borderRadius: 4 }} />
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.red, marginLeft: 16, opacity: strike }}>关系不大</span>
        </div>
      </Block>

      {/* A1b 两块对比 */}
      <Block t={t} at={8.85} out={12.72} enter="up" exit="slideL" cam={[[8.85, 1, 540, 880], [12.7, 1.04, 540, 880]]}>
        <Panel t={t} at={8.94} neqAt={10.05} x={90} name="砍得狠" cut={0.55} color={C.red} neq="欺负你" />
        <Panel t={t} at={10.7} neqAt={12.25} x={540} name="砍得少" cut={0.12} color={C.green} neq="帮你" />
      </Block>

      {/* A2 挂牌好几个月 → 开口低一大截 */}
      <Block t={t} at={12.86} out={16.85} enter="slideL" exit="zoomOut" dout={0.3} cam={[[12.86, 1, 540, 880], [16.85, 1.05, 520, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 600, width: 500, height: 330, ...PAPER, padding: 14, boxSizing: "border-box", transform: `rotate(-2deg) translateY(${(1 - kPop(t, 13.0, 0.5, 1.3)) * 300}px)` }}>
          <div style={{ position: "relative", width: "100%", height: 230, borderRadius: 12, overflow: "hidden" }}>
            <Img src={staticFile("clips/p02.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${tw(t, 13, 17, 1.02, 1.1, E.linear)})` }} />
            <div style={{ position: "absolute", left: 12, top: 12 }}>
              <Pill color={C.orange} size={26}>挂牌中</Pill>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.text }}>
            两室精装 · 示意
            <span style={{ marginLeft: "auto", color: C.muted, fontSize: 26 }}>咨询 0</span>
          </div>
        </div>
        {/* 月份翻页 */}
        <div style={{ position: "absolute", left: 640, top: 610, width: 280, height: 300, opacity: kIn(t, 14.3, 0.3) }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const flipped = i < monthI;
            const fk = clamp((t - 14.45 - i * 0.17) / 0.17);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 280,
                  height: 240,
                  ...PAPER,
                  borderRadius: 16,
                  transformOrigin: "50% 0%",
                  transform: `perspective(800px) rotateX(${flipped || fk >= 1 ? 100 : fk * 100}deg)`,
                  opacity: flipped && fk >= 1 ? 0 : 1,
                  zIndex: 10 - i,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 52, background: C.red, borderRadius: "16px 16px 0 0" }} />
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.sub, marginTop: 40 }}>挂牌第</span>
                <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 100, color: C.text, lineHeight: 1 }}>{i + 1}</span>
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.sub }}>个月</span>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, top: 0, width: 280, height: 240, ...PAPER, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
            <span style={{ fontFamily: SERIF, fontSize: 56, color: C.red }}>好几个月</span>
          </div>
        </div>
        {/* 买家消息 */}
        <div style={{ position: "absolute", left: 340, top: 960, transform: `scale(${kPop(t, 15.95, 0.45, 2)})`, transformOrigin: "100% 100%", opacity: clamp(kPop(t, 15.95) * 2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, ...PAPER, borderRadius: "26px 26px 6px 26px", padding: "16px 26px", background: "#E9F4EC" }}>
            <Fig s={0.4} c={C.green} />
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, color: C.text, whiteSpace: "nowrap" }}>房东，价格能谈吗？</span>
          </div>
        </div>
      </Block>
      {/* A2b 心里的价 vs 他开口的价 */}
      <Block t={t} at={17.0} out={19.55} enter="zoom" exit="wipe" din={0.4}>
        <div style={{ position: "absolute", left: 90, top: 560, width: 860, height: 600, ...PAPER, opacity: 0.97 }} />
        <div style={{ position: "absolute", left: 140, top: 610, fontFamily: SERIF, fontSize: 52, color: C.text }}>一开口……</div>
        <div style={{ position: "absolute", left: 140, top: 730, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.sub }}>你心里的价</div>
        <div style={{ position: "absolute", left: 140, top: 780, height: 90, width: tw(t, 17.15, 17.6, 0, 740, E.outCubic), borderRadius: 14, background: C.deep }} />
        <div style={{ position: "absolute", left: 140, top: 910, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.red }}>他开口的价</div>
        <div style={{ position: "absolute", left: 140, top: 960, height: 90, width: offerW, borderRadius: 14, background: C.red }} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: gap }}>
          <path d="M500 1005 H880" stroke={C.red} strokeWidth={5} strokeDasharray="10 10" />
          <path d="M880 870 V1050" stroke={C.red} strokeWidth={5} />
          <path d="M500 990 V1020" stroke={C.red} strokeWidth={5} />
        </svg>
        <div style={{ position: "absolute", left: 690, top: 1060, transform: `translateX(-50%) scale(${lerp(0.5, 1, E.outBack(gap, 2)) * bump(t, 19.2)})`, opacity: gap, fontFamily: SERIF, fontSize: 64, color: C.red, whiteSpace: "nowrap" }}>低了一大截</div>
      </Block>

      {/* A3 接 / 不接 */}
      <Block t={t} at={19.58} out={24.82} enter="wipe" exit="drop" cam={[[19.58, 1, 540, 880], [22.4, 1, 540, 880], [24.8, 1.04, 540, 900]]}>
        <div style={{ position: "absolute", left: 90, top: 600, width: 860, height: 340, ...PAPER }} />
        <div style={{ position: "absolute", left: 130, top: 630, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.sub }}>买家出价，你回：</div>
        <div style={{ position: "absolute", left: 150, top: 720, width: 330, height: 150, borderRadius: 26, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 80, color: "#fff", boxShadow: "0 10px 0 #1D6544", transform: `scale(${press(19.95) * kPop(t, 19.62)})` }}>接</div>
        <div style={{ position: "absolute", left: 560, top: 720, width: 330, height: 150, borderRadius: 26, background: "#8E968F", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 80, color: "#fff", boxShadow: "0 10px 0 #646B65", transform: `scale(${press(21.35) * kPop(t, 19.72)})` }}>不接</div>
        {/* 光标手 */}
        {t > 19.6 && (
          <svg width={70} height={90} viewBox="0 0 40 52" style={{ position: "absolute", left: cx, top: cy, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.25))" }}>
            <path d="M14 4 C14 1 19 1 19 4 V22 L21 14 C22 11 26 12 25 15 V22 L27 16 C28 13 32 14 31 17 V24 L33 20 C34 17 38 18 37 21 V34 C37 44 31 50 24 50 H20 C14 50 10 46 7 41 L2 31 C0 28 4 25 7 28 L14 35 Z" fill="#fff" stroke={C.text} strokeWidth={2.4} strokeLinejoin="round" />
          </svg>
        )}
        {/* 两个犹豫气泡 */}
        <div style={{ position: "absolute", left: 150, top: 960, transform: `scale(${kPop(t, 20.3, 0.4, 2)})`, transformOrigin: "20% 0%", opacity: clamp(kPop(t, 20.3) * 2) * (1 - kIn(t, 22.3, 0.3)) }}>
          <Pill color={C.red} size={40}>😣 亏得慌</Pill>
        </div>
        <div style={{ position: "absolute", left: 560, top: 960, transform: `scale(${kPop(t, 21.75, 0.4, 2)})`, transformOrigin: "20% 0%", opacity: clamp(kPop(t, 21.75) * 2) * (1 - kIn(t, 22.3, 0.3)) }}>
          <Pill color={C.deep} size={40}>🤔 拿不准</Pill>
        </div>
        {/* 买家 + 翻牌 */}
        <div style={{ position: "absolute", left: 220, top: 975, opacity: kIn(t, 22.4, 0.35), transform: `translateY(${(1 - kIn(t, 22.4, 0.35)) * 60}px)` }}>
          <Fig s={1.15} c={C.text} />
        </div>
        <FlipCard t={t} at={22.5} flip={23.82} x={560} y={1050} front="真心要买？" back="随口试探？" />
      </Block>

      {/* A4 夜里抛硬币 */}
      <Block t={t} at={24.85} out={27.62} enter="drop" exit="fade" din={0.5} cam={[[24.85, 1, 540, 880], [27.6, 1.06, 540, 880]]}>
        <div style={{ position: "absolute", left: 90, top: 580, width: 860, height: 580, borderRadius: 26, background: "linear-gradient(180deg, #1D2B3A 0%, #2C3E50 100%)", boxShadow: "0 20px 40px rgba(20,30,40,0.35)", overflow: "hidden" }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: (i * 137) % 820 + 20, top: (i * 89) % 520 + 20, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.3 + 0.6 * Math.abs(Math.sin(t * 2 + i)) }} />
          ))}
          <div style={{ position: "absolute", left: 640, top: 60, width: 120, height: 120, borderRadius: 60, background: "#F6E7B4", boxShadow: "0 0 60px rgba(246,231,180,0.6)" }} />
          <div style={{ position: "absolute", left: 670, top: 46, width: 120, height: 120, borderRadius: 60, background: "#253547" }} />
          {/* 时钟 */}
          <svg width={180} height={180} viewBox="0 0 48 48" style={{ position: "absolute", left: 50, top: 50 }}>
            <circle cx={24} cy={24} r={20} fill="#F4EFE6" />
            <path d={`M24 24 L${24 + Math.sin(t * 2) * 13} ${24 - Math.cos(t * 2) * 13}`} stroke={C.text} strokeWidth={2.2} strokeLinecap="round" />
            <path d="M24 24 L20 14" stroke={C.text} strokeWidth={3} strokeLinecap="round" />
            <circle cx={24} cy={24} r={2} fill={C.red} />
          </svg>
          <div style={{ position: "absolute", left: 60, top: 470, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,0.7)" }}>Z z z……睡不着</div>
        </div>
        {/* 硬币 */}
        <div style={{ position: "absolute", left: 420, top: coinY - 120, width: 240, height: 240, transform: `perspective(700px) rotateX(${coinRot}deg) scale(${bump(t, 25.85, 0.1) * bump(t, 26.6, 0.1)})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 120, background: coinFace ? "radial-gradient(circle at 35% 30%, #4FC08D, #2A8C5F 70%)" : "radial-gradient(circle at 35% 30%, #F07467, #D9483B 70%)", border: "10px solid #F6D27A", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", transform: coinFace ? undefined : "rotateX(180deg)" }}>
            <span style={{ fontFamily: SERIF, fontSize: coinFace ? 110 : 84, color: "#fff" }}>{coinFace ? "接" : "不接"}</span>
          </div>
        </div>
      </Block>
    </>
  );
};
