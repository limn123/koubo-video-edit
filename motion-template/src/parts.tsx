// 本条视频新增的积木：实景照片卡、楼栋剖面、人群筛选、清单行、路边楼栋示意、价格标签、日历、锁、对照表
import React from "react";
import { Img, staticFile } from "remotion";
import { E, clamp, invLerp, lerp, ramp } from "./engine/ease";
import { C } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";
import { Card3D, Dude, ICheck, ICross, io, rnd } from "./kit";

/* ---------------- 实景照片卡：3D 翻入 + 画面缓慢推近 + 底部地名 ---------------- */
export const Photo: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  caption?: string;
  sub?: string;
  from?: "up" | "left" | "right" | "drop";
  seed?: number;
  rot?: number;
  color?: string;
  pos?: string; // object-position
  zoom?: [number, number];
}> = ({ t, at, out = Infinity, x, y, w, h, src, caption, sub, from = "up", seed = 0, rot = 0, color = C.orange, pos = "50% 50%", zoom = [1.02, 1.12] }) => {
  const live = t >= at - 0.01 && t <= out + 0.4;
  if (!live) return null;
  const k = ramp(t, at, Number.isFinite(out) ? out + 0.4 : at + 8, E.linear);
  const capH = caption ? 64 : 0;
  return (
    <Card3D t={t} at={at} out={out} x={x} y={y} w={w} h={h + capH} from={from} seed={seed} radius={16} pad={10} style={{ transform: `rotate(${rot}deg)` }}>
      <div style={{ position: "relative", width: w - 20, height: h - 10, overflow: "hidden", borderRadius: 10, background: "#ddd" }}>
        <Img
          src={staticFile(`clips/${src}.jpg`)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${lerp(zoom[0], zoom[1], k)})` }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)", borderRadius: 10 }} />
      </div>
      {caption && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: capH, padding: "0 6px" }}>
          <svg width={22} height={28} viewBox="0 0 22 28">
            <path d="M11 27 C11 27 2 16 2 10 A9 9 0 0 1 20 10 C20 16 11 27 11 27 Z" fill={color} />
            <circle cx={11} cy={10} r={3.6} fill="#fff" />
          </svg>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.text, whiteSpace: "nowrap" }}>{caption}</span>
          {sub && <span style={{ fontFamily: SANS, fontSize: 24, color: C.muted, marginLeft: "auto", whiteSpace: "nowrap" }}>{sub}</span>}
        </div>
      )}
    </Card3D>
  );
};

/* ---------------- 楼栋剖面（步梯楼）：逐层长出，可高亮楼层、显示爬楼的小人 ---------------- */
export const WalkUp: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number; // 地面线 y
  floors?: number;
  fw?: number; // 楼宽
  fh?: number; // 层高
  climbAt?: number; // 小人开始爬楼
  climbDur?: number;
  hlFloors?: number[];
  hlAt?: number;
}> = ({ t, at, out = Infinity, x, y, floors = 6, fw = 300, fh = 78, climbAt, climbDur = 2.4, hlFloors = [], hlAt = Infinity }) => {
  const { o, live } = io(t, at, out, 0.6, 0.35);
  if (!live) return null;
  const a = 1 - E.inCubic(o);
  const stairX = x + fw - 74;
  // 爬楼：沿楼梯间折线往上走
  const ck = climbAt === undefined ? -1 : clamp(invLerp(climbAt, climbAt + climbDur, t));
  const fl = ck * (floors - 1);
  const fi = Math.floor(fl);
  const ff = fl - fi;
  const px = stairX + 8 + (fi % 2 === 0 ? ff : 1 - ff) * 48;
  const py = y - fl * fh - 8;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: a }}>
      {/* 地面 */}
      <line x1={x - 60} y1={y} x2={x + fw + 60} y2={y} stroke={C.text} strokeOpacity={0.35} strokeWidth={3} strokeDasharray={`${(fw + 120) * E.outExpo(ramp(t, at, at + 0.5))} 2000`} />
      {Array.from({ length: floors }).map((_, i) => {
        const k = E.outBack(clamp(invLerp(at + 0.1 + i * 0.09, at + 0.45 + i * 0.09, t)), 1.4);
        if (k <= 0) return null;
        const fy = y - (i + 1) * fh;
        const hl = hlFloors.includes(i + 1) ? E.outCubic(ramp(t, hlAt, hlAt + 0.4)) : 0;
        return (
          <g key={i} transform={`translate(0 ${(1 - k) * 30})`} opacity={clamp(k * 2)}>
            <rect x={x} y={fy} width={fw} height={fh} fill={hl > 0 ? `rgba(224,122,53,${0.08 + 0.14 * hl})` : C.card} stroke={C.text} strokeOpacity={0.55} strokeWidth={2.5} />
            {/* 窗 */}
            {[0, 1, 2].map((j) => (
              <rect key={j} x={x + 22 + j * 62} y={fy + 20} width={40} height={fh - 40} rx={3} fill="#E9F0EC" stroke={C.text} strokeOpacity={0.35} strokeWidth={1.5} />
            ))}
            {/* 楼梯间：斜线 */}
            <rect x={stairX} y={fy} width={74} height={fh} fill="rgba(24,61,51,0.06)" stroke={C.text} strokeOpacity={0.4} strokeWidth={1.5} />
            <path d={i % 2 === 0 ? `M${stairX + 6} ${fy + fh - 6} L${stairX + 68} ${fy + 6}` : `M${stairX + 68} ${fy + fh - 6} L${stairX + 6} ${fy + 6}`} stroke={C.text} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 5" />
            <text x={x - 14} y={fy + fh / 2 + 9} textAnchor="end" fontFamily={NUM} fontWeight={600} fontSize={26} fill={hl > 0 ? C.orange : C.muted}>
              {i + 1}F
            </text>
          </g>
        );
      })}
      {/* 屋顶 */}
      <path d={`M${x - 12} ${y - floors * fh} H${x + fw + 12}`} stroke={C.text} strokeOpacity={0.6} strokeWidth={5} opacity={clamp(invLerp(at + 0.1 + floors * 0.09, at + 0.4 + floors * 0.09, t))} />
      {ck >= 0 && ck <= 1 && t >= (climbAt ?? 0) - 0.2 && (
        <g transform={`translate(${px} ${py - 40}) scale(1.1)`}>
          <circle cx={12} cy={7} r={6} fill={C.red} />
          <path d={`M3 34 C3 21 7 16 12 16 C17 16 21 21 21 34 Z`} fill={C.red} />
          {/* 汗滴 */}
          {ck > 0.4 && <path d="M26 2 C29 7 30 9 28 11 C26 12 24 10 25 7 Z" fill="#5DA9D6" opacity={0.6 + 0.4 * Math.sin(t * 9)} />}
        </g>
      )}
    </svg>
  );
};

/* ---------------- 人群：网格排布的小人，可按序号逐个淡出（筛掉），剩下的高亮 ---------------- */
export const Crowd: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  cols: number;
  rows: number;
  gap?: number;
  s?: number;
  drops?: [number, number[]][]; // [时间, 要淡出的序号]
  keepColor?: string;
  keepAt?: number;
}> = ({ t, at, out = Infinity, x, y, cols, rows, gap = 70, s = 40, drops = [], keepColor = C.green, keepAt = Infinity }) => {
  const { o, live } = io(t, at, out, 0.5, 0.3);
  if (!live) return null;
  const n = cols * rows;
  const gone = new Map<number, number>();
  drops.forEach(([dt, ids]) => ids.forEach((id, j) => gone.set(id, dt + j * 0.025)));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: 1 - E.inCubic(o) }}>
      {Array.from({ length: n }).map((_, i) => {
        const cx = (i % cols) * gap;
        const cy = Math.floor(i / cols) * gap * 1.12;
        const k = E.outBack(clamp(invLerp(at + i * 0.012, at + 0.35 + i * 0.012, t)), 1.6);
        const g = gone.has(i) ? E.inCubic(clamp(invLerp(gone.get(i)!, gone.get(i)! + 0.35, t))) : 0;
        const kept = !gone.has(i) && t >= keepAt;
        const col = g > 0 ? C.muted : kept ? keepColor : "rgba(24,61,51,0.55)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              opacity: clamp(k * 2) * (1 - g * 0.88),
              transform: `translateY(${(1 - k) * 20 + g * 18}px) scale(${lerp(0.5, 1, k) * (kept ? 1 + 0.12 * E.outBack(ramp(t, keepAt, keepAt + 0.4)) : 1)})`,
            }}
          >
            <Dude s={s} c={col} />
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- 清单行：图标 + 文字 + 右侧数值，逐行翻入 ---------------- */
export const Row: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  icon?: "x" | "v" | "!" | "dot";
  color?: string;
  label: string;
  value?: string;
  valueColor?: string;
  strike?: number; // 划线时间
  h?: number;
}> = ({ t, at, out = Infinity, x, y, w, icon = "x", color = C.red, label, value, valueColor, strike, h = 84 }) => {
  const { p, o, live } = io(t, at, out, 0.5, 0.3);
  if (!live) return null;
  const k = E.outBack(p, 1.5);
  const sk = strike === undefined ? 0 : E.outCubic(ramp(t, strike, strike + 0.35));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 26px",
        boxSizing: "border-box",
        background: C.card,
        borderRadius: 18,
        border: `2px solid ${color}33`,
        boxShadow: "0 6px 0 #DED2BE, 0 16px 30px rgba(70,50,20,0.14)",
        opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)),
        transform: `perspective(900px) rotateX(${(1 - k) * 70}deg) translateY(${-24 * E.inCubic(o)}px)`,
        transformOrigin: "50% 0%",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 22, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon === "x" ? <ICross s={26} c={color} w={5} /> : icon === "v" ? <ICheck s={28} c={color} w={5} /> : icon === "!" ? (
          <span style={{ fontFamily: SERIF, fontSize: 34, color, lineHeight: 1 }}>!</span>
        ) : (
          <div style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
        )}
      </div>
      <span style={{ position: "relative", fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.text, whiteSpace: "nowrap" }}>
        {label}
        {sk > 0 && <span style={{ position: "absolute", left: -4, top: "52%", height: 4, width: `calc(${sk * 100}% + 8px)`, background: C.red, borderRadius: 2 }} />}
      </span>
      {value && (
        <span style={{ marginLeft: "auto", fontFamily: NUM, fontWeight: 700, fontSize: 40, color: valueColor ?? color, whiteSpace: "nowrap" }}>{value}</span>
      )}
    </div>
  );
};

/* ---------------- 价格标签（吊牌） ---------------- */
export const PriceTag: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  label: string;
  value: string;
  unit?: string;
  color?: string;
  swing?: number;
  size?: number;
}> = ({ t, at, out = Infinity, x, y, label, value, unit = "万", color = C.orange, swing = 1, size = 64 }) => {
  const { p, o, live } = io(t, at, out, 0.6, 0.3);
  if (!live) return null;
  const d = t - at;
  const rot = swing * Math.sin(d * 6) * 9 * Math.exp(-d * 2.2) + (1 - E.outBack(p)) * -30;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, 0) rotate(${rot}deg) scale(${lerp(0.5, 1, E.outBack(p)) * (1 - 0.2 * E.inCubic(o))})`,
        transformOrigin: "50% -30px",
        opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)),
      }}
    >
      <svg width={4} height={34} style={{ position: "absolute", left: "50%", top: -34, marginLeft: -2 }}>
        <line x1={2} y1={0} x2={2} y2={34} stroke={C.text} strokeOpacity={0.4} strokeWidth={2} />
      </svg>
      <div
        style={{
          background: C.card,
          border: `3px solid ${color}`,
          borderRadius: "14px 14px 18px 18px",
          padding: "10px 22px 12px",
          textAlign: "center",
          boxShadow: "0 6px 0 #DED2BE, 0 20px 34px rgba(70,50,20,0.22)",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 7, border: `3px solid ${color}`, margin: "0 auto 4px" }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.sub }}>{label}</div>
        <div style={{ fontFamily: NUM, fontWeight: 700, fontSize: size, color, lineHeight: 1.05 }}>
          {value}
          <span style={{ fontFamily: SANS, fontSize: size * 0.42, marginLeft: 4 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
};

/* ---------------- 日历翻页：1→N 月 ---------------- */
export const MonthFlip: React.FC<{ t: number; at: number; out?: number; x: number; y: number; to: number; dur: number }> = ({ t, at, out = Infinity, x, y, to, dur }) => {
  const { p, o, live } = io(t, at, out, 0.45, 0.3);
  if (!live) return null;
  const v = 1 + (to - 1) * E.inOutCubic(clamp(invLerp(at + 0.3, at + 0.3 + dur, t)));
  const m = Math.floor(v);
  const f = v - m;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 200, opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)), transform: `scale(${lerp(0.6, 1, E.outBack(p))})` }}>
      <div style={{ height: 52, background: C.red, borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#fff" }}>
        挂牌
      </div>
      <div style={{ position: "relative", height: 170, background: C.card, borderRadius: "0 0 18px 18px", boxShadow: "0 8px 0 #DED2BE, 0 20px 34px rgba(70,50,20,0.2)", perspective: 600 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 96, color: C.text }}>{Math.min(to, m + (f > 0.5 ? 1 : 0))}</span>
          <span style={{ fontFamily: SANS, fontSize: 34, color: C.sub, marginTop: 30 }}>个月</span>
        </div>
        {f > 0.02 && f < 0.98 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "50%",
              background: "linear-gradient(180deg,#FFFDF8,#EFE7D9)",
              transformOrigin: "50% 100%",
              transform: `rotateX(${-180 * f}deg)`,
              backfaceVisibility: "hidden",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ---------------- 锁（钱卡在房子里） ---------------- */
export const Lock: React.FC<{ t: number; at: number; out?: number; x: number; y: number; s?: number; color?: string }> = ({ t, at, out = Infinity, x, y, s = 1, color = C.red }) => {
  const { p, o, live } = io(t, at, out, 0.4, 0.3);
  if (!live) return null;
  const shut = E.outBack(ramp(t, at + 0.25, at + 0.5), 2.2);
  return (
    <svg width={120 * s} height={140 * s} viewBox="0 0 120 140" style={{ position: "absolute", left: x - 60 * s, top: y - 70 * s, overflow: "visible", opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)), transform: `scale(${lerp(1.6, 1, E.outCubic(p))})` }}>
      <path d={`M32 ${66 - 22 * (1 - shut)} V40 A28 28 0 0 1 88 40 V66`} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
      <rect x={14} y={62} width={92} height={72} rx={14} fill={color} />
      <circle cx={60} cy={92} r={10} fill="#fff" />
      <rect x={56} y={96} width={8} height={20} rx={3} fill="#fff" />
    </svg>
  );
};

/* ---------------- 一辆小货车（侧视），x 由调用方算 ---------------- */
export const Truck: React.FC<{ x: number; y: number; s?: number; flip?: boolean; color?: string }> = ({ x, y, s = 1, flip, color = C.red }) => (
  <svg width={150 * s} height={80 * s} viewBox="0 0 150 80" style={{ position: "absolute", left: x, top: y, overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
    <rect x={2} y={8} width={96} height={52} rx={6} fill={color} />
    <path d="M100 24 H128 L146 44 V60 H100 Z" fill="#B23A2F" />
    <rect x={110} y={30} width={18} height={14} rx={2} fill="#E9F0EC" />
    <circle cx={28} cy={64} r={12} fill={C.text} />
    <circle cx={120} cy={64} r={12} fill={C.text} />
    <circle cx={28} cy={64} r={4} fill="#ddd" />
    <circle cx={120} cy={64} r={4} fill="#ddd" />
  </svg>
);

/* ---------------- 简化户型（两房）：主卧 + 次卧，次卧可放大/缩小对比 ---------------- */
export const Plan: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  small: number; // 次卧宽度占比
  label: string;
  area: string;
  color?: string;
  fillAt?: number;
}> = ({ t, at, out = Infinity, x, y, w, small, label, area, color = C.green, fillAt }) => {
  const { p, o, live } = io(t, at, out, 0.6, 0.3);
  if (!live) return null;
  const h = w * 0.78;
  const draw = E.outCubic(ramp(t, at, at + 0.9));
  const L = 2 * (w + h);
  const sw = w * small;
  const fillK = E.outCubic(ramp(t, fillAt ?? at + 0.7, (fillAt ?? at + 0.7) + 0.4));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: Math.min(1, p * 3) * (1 - E.inCubic(o)) }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <rect x={0} y={0} width={w} height={h} fill={C.card} stroke={C.text} strokeWidth={6} strokeDasharray={`${L * draw} ${L}`} />
        {/* 客厅 / 主卧 / 次卧 分隔 */}
        <path d={`M0 ${h * 0.52} H${w}`} stroke={C.text} strokeWidth={4} strokeDasharray={`${w * draw} ${w}`} />
        <path d={`M${w - sw} 0 V${h * 0.52}`} stroke={C.text} strokeWidth={4} opacity={draw} />
        <rect x={w - sw + 3} y={3} width={sw - 6} height={h * 0.52 - 6} fill={color} fillOpacity={0.18 * fillK} />
        <text x={(w - sw) / 2} y={h * 0.3} textAnchor="middle" fontFamily={SANS} fontSize={28} fill={C.sub} opacity={fillK}>
          主卧
        </text>
        <text x={w - sw / 2} y={h * 0.3} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={28} fill={color} opacity={fillK}>
          次卧
        </text>
        <text x={w / 2} y={h * 0.8} textAnchor="middle" fontFamily={SANS} fontSize={28} fill={C.sub} opacity={fillK}>
          客厅
        </text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: SANS, fontSize: 28, color: C.text, opacity: fillK }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: NUM, fontWeight: 700, color }}>{area}</span>
      </div>
    </div>
  );
};

/* ---------------- 对照表预览：4 列表头清楚，内容行模糊（私信领取） ---------------- */
export const TableDoc: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  cols: [string, string][];
  rows: string[];
  colAt?: number[];
  rowAt?: number;
}> = ({ t, at, out = Infinity, x, y, w, cols, rows, colAt, rowAt }) => {
  const { live } = io(t, at, out, 0.6, 0.35);
  if (!live) return null;
  const cw = (w - 200) / cols.length;
  return (
    <Card3D t={t} at={at} out={out} x={x} y={y} w={w} from="up" radius={20} pad={0}>
      <div style={{ padding: "26px 26px 12px", borderBottom: `2px solid ${C.line}` }}>
        <div style={{ fontFamily: SERIF, fontSize: 52, color: C.text, whiteSpace: "nowrap" }}>《本地养老两房对照表》</div>
      </div>
      <div style={{ display: "flex", padding: "14px 0 6px 200px" }}>
        {cols.map(([c, col], i) => {
          const c0 = colAt ? colAt[i] : at + 0.5 + i * 0.12;
          const k = E.outBack(clamp(invLerp(c0, c0 + 0.35, t)), 1.6);
          return (
            <div key={c} style={{ width: cw, display: "flex", justifyContent: "center", opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 20}px)` }}>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#fff", background: col, borderRadius: 999, padding: "4px 16px 6px", whiteSpace: "nowrap" }}>{c}</span>
            </div>
          );
        })}
      </div>
      {rows.map((r, j) => {
        const r0 = (rowAt ?? at + 0.9) + j * 0.12;
        const k = E.outCubic(clamp(invLerp(r0, r0 + 0.4, t)));
        return (
          <div key={r} style={{ display: "flex", alignItems: "center", height: 78, borderTop: `1px solid ${C.line}`, opacity: k }}>
            <div style={{ width: 200, paddingLeft: 26, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.text, whiteSpace: "nowrap" }}>{r}</div>
            {cols.map(([c], i) => (
              <div key={c} style={{ width: cw, display: "flex", justifyContent: "center", filter: "blur(7px)" }}>
                <div style={{ width: cw * (0.5 + 0.35 * rnd(i * 7 + j * 3)), height: 22, borderRadius: 11, background: "rgba(24,61,51,0.35)" }} />
              </div>
            ))}
          </div>
        );
      })}
    </Card3D>
  );
};
