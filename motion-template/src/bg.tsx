// 铺满全屏的 SVG 背景（与上一条另一条示例同一套）：米白纸面 + 测绘网格 + 缓慢漂移的等高线 + 穿城而过的“本地”河道 + 章节描边大字水印
// 甩镜时整张背景跟着做视差横移（移动量是前景的 1/8），让各段像在同一张大图上推进
import React, { useMemo } from "react";
import { E, clamp, invLerp } from "./engine/ease";
import { C, H, W } from "./engine/theme";
import { SERIF } from "./engine/fonts";
import { CHAPTERS, chapterAt } from "./kit";

export const WHIPS = [11.3, 87.2];
const p3io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const PAN = 140; // 每次甩镜背景横移的像素
export const bgPan = (t: number) => WHIPS.reduce((s, w) => s + p3io(clamp(invLerp(w, w + 0.55, t))) * PAN, 0);

// 等高线：一组横向流动的平滑曲线（多个正弦叠加），间距不等，像测绘图
const contour = (i: number, t: number, x0: number, x1: number) => {
  const base = 120 + i * 118 + Math.sin(i * 1.7) * 30;
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 40) {
    const y =
      base +
      Math.sin(x * 0.004 + i * 0.9 + t * 0.12) * 46 +
      Math.sin(x * 0.0105 + i * 2.3 - t * 0.08) * 18 +
      Math.sin(x * 0.0021 + i * 0.4) * 60;
    pts.push(`${x.toFixed(0)},${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
};

export const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const pan = bgPan(t);
  const x0 = -200 + Math.floor(pan / 40) * 40;
  const x1 = x0 + W + 600;
  const lines = useMemo(() => Array.from({ length: 16 }).map((_, i) => i), []);
  const ch = chapterAt(t);
  const [, a, b, tag] = CHAPTERS[ch];
  const wIn = E.outExpo(clamp(invLerp(a + 0.2, a + 1.2, t)));
  const wOut = E.inCubic(clamp(invLerp(b - 0.4, b, t)));
  // 河道：从左上斜穿到右下
  const river = (off: number) => {
    const pts: string[] = [];
    for (let y = -100; y <= H + 100; y += 40) {
      const x = 180 + y * 0.38 + Math.sin(y * 0.0045 + 0.6) * 150 + off;
      pts.push(`${(x - pan * 0.5).toFixed(1)},${y}`);
    }
    return "M" + pts.join(" L");
  };
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 110% 70% at 30% 25%, #FCF9F3 0%, ${C.bg} 55%, ${C.bg2} 100%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="gridS" width={30} height={30} patternUnits="userSpaceOnUse" patternTransform={`translate(${-pan % 30} 0)`}>
            <path d="M30 0 H0 V30" fill="none" stroke="rgba(24,61,51,0.045)" strokeWidth={1} />
          </pattern>
          <pattern id="gridL" width={150} height={150} patternUnits="userSpaceOnUse" patternTransform={`translate(${-pan % 150} 0)`}>
            <path d="M150 0 H0 V150" fill="none" stroke="rgba(24,61,51,0.08)" strokeWidth={1.5} />
            <path d="M-5 0 H5 M0 -5 V5" stroke="rgba(224,122,53,0.35)" strokeWidth={1.5} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#gridS)" />
        <rect width={W} height={H} fill="url(#gridL)" />
        {/* 本地：浅青河面 + 岸线 + 中线虚线 */}
        <path d={river(0)} fill="none" stroke="#CFE3DA" strokeWidth={170} strokeLinecap="round" opacity={0.55} />
        <path d={river(-88)} fill="none" stroke="rgba(42,140,95,0.18)" strokeWidth={2} />
        <path d={river(88)} fill="none" stroke="rgba(42,140,95,0.18)" strokeWidth={2} />
        <path d={river(0)} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray="18 22" strokeDashoffset={-t * 30} />
        {/* 等高线 */}
        <g transform={`translate(${-pan} 0)`}>
          {lines.map((i) => (
            <path key={i} d={contour(i, t, x0, x1)} fill="none" stroke={i % 4 === 0 ? "rgba(224,122,53,0.26)" : "rgba(24,61,51,0.13)"} strokeWidth={i % 4 === 0 ? 2 : 1.4} />
          ))}
        </g>
        {/* 版心裁切角标 */}
        <g stroke={C.orange} strokeOpacity={0.55} strokeWidth={2} fill="none">
          <path d="M60 572 v-14 M60 572 h14" />
          <path d="M1020 572 v-14 M1020 572 h-14" />
          <path d="M60 1300 v14 M60 1300 h14" />
          <path d="M1020 1300 v14 M1020 1300 h-14" />
        </g>
      </svg>
    </>
  );
};

/* ---------------- 底部舞台：章节进度条 + 透视地面网格 + 超大章节号（铺满字幕下方的区域） ---------------- */
const RAIL: [string, string, number, number, string][] = [
  ["01", "物业收费", 34.42, 55.6, C.orange],
  ["02", "人工湖", 55.6, 67.7, C.green],
  ["03", "2 号楼", 67.7, 96.3, C.red],
];
export const BottomStage: React.FC<{ t: number }> = ({ t }) => {
  const HZ = 1415; // 地平线（字幕带下面）
  const VX = 540;
  const pan = bgPan(t);
  const flow = (t * 0.18) % 1;
  const rows = Array.from({ length: 9 }).map((_, i) => {
    const k = (i + flow) / 9;
    return HZ + (H - HZ) * k * k;
  });
  const cols = Array.from({ length: 25 }).map((_, i) => -1300 + i * 140 - (pan % 140));
  const ch = chapterAt(t);
  const tag = CHAPTERS[ch][3];
  const [, a, b] = CHAPTERS[ch];
  const wIn = E.outExpo(clamp(invLerp(a + 0.2, a + 1.2, t)));
  const wOut = E.inCubic(clamp(invLerp(b - 0.4, b, t)));
  const railOn = E.outCubic(clamp(invLerp(35.95, 36.65, t)));
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="floorFade" x1="0" y1={HZ} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.25" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id="floorMask">
            <rect x={0} y={HZ} width={W} height={H - HZ} fill="url(#floorFade)" />
          </mask>
        </defs>
        <g mask="url(#floorMask)">
          <rect x={0} y={HZ} width={W} height={H - HZ} fill="rgba(234,226,212,0.55)" />
          {rows.map((y, i) => (
            <line key={`r${i}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(24,61,51,0.14)" strokeWidth={1 + ((y - HZ) / (H - HZ)) * 1.6} />
          ))}
          {cols.map((x, i) => (
            <line key={`c${i}`} x1={VX + (x - VX) * 0.12} y1={HZ} x2={x} y2={H} stroke={i % 5 === 2 ? "rgba(224,122,53,0.3)" : "rgba(24,61,51,0.12)"} strokeWidth={1.4} />
          ))}
        </g>
        <line x1={0} y1={HZ} x2={W} y2={HZ} stroke="rgba(24,61,51,0.16)" strokeWidth={1.5} />
        {/* 超大章节号（三个差别用数字，其余用章节名） */}
        {(
          <text
            x={-20 + (1 - wIn) * -140}
            y={1905}
            fontFamily={SERIF}
            fontSize={/^\d+$/.test(tag) ? 600 : 400}
            fill={C.orange}
            fillOpacity={0.07 * wIn * (1 - wOut)}
            stroke={C.orange}
            strokeOpacity={0.4 * wIn * (1 - wOut)}
            strokeWidth={3}
            letterSpacing={-12}
          >
            {tag}
          </text>
        )}
      </svg>
      {/* 章节进度条 */}
      <div style={{ position: "absolute", left: 60, top: 1430, width: 860, height: 64, display: "flex", gap: 10, opacity: railOn, transform: `translateY(${(1 - railOn) * 20}px)` }}>
        {RAIL.map(([n, name, s, e, c], i) => {
          const act = t >= s && t < e;
          const done = t >= e;
          const k = clamp((t - s) / (e - s));
          return (
            <div
              key={n}
              style={{
                flex: 1,
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                background: act ? "rgba(255,253,248,0.96)" : "rgba(255,253,248,0.6)",
                border: `2px solid ${act ? c : "rgba(24,61,51,0.12)"}`,
                boxShadow: act ? `0 10px 22px rgba(70,50,20,0.18)` : undefined,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
                transform: `scale(${act ? 1.04 : 1})`,
              }}
            >
              <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${(done ? 1 : act ? k : 0) * 100}%`, background: c, opacity: done ? 0.4 : 1 }} />
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: act || done ? c : "rgba(24,61,51,0.35)" }}>{n}</span>
              <span style={{ fontFamily: SERIF, fontSize: 34, color: act ? C.text : done ? C.sub : "rgba(24,61,51,0.4)", whiteSpace: "nowrap" }}>{name}</span>
              {done && <span style={{ marginLeft: "auto", color: c, fontSize: 22 }}>✓</span>}
            </div>
          );
        })}
      </div>
    </>
  );
};
