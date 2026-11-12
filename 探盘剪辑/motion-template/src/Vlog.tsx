import React from "react";
import {
  AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
// 画面全部由时间线 JSON 驱动（scripts/ 里的 Python 生成 src/data/main.json），格式见 skill 的 references/时间线格式.md
type TL = any;
const TLCtx = React.createContext<TL>(null);
const useTL = () => React.useContext(TLCtx);

let FPS = 30;          // 真实帧率（Sequence、裁剪起点用）
let CLIPDIR = "clips"; // 4K 渲染时切到 clips4k
const f = (t: number) => Math.round(t * FPS);
const f30 = (t: number) => Math.round(t * 30);   // 动画内部统一用 30 帧当量
const clip = (n: string) => staticFile(`${CLIPDIR}/${n}`);
// 动画用的"30 帧当量"当前帧：60 帧渲染时是小数，动画时长不变、更顺
const useFrame30 = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (fr * 30) / fps;
};

// 配色：每条按内容在时间线的 colors 里定（a/b = 两个对比对象或主次色，c = 第三色，hl = 重点黄，ink = 描边）
const COL_DEFAULT: Record<string, string> = { a: "#C8412F", b: "#2F7A5B", c: "#E09A2B", hl: "#FFD84D", ink: "#16181C" };
export let COL: Record<string, string> = { ...COL_DEFAULT };
const col = (k?: string) => (k && COL[k]) || k || COL.a;   // 颜色名或直接写色值都行
let TITLE = "Smiley Sans", TITLE_FILE = "SmileySans-Oblique.ttf";
let BODY = "Noto Sans SC", BODY_FILE = "NotoSansSC-Medium.otf";
let SUB_Y = 1470;      // 字幕底边（设计坐标）；人物近景大脸时往下放，别贴下巴

const Fonts: React.FC = () => (
  <style>{`
    @font-face { font-family: "${TITLE}"; src: url(${staticFile("fonts/" + TITLE_FILE)}); }
    @font-face { font-family: "${BODY}"; src: url(${staticFile("fonts/" + BODY_FILE)}); }
  `}</style>
);

const pop = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });

/* ---------- 底层：人物口播 + 换场空镜 ---------- */
const Base: React.FC = () => {
  const tl = useTL();
  const frame = useFrame30();
  let s = 1;
  for (const o of tl.ov as any[]) {
    const a = f30(o.t0), b = f30(o.t1);
    if (o.kind === "push" && frame >= a - 1 && frame <= b + 9) {
      s = interpolate(frame, [a, a + 10, b, b + 8], [1, o.scale, o.scale, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
      });
    }
    if (o.kind === "zoomcut" && frame >= a && frame < b) s = o.scale;
  }
  return (
    <>
      {tl.base.map((b, i) => (
        <Sequence key={i} from={f(b.t0)} durationInFrames={f(b.t1) - f(b.t0)}>
          <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: "50% 34%" }}>
            {(b as any).freeze ? (
              <Freeze frame={0}><OffthreadVideo src={clip(b.src)} trimBefore={f(b.from)} playbackRate={(b as any).rate || 1} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Freeze>
            ) : (
              <OffthreadVideo src={clip(b.src)} trimBefore={f(b.from)} playbackRate={(b as any).rate || 1} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </AbsoluteFill>
        </Sequence>
      ))}
    </>
  );
};

/* ---------- 实拍插入 ---------- */
const Punch: React.FC<{ on?: number; children: React.ReactNode }> = ({ on, children }) => {
  const frame = useFrame30();
  const s = on ? interpolate(frame, [0, 7], [1.08, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

const KenBurns: React.FC<{ src: string; zoom?: number[]; pos?: string; dur: number }> = ({ src, zoom = [1.06, 1], pos = "50% 50%", dur }) => {
  const frame = useFrame30();
  const z = interpolate(frame, [0, dur], zoom, { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={clip(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${z})` }} />
    </AbsoluteFill>
  );
};

const Arrow: React.FC<{ dir: "up" | "down"; color: string }> = ({ dir, color }) => (
  <svg width="54" height="64" viewBox="0 0 54 64" style={{ transform: dir === "up" ? "none" : "rotate(180deg)" }}>
    <path d="M27 2 L52 30 H36 V62 H18 V30 H2 Z" fill={color} stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

const PanTag: React.FC<{ text: string; arrow?: "up" | "down"; color: string; y: number }> = ({ text, arrow, color, y }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps, 2);
  const bob = arrow ? Math.sin(frame / 4) * 6 * (arrow === "up" ? -1 : 1) : 0;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
      transform: `scale(${p}) rotate(-2deg)`, opacity: p,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 18, background: color, color: "#fff", fontFamily: TITLE,
        fontSize: 76, padding: "16px 36px", borderRadius: 22, border: "5px solid #fff", boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      }}>
        {text}
        {arrow && <span style={{ transform: `translateY(${bob}px)`, display: "flex" }}><Arrow dir={arrow} color={arrow === "down" ? "#2FB36B" : "#E5483A"} /></span>}
      </div>
    </div>
  );
};

const NameTag: React.FC<{ name: string; sub: string; color: string; top: number; delay?: number }> = ({ name, sub, color, top, delay = 2 }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps, delay);
  return (
    <div style={{
      position: "absolute", left: 60, top, transform: `translateX(${(1 - p) * -80}px)`, opacity: Math.min(1, p * 1.4),
      display: "flex", alignItems: "stretch", boxShadow: "0 10px 28px rgba(0,0,0,.35)", borderRadius: 18, overflow: "hidden",
    }}>
      <div style={{ background: color, color: "#fff", fontFamily: TITLE, fontSize: 72, padding: "12px 28px" }}>{name}</div>
      <div style={{ background: "rgba(255,255,255,.95)", color: COL.ink, fontFamily: BODY, fontSize: 40, padding: "0 24px", display: "flex", alignItems: "center" }}>{sub}</div>
    </div>
  );
};

const Split: React.FC<{ splitAt: number; dur: number; notags?: boolean; a: any; b: any }> = ({ splitAt, dur, notags, a, b }) => {
  const frame = useFrame30();
  const k = interpolate(frame, [splitAt, splitAt + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const topH = 1920 - 960 * k;
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: topH, overflow: "hidden" }}>
        <KenBurns src={a.src} zoom={a.zoom || [1.1, 1.0]} pos={a.pos || "50% 50%"} dur={dur} />
      </div>
      <div style={{ position: "absolute", left: 0, top: topH + 6, width: 1080, height: 960, overflow: "hidden", transform: `translateY(${(1 - k) * 200}px)` }}>
        <KenBurns src={b.src} zoom={b.zoom || [1.0, 1.1]} pos={b.pos || "50% 50%"} dur={dur} />
      </div>
      {!notags && <Sequence from={0}><NameTag name={a.name} sub={a.sub} color={col(a.color || "a")} top={interpolate(k, [0, 1], [1120, 790])} /></Sequence>}
      {!notags && <Sequence from={splitAt}><NameTag name={b.name} sub={b.sub} color={col(b.color || "b")} top={1010} /></Sequence>}
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ every: number; srcs: any[] }> = ({ every, srcs }) => {
  const frame = useFrame30();
  const n = Math.floor(frame / Math.max(1, Math.round(every * 30)));
  const rot = [-3, 2.5, -1.5, 3, -2.5, 1.5, -3][n % 7];
  return (
    <AbsoluteFill style={{ transform: `rotate(${rot}deg) scale(1.12)` }}>
      <Img src={clip(srcs[n % srcs.length].src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: srcs[n % srcs.length].pos || "50% 50%" }} />
    </AbsoluteFill>
  );
};

const Inserts: React.FC = () => {
  const tl = useTL();
  return (
  <>
    {tl.ins.map((it: any, i) => {
      const from = f(it.t0), dur = f(it.t1) - f(it.t0);
      const d30 = f30(it.t1) - f30(it.t0);
      let body: React.ReactNode = null;
      if (it.kind === "video") body = <Punch on={it.punch}><OffthreadVideo src={clip(it.src)} trimBefore={f(it.from)} playbackRate={it.rate || 1} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Punch>;
      if (it.kind === "img") body = (
        <Punch on={it.punch}>
          <KenBurns src={it.src} zoom={it.zoom} pos={it.pos} dur={d30} />
          {it.tag && <PanTag text={it.tag.text} arrow={it.tag.arrow} color={col(it.tag.color)} y={760} />}
          {it.ring && <Ring dur={d30} />}
        </Punch>
      );
      if (it.kind === "split") body = <Split splitAt={f30(it.split_at) - f30(it.t0)} dur={d30} notags={!!it.notags} a={it.a} b={it.b} />;
      if (it.kind === "flash") body = <Flash every={it.every} srcs={it.srcs} />;
      if (it.kind === "table") body = <TableCard dur={d30} o={it} />;
      return <Sequence key={i} from={from} durationInFrames={dur}>{body}</Sequence>;
    })}
  </>
  );
};

/* ---------- 叠加包装 ---------- */
// 第 0 帧就在的大标题：small 小标签，big 主标题，hl 是 big 里要标黄的词
const Cover: React.FC<{ dur: number; small?: string; big: string; hl?: string; size?: number }> = ({ dur, small, big, hl, size = 168 }) => {
  const k = hl ? big.indexOf(hl) : -1;
  const frame = useFrame30();
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + Math.sin(frame / 9) * 0.012;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: out }}>
      {small && <div style={{ fontFamily: BODY, fontSize: 44, color: "#fff", background: "rgba(22,24,28,.78)", padding: "10px 28px", borderRadius: 40, letterSpacing: 2 }}>
        {small}
      </div>}
      <div style={{
        fontFamily: TITLE, fontSize: size, lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap", transform: `scale(${breathe}) rotate(-2deg)`,
        WebkitTextStroke: `14px ${COL.ink}`, paintOrder: "stroke fill", textShadow: "0 12px 30px rgba(0,0,0,.45)",
      }}>
        {k < 0 ? big : <>{big.slice(0, k)}<span style={{ color: COL.hl }}>{hl}</span>{big.slice(k + hl!.length)}</>}
      </div>
    </div>
  );
};

const StopSign: React.FC<{ text?: string }> = ({ text = "停" }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const wob = Math.sin(frame / 3) * 4 * Math.max(0, 1 - frame / 20);
  return (
    <div style={{ position: "absolute", left: 48, top: 560, transform: `scale(${p}) rotate(${-8 + wob}deg)` }}>
      <svg width="230" height="230" viewBox="0 0 100 100">
        <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="#E23B2E" stroke="#fff" strokeWidth="5" />
        <text x="50" y="66" textAnchor="middle" fontFamily={TITLE} fontSize="46" fill="#fff">{text}</text>
      </svg>
    </div>
  );
};

const Chip: React.FC<{ text: string; y: number; dur: number }> = ({ text, y, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const out = interpolate(frame, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{ transform: `scale(${p}) rotate(-1.5deg)`, fontFamily: TITLE, fontSize: 80, color: COL.ink, background: COL.hl, padding: "12px 40px", borderRadius: 20, border: "5px solid #fff", boxShadow: "0 10px 26px rgba(0,0,0,.3)" }}>
        {text}
      </div>
    </div>
  );
};

const Same: React.FC<{ items: [number, string][]; t0: number; dur: number }> = ({ items, t0, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 215, display: "flex", flexDirection: "column", gap: 16, opacity: out }}>
      {items.map(([t, s], i) => {
        const p = pop(frame, fps, f30(t) - f30(t0));
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, transform: `translateX(${(1 - p) * -60}px)`, opacity: Math.min(1, p * 1.5),
            fontFamily: TITLE, fontSize: 64, color: "#fff", background: "rgba(22,24,28,.82)", padding: "8px 28px 8px 16px", borderRadius: 16, alignSelf: "flex-start",
          }}>
            <svg width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="23" fill={COL.hl} /><path d="M13 26 L22 34 L37 17" stroke={COL.ink} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {s}
          </div>
        );
      })}
    </div>
  );
};

const BridgeLabel: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps, 3);
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 180, opacity: out * Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ fontFamily: TITLE, fontSize: 66, color: COL.ink, background: "#fff", padding: "12px 30px", borderRadius: 18, boxShadow: "0 10px 26px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="56" height="40" viewBox="0 0 56 40"><path d="M2 20 H44 M30 6 L46 20 L30 34" stroke={COL.a} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {text}
      </div>
    </div>
  );
};

const Three: React.FC<{ items: string[] }> = ({ items }) => {
  const frame = useFrame30();
  const fps = 30;
  const cols = [COL.a, COL.c, COL.b];
  return (
    <div style={{ position: "absolute", left: 40, width: 880, top: 1150, display: "flex", justifyContent: "space-between" }}>
      {items.map((s, i) => {
        const p = pop(frame, fps, i * 4);
        return (
          <div key={i} style={{ width: 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `scale(${p}) translateY(${(1 - p) * 40}px)` }}>
            <div style={{ width: 118, height: 118, borderRadius: 60, background: cols[i], border: "6px solid #fff", color: "#fff", fontFamily: TITLE, fontSize: 84, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,.35)" }}>{i + 1}</div>
            <div style={{ fontFamily: TITLE, fontSize: 50, color: "#fff", WebkitTextStroke: `9px ${COL.ink}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

/* 户型实拍：片头大字、左上户型牌、免责小字、房间标签 */
const TourTitle: React.FC<{ small: string; big: string; color: string; dur: number }> = ({ small, big, color, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 1.5) }}>
        <div style={{ fontFamily: BODY, fontSize: 48, color: "#fff", background: color, padding: "8px 28px", borderRadius: 40 }}>{small}</div>
        <div style={{ fontFamily: TITLE, fontSize: 156, color: "#fff", WebkitTextStroke: `14px ${COL.ink}`, paintOrder: "stroke fill", textShadow: "0 12px 30px rgba(0,0,0,.45)", whiteSpace: "nowrap" }}>{big}</div>
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ text: string; dur: number; label?: string; color?: string }> = ({ text, dur, label = "实拍", color }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps, 30);
  return (
    <div style={{ position: "absolute", left: 50, top: 205, transform: `translateX(${(1 - p) * -60}px)`, opacity: Math.min(1, p * 1.5),
      display: "flex", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 22px rgba(0,0,0,.3)" }}>
      <div style={{ background: col(color || "a"), color: "#fff", fontFamily: TITLE, fontSize: 52, padding: "8px 20px" }}>{label}</div>
      <div style={{ background: "rgba(255,255,255,.95)", color: COL.ink, fontFamily: TITLE, fontSize: 52, padding: "8px 22px" }}>{text}</div>
    </div>
  );
};

const Note: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 50, top: 292, fontFamily: BODY, fontSize: 34, color: "#fff", background: "rgba(22,24,28,.62)", padding: "6px 18px", borderRadius: 12 }}>
    {text}
  </div>
);

const Room: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const out = interpolate(frame, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1180, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{ transform: `scale(${p}) rotate(-1.5deg)`, display: "flex", alignItems: "center", gap: 14, fontFamily: TITLE, fontSize: 74, color: COL.ink,
        background: "#fff", padding: "10px 34px 10px 22px", borderRadius: 50, boxShadow: "0 10px 26px rgba(0,0,0,.35)" }}>
        <svg width="46" height="58" viewBox="0 0 46 58"><path d="M23 56 C23 56 3 34 3 21 A20 20 0 0 1 43 21 C43 34 23 56 23 56 Z" fill={COL.a} /><circle cx="23" cy="21" r="8" fill="#fff" /></svg>
        {text}
      </div>
    </div>
  );
};

/* ---------- 全片新增包装 ---------- */
// 章节号：先在画面中间亮大号，再缩到左上角常驻
const Chapter: React.FC<{ n: number; text: string; color: string; dur: number }> = ({ n, text, color, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const k = interpolate(frame, [32, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const big = 1 - k;
  const x = interpolate(k, [0, 1], [540, 50]);
  const yy = interpolate(k, [0, 1], [700, 116]);
  const sc = interpolate(k, [0, 1], [1, 0.46]) * p;
  return (
    <div style={{ position: "absolute", left: x, top: yy, transform: `translate(${-50 * big}%, 0) scale(${sc})`, transformOrigin: "0 0", opacity: out }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(255,255,255,.96)", padding: "14px 34px 14px 16px", borderRadius: 80, boxShadow: "0 12px 30px rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>
        <div style={{ width: 110, height: 110, borderRadius: 60, background: color, color: "#fff", fontFamily: TITLE, fontSize: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
        <div style={{ fontFamily: TITLE, fontSize: 96, color: COL.ink }}>{text}</div>
      </div>
    </div>
  );
};

// 飘字：贴在实拍上的关键词，逐个弹出
const Floats: React.FC<{ items: [number, string, number, number][]; t0: number; dur: number }> = ({ items, t0, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const out = interpolate(frame, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {items.map(([t, s, x, yy], i) => {
        const p = pop(frame, fps, f30(t) - f30(t0));
        const bob = Math.sin((frame + i * 9) / 10) * 5;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yy + bob, transform: `scale(${p}) rotate(${[-4, 3, -2][i % 3]}deg)`, opacity: out * Math.min(1, p * 1.5),
            fontFamily: TITLE, fontSize: 78, color: COL.ink, background: COL.hl, padding: "10px 30px", borderRadius: 18, border: "5px solid #fff", boxShadow: "0 10px 26px rgba(0,0,0,.3)", whiteSpace: "nowrap" }}>
            {s}
          </div>
        );
      })}
    </>
  );
};

// 大字冲击（全片 2 处），放在画面上半，不压脸
const Slam: React.FC<{ lines: string[]; hl: number; dur: number }> = ({ lines, hl, dur }) => {
  const frame = useFrame30();
  const s = interpolate(frame, [0, 5, 9], [2.2, 0.94, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shake = frame < 9 ? Math.sin(frame * 3) * (9 - frame) : 0;
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 215, display: "flex", flexDirection: "column", alignItems: "center", opacity: out,
      transform: `translateX(${shake}px) scale(${s}) rotate(-2deg)` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: TITLE, fontSize: 132, lineHeight: 1.1, color: i === hl ? COL.hl : "#fff", WebkitTextStroke: `13px ${COL.ink}`, paintOrder: "stroke fill", textShadow: "0 12px 30px rgba(0,0,0,.45)", whiteSpace: "nowrap" }}>{l}</div>
      ))}
    </div>
  );
};

// 两盘对照小表：每行一个盘
const Compare: React.FC<{ rows: [number, string, string, string][]; t0: number; dur: number }> = ({ rows, t0, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 50, top: 215, display: "flex", flexDirection: "column", gap: 14, opacity: out }}>
      {rows.map(([t, name, text, color], i) => {
        const p = pop(frame, fps, f30(t) - f30(t0));
        return (
          <div key={i} style={{ display: "flex", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 22px rgba(0,0,0,.3)", alignSelf: "flex-start",
            transform: `translateX(${(1 - p) * -80}px)`, opacity: Math.min(1, p * 1.5) }}>
            <div style={{ background: col(color), color: "#fff", fontFamily: TITLE, fontSize: 60, padding: "8px 22px" }}>{name}</div>
            <div style={{ background: "rgba(255,255,255,.96)", color: COL.ink, fontFamily: TITLE, fontSize: 60, padding: "8px 26px" }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
};

// 参数卡：数字放大
const Stats: React.FC<{ items: [number, string, string][]; t0: number; color: string }> = ({ items, t0, color }) => {
  const frame = useFrame30();
  const fps = 30;
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 560, display: "flex", flexDirection: "column", gap: 22 }}>
      {items.map(([t, k, v], i) => {
        const p = pop(frame, fps, f30(t) - f30(t0));
        return (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 20, alignSelf: "flex-start", background: "rgba(255,255,255,.95)", padding: "8px 34px", borderRadius: 20,
            borderLeft: `14px solid ${color}`, boxShadow: "0 10px 26px rgba(0,0,0,.3)", transform: `scale(${p})`, transformOrigin: "0 50%" }}>
            <span style={{ fontFamily: TITLE, fontSize: 56, color: COL.ink }}>{k}</span>
            <span style={{ fontFamily: TITLE, fontSize: 108, color }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
};

// 价签：晃一晃的"单价"吊牌
const PriceTag: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const swing = Math.sin(frame / 5) * 14 * Math.exp(-frame / 30);
  const out = interpolate(frame, [dur - 5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 70, top: 470, transformOrigin: "60px 0", transform: `rotate(${-12 + swing}deg) scale(${p})`, opacity: out }}>
      <svg width="300" height="230" viewBox="0 0 300 230">
        <line x1="60" y1="0" x2="60" y2="58" stroke="#fff" strokeWidth="5" />
        <path d="M20 70 L60 40 L280 40 Q292 40 292 52 L292 208 Q292 220 280 220 L60 220 L20 190 Z" fill={COL.hl} stroke={COL.ink} strokeWidth="6" />
        <circle cx="58" cy="70" r="10" fill={COL.ink} />
        <text x="175" y="160" textAnchor="middle" fontFamily={TITLE} fontSize="84" fill={COL.ink}>{text}</text>
      </svg>
    </div>
  );
};

// 沙盘推近时圈出一栋
const Ring: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useFrame30();
  const d = interpolate(frame, [dur * 0.45, dur * 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <ellipse cx="540" cy="900" rx="230" ry="330" fill="none" stroke={COL.hl} strokeWidth="12" strokeDasharray="1800" strokeDashoffset={1800 * (1 - d)} strokeLinecap="round" />
    </svg>
  );
};

// 对照表预览：只露表头和比较项，内容虚化
// o: { title, cols: [{name, color}], rows: [比较项…], foot, bg }
const TableCard: React.FC<{ dur: number; o: any }> = ({ dur, o }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const rows: string[] = o.rows || [];
  const cols: any[] = o.cols || [];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "blur(18px) brightness(.7)", transform: "scale(1.1)" }}>
        {o.bg && <Img src={clip(o.bg)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, right: 70, top: 300, background: "#FBF8F2", borderRadius: 28, padding: "36px 34px", boxShadow: "0 24px 60px rgba(0,0,0,.45)",
        transform: `translateY(${(1 - p) * 900}px) rotate(${(1 - p) * 6 - 1}deg)` }}>
        <div style={{ fontFamily: TITLE, fontSize: 70, color: COL.ink, textAlign: "center" }}>{o.title}</div>
        <div style={{ display: "flex", marginTop: 26, gap: 12 }}>
          <div style={{ flex: 1.3 }} />
          {cols.map((c, j) => (
            <div key={j} style={{ flex: 1, background: col(c.color || (j ? "b" : "a")), color: "#fff", fontFamily: TITLE, fontSize: 50, textAlign: "center", borderRadius: 12, padding: "8px 0" }}>{c.name}</div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center", opacity: interpolate(frame, [12 + i * 3, 18 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <div style={{ flex: 1.3, fontFamily: BODY, fontSize: 36, color: COL.ink }}>{r}</div>
            {cols.map((_, j) => (
              <div key={j} style={{ flex: 1, height: 58, borderRadius: 10, background: "#E9E3D8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ filter: "blur(7px)", fontFamily: BODY, fontSize: 34, color: "#555" }}>{["适合谁看", "要不要选", "细节对比"][(i + j) % 3]}</div>
              </div>
            ))}
          </div>
        ))}
        {o.foot && <div style={{ marginTop: 26, textAlign: "center", fontFamily: BODY, fontSize: 34, color: "#8A8172" }}>{o.foot}</div>}
      </div>
    </AbsoluteFill>
  );
};

// 评论区卡：箭头指向右侧评论按钮（y≈1215）
const CommentCard: React.FC<{ code: string; dur: number }> = ({ code, dur }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  const nudge = Math.sin(frame / 4) * 10;
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 90, top: 1130, display: "flex", alignItems: "center", gap: 16, opacity: out, transform: `scale(${p})`, transformOrigin: "100% 50%" }}>
      <div style={{ fontFamily: TITLE, fontSize: 76, color: COL.ink, background: COL.hl, padding: "12px 34px", borderRadius: 22, border: "5px solid #fff", boxShadow: "0 10px 26px rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>
        评论区打「{code}」
      </div>
      <svg width="110" height="70" viewBox="0 0 110 70" style={{ transform: `translateX(${nudge}px)` }}>
        <path d="M4 35 H84 M60 10 L96 35 L60 60" stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 35 H84 M60 10 L96 35 L60 60" stroke={COL.a} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const DmCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useFrame30();
  const fps = 30;
  const p = pop(frame, fps);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${p}) rotate(-1.5deg)`, display: "flex", alignItems: "center", gap: 16, fontFamily: TITLE, fontSize: 70, color: "#fff", background: COL.a,
        padding: "14px 36px", borderRadius: 22, border: "5px solid #fff", boxShadow: "0 10px 26px rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>
        <svg width="62" height="52" viewBox="0 0 62 52"><path d="M6 6 H56 V38 H24 L12 48 V38 H6 Z" fill="#fff" /><circle cx="20" cy="22" r="4" fill={COL.a} /><circle cx="31" cy="22" r="4" fill={COL.a} /><circle cx="42" cy="22" r="4" fill={COL.a} /></svg>
        {text}
      </div>
    </div>
  );
};

const Overlays: React.FC = () => {
  const tl = useTL();
  return (
  <>
    {tl.ov.map((o: any, i) => {
      const from = f(o.t0), dur = f(o.t1) - f(o.t0);
      const d30 = f30(o.t1) - f30(o.t0);
      let body: React.ReactNode = null;
      if (o.kind === "cover") body = <Cover dur={d30} small={o.small} big={o.big} hl={o.hl} size={o.size} />;
      if (o.kind === "stop") body = <StopSign text={o.text} />;
      if (o.kind === "chip") body = <Chip text={o.text} y={o.y} dur={d30} />;
      if (o.kind === "same") body = <Same items={o.items} t0={o.t0} dur={d30} />;
      if (o.kind === "bridge") body = <BridgeLabel text={o.text} dur={d30} />;
      if (o.kind === "three") body = <Three items={o.items} />;
      if (o.kind === "name") body = <NameTag name={o.name} sub={o.sub} color={col(o.color)} top={o.top || 1150} />;
      if (o.kind === "title") body = <TourTitle small={o.small} big={o.big} color={col(o.color)} dur={d30} />;
      if (o.kind === "badge") body = <Badge text={o.text} dur={d30} label={o.label} color={o.color} />;
      if (o.kind === "note") body = <Note text={o.text} />;
      if (o.kind === "room") body = <Room text={o.text} dur={d30} />;
      if (o.kind === "chapter") body = <Chapter n={o.n} text={o.text} color={col(o.color)} dur={d30} />;
      if (o.kind === "floats") body = <Floats items={o.items} t0={o.t0} dur={d30} />;
      if (o.kind === "slam") body = <Slam lines={o.lines} hl={o.hl} dur={d30} />;
      if (o.kind === "compare") body = <Compare rows={o.rows} t0={o.t0} dur={d30} />;
      if (o.kind === "stats") body = <Stats items={o.items} t0={o.t0} color={col(o.color)} />;
      if (o.kind === "pricetag") body = <PriceTag text={o.text} dur={d30} />;
      if (o.kind === "note2") body = <Chip text={o.text} y={210} dur={d30} />;
      if (o.kind === "comment") body = <CommentCard code={o.text} dur={d30} />;
      if (o.kind === "dm") body = <DmCard text={o.text} />;
      if (!body) return null;
      return <Sequence key={i} from={from} durationInFrames={dur}>{body}</Sequence>;
    })}
  </>
  );
};

/* ---------- 字幕：单行、关键词标黄，底边 SUB_Y（默认 1470，时间线 sub_y 可改） ---------- */
const SubLine: React.FC<{ text: string; hl: string[] }> = ({ text, hl }) => {
  const frame = useFrame30();
  const s = interpolate(frame, [0, 4], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const parts: { s: string; h: boolean }[] = [];
  let rest = text;
  while (rest.length) {
    let hit = -1, word = "";
    for (const w of hl) { const k = rest.indexOf(w); if (k >= 0 && (hit < 0 || k < hit)) { hit = k; word = w; } }
    if (hit < 0) { parts.push({ s: rest, h: false }); break; }
    if (hit > 0) parts.push({ s: rest.slice(0, hit), h: false });
    parts.push({ s: word, h: true });
    rest = rest.slice(hit + word.length);
  }
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: SUB_Y - 104, height: 104, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
      <div style={{
        transform: `scale(${s})`, fontFamily: BODY, fontSize: 76, lineHeight: 1.2, color: "#fff", whiteSpace: "nowrap",
        WebkitTextStroke: `11px ${COL.ink}`, paintOrder: "stroke fill", textShadow: "0 4px 12px rgba(0,0,0,.35)",
      }}>
        {parts.map((p, i) => <span key={i} style={{ color: p.h ? COL.hl : "#fff" }}>{p.s}</span>)}
      </div>
    </div>
  );
};

const Subs: React.FC = () => {
  const tl = useTL();
  return (
  <>
    {tl.subs.map((s, i) => (
      <Sequence key={i} from={f(s.t0)} durationInFrames={Math.max(1, f(s.t1) - f(s.t0))}>
        <SubLine text={s.text} hl={s.hl} />
      </Sequence>
    ))}
  </>
  );
};

export const Vlog: React.FC<{ tl: TL }> = ({ tl }) => {
  const t = tl as any;
  FPS = t.fps || 30;
  CLIPDIR = t.clipdir || "clips";
  COL = { ...COL_DEFAULT, ...(t.colors || {}) };
  SUB_Y = t.sub_y || 1470;
  if (t.fonts?.title) { TITLE = t.fonts.title.family; TITLE_FILE = t.fonts.title.file; }
  if (t.fonts?.body) { BODY = t.fonts.body.family; BODY_FILE = t.fonts.body.file; }
  return (
  <TLCtx.Provider value={t}>
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    <Base />
    <Inserts />
    <Overlays />
    <Subs />
  </AbsoluteFill>
  </TLCtx.Provider>
  );
};
