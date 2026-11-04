// 本条视频（另一条示例）新增的动画积木：楼栋插画、带看日历、手机消息卡、跷跷板、成交小票打印、走路的买家、
// 价格台阶图、窗外马路、放大镜、数字乘法
import React from "react";
import { E, clamp, invLerp, lerp, ramp } from "./engine/ease";
import { C } from "./engine/theme";
import { NUM, SANS, SERIF } from "./engine/fonts";
import { Dude, rnd } from "./kit";

/* ================= 楼栋插画（线描 + 浅色填充），窗格可逐层亮起 ================= */
export const Bldg: React.FC<{
  w: number;
  h: number;
  floors: number;
  cols?: number;
  color?: string;
  grow?: number; // 0..1 从地面长出
  lit?: number; // 0..1 窗户亮起比例
  tint?: string; // 整栋楼的状态色（红=靠路 / 绿=不靠路）
  roof?: boolean;
}> = ({ w, h, floors, cols = 3, color = C.text, grow = 1, lit = 1, tint, roof = true }) => {
  const fh = (h - 16) / floors;
  const vis = Math.ceil(floors * grow);
  const pad = w * 0.14;
  const cw = (w - pad * 2) / cols;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <g transform={`translate(0 ${h * (1 - grow)})`}>
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={6} fill={tint ? `${tint}22` : "#EFE7D8"} stroke={tint ?? color} strokeOpacity={tint ? 0.9 : 0.45} strokeWidth={2.5} />
        {roof && <rect x={w * 0.3} y={-10} width={w * 0.4} height={12} rx={3} fill={tint ?? color} fillOpacity={0.35} />}
        {Array.from({ length: vis }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const on = rnd(r * 7 + c * 3 + floors) < lit;
            return (
              <rect
                key={`${r}-${c}`}
                x={pad + c * cw + cw * 0.18}
                y={h - 10 - (r + 1) * fh + fh * 0.22}
                width={cw * 0.64}
                height={fh * 0.5}
                rx={2}
                fill={on ? (tint ?? "#9CC7B6") : "#D9CFBD"}
                fillOpacity={on ? 0.75 : 0.9}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
};

/* ================= 带看日历：日子一格格划过，空着的是 0 组，约到的那天亮绿 ================= */
export const Calendar: React.FC<{ t: number; at: number; x: number; y: number; w: number; runA: number; runB: number; hit: number; hitDay: number }> = ({
  t,
  at,
  x,
  y,
  w,
  runA,
  runB,
  hit,
  hitDay,
}) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.5), 1.3);
  const cols = 7;
  const rows = 5;
  const cell = (w - 60) / cols;
  const cur = Math.floor(lerp(0, rows * cols - 1, E.inOutCubic(ramp(t, runA, runB, E.linear))));
  const hk = E.outBack(clamp((t - hit) / 0.4), 2);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `translateY(${(1 - k) * 120}px) rotate(${(1 - k) * -4}deg)`, opacity: clamp(k * 2) }}>
      <div style={{ background: C.card, borderRadius: 26, boxShadow: "0 8px 0 #DED2BE, 0 26px 50px rgba(70,50,20,0.2)", overflow: "hidden" }}>
        <div style={{ background: C.green, padding: "16px 30px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: SERIF, fontSize: 40, color: "#fff" }}>带看日历</span>
          <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 24, color: "rgba(255,255,255,0.8)" }}>示意</span>
        </div>
        <div style={{ padding: "18px 30px 26px", display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, rowGap: 10 }}>
          {Array.from({ length: rows * cols }).map((_, i) => {
            const passed = t >= runA && i <= cur;
            const isHit = i === hitDay && t >= hit;
            return (
              <div key={i} style={{ height: cell * 0.82, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontFamily: NUM, fontWeight: 600, fontSize: 24, color: passed ? C.muted : C.text, opacity: passed && !isHit ? 0.55 : 1 }}>{i + 1}</span>
                {passed && !isHit && <span style={{ fontFamily: NUM, fontSize: 16, color: C.muted }}>0组</span>}
                {i === cur && t >= runA && t < runB + 0.3 && <div style={{ position: "absolute", inset: 2, border: `3px solid ${C.orange}`, borderRadius: 12 }} />}
                {isHit && (
                  <div style={{ position: "absolute", inset: -4, borderRadius: 14, background: C.green, transform: `scale(${hk})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(42,140,95,0.4)" }}>
                    <Dude s={24} c="#fff" />
                    <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: "#fff", marginTop: 2 }}>1组</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ================= 手机消息卡：从侧边滑入，打字中 → 内容 → 之后变灰“已读”没下文 ================= */
export const MsgCard: React.FC<{ t: number; at: number; x: number; y: number; w: number; who: string; text: string; typing?: number; fadeAt?: number; color?: string }> = ({
  t,
  at,
  x,
  y,
  w,
  who,
  text,
  typing = 0.5,
  fadeAt = Infinity,
  color = C.orange,
}) => {
  if (t < at) return null;
  const k = E.outExpo(clamp((t - at) / 0.45));
  const typed = t >= at + typing;
  const f = E.inOutCubic(clamp((t - fadeAt) / 0.5));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `translateX(${(1 - k) * 260}px)`,
        opacity: clamp(k * 2) * (1 - 0.45 * f),
        filter: f > 0 ? `grayscale(${f})` : undefined,
      }}
    >
      <div style={{ background: "rgba(255,253,248,0.97)", borderRadius: 24, padding: "16px 22px 18px", boxShadow: "0 18px 40px rgba(60,40,20,0.22)", border: "1px solid rgba(24,61,51,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 22, color: "#fff" }}>{who.slice(0, 1)}</div>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.text }}>{who}</span>
          <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 20, color: C.muted }}>{f > 0.5 ? "已读" : "刚刚"}</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.text, minHeight: 44 }}>
          {typed ? (
            text
          ) : (
            <span style={{ display: "inline-flex", gap: 8, paddingTop: 14 }}>
              {[0, 1, 2].map((j) => (
                <span key={j} style={{ width: 11, height: 11, borderRadius: 6, background: C.muted, transform: `translateY(${Math.sin(t * 12 - j) * 4}px)` }} />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= 跷跷板（两难）：横梁来回摇，左右两头各挂一个后果 ================= */
export const Seesaw: React.FC<{ t: number; at: number; cx: number; cy: number; len: number; left: React.ReactNode; right: React.ReactNode; tilts: [number, number][] }> = ({
  t,
  at,
  cx,
  cy,
  len,
  left,
  right,
  tilts,
}) => {
  if (t < at) return null;
  // tilts: [时间, 角度]，角度>0 左边下沉
  let ang = 0;
  for (let i = 0; i < tilts.length; i++) {
    const [ta, a] = tilts[i];
    if (t < ta) break;
    const prev = i === 0 ? 0 : tilts[i - 1][1];
    const d = t - ta;
    const k = E.outElastic(clamp(d / 0.9));
    ang = lerp(prev, a, k);
  }
  const k = E.outBack(clamp((t - at) / 0.5), 1.4);
  const rad = (ang * Math.PI) / 180;
  const lx = cx - Math.cos(rad) * len;
  const ly = cy + Math.sin(rad) * len;
  const rx = cx + Math.cos(rad) * len;
  const ry = cy - Math.sin(rad) * len;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 80}px)` }}>
      <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${cx - 60} ${cy + 130} L${cx} ${cy + 8} L${cx + 60} ${cy + 130} Z`} fill={C.slab} stroke={C.text} strokeOpacity={0.35} strokeWidth={3} />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={C.text} strokeWidth={14} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={12} fill={C.orange} />
        <line x1={cx - 160} y1={cy + 132} x2={cx + 160} y2={cy + 132} stroke={C.text} strokeOpacity={0.25} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly, transform: "translate(-50%, -100%)" }}>{left}</div>
      <div style={{ position: "absolute", left: rx, top: ry, transform: "translate(-50%, -100%)" }}>{right}</div>
    </div>
  );
};

/* ================= 成交小票：从打印口一行行吐出来 ================= */
export type TicketRow = [label: string, value: string, hl?: boolean];
export const Receipt: React.FC<{ t: number; at: number; x: number; y: number; w: number; title: string; rows: TicketRow[]; dur: number; foot?: string }> = ({
  t,
  at,
  x,
  y,
  w,
  title,
  rows,
  dur,
  foot,
}) => {
  if (t < at) return null;
  const rowH = 62;
  const full = 100 + rows.length * rowH + (foot ? 60 : 20);
  const p = E.outCubic(clamp((t - at - 0.25) / dur));
  const shown = full * p;
  const jitter = p > 0 && p < 1 ? Math.sin(t * 60) * 1.5 : 0;
  const k = E.outBack(clamp((t - at) / 0.4), 1.5);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: clamp(k * 2) }}>
      {/* 打印机 */}
      <div style={{ position: "relative", zIndex: 2, height: 70, borderRadius: 20, background: C.deep, boxShadow: "0 10px 24px rgba(20,30,20,0.3)", transform: `scale(${lerp(0.7, 1, k)})` }}>
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 14, height: 10, borderRadius: 5, background: "#0B1F19" }} />
        <div style={{ position: "absolute", right: 28, top: 16, width: 14, height: 14, borderRadius: 7, background: p < 1 ? C.green : C.orange }} />
        <span style={{ position: "absolute", left: 28, top: 12, fontFamily: SANS, fontSize: 22, color: "rgba(255,255,255,0.75)" }}>成交记录</span>
      </div>
      <div style={{ position: "relative", marginTop: -14, marginLeft: 26, marginRight: 26, height: shown, overflow: "hidden", transform: `translateX(${jitter}px)` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: full,
            background: "#FFFEFA",
            boxShadow: "0 16px 30px rgba(60,40,20,0.18)",
            padding: "30px 26px 0",
            boxSizing: "border-box",
            maskImage: "linear-gradient(180deg, black 0, black calc(100% - 14px), transparent 100%)",
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 38, color: C.text, textAlign: "center", marginBottom: 14 }}>{title}</div>
          {rows.map(([l, v, hl], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", height: rowH, borderTop: "2px dashed rgba(24,61,51,0.15)", background: hl ? `${C.green}14` : undefined }}>
              <span style={{ fontFamily: SANS, fontSize: 28, color: C.sub }}>{l}</span>
              <span style={{ marginLeft: "auto", fontFamily: NUM, fontWeight: 700, fontSize: 32, color: hl ? C.green : C.text }}>{v}</span>
            </div>
          ))}
          {foot && <div style={{ fontFamily: SANS, fontSize: 22, color: C.muted, textAlign: "center", paddingTop: 16 }}>{foot}</div>}
        </div>
      </div>
    </div>
  );
};

/* ================= 走路的买家：走进来 → 停下看 → 转身走掉 ================= */
export const Walker: React.FC<{ t: number; x0: number; x1: number; x2: number; y: number; inA: number; inB: number; turn: number; outB: number; s?: number; color?: string; label?: string }> = ({
  t,
  x0,
  x1,
  x2,
  y,
  inA,
  inB,
  turn,
  outB,
  s = 1,
  color = C.green,
  label,
}) => {
  if (t < inA || t > outB + 0.1) return null;
  let x = x1;
  let walking = false;
  let face = x1 > x0 ? 1 : -1;
  if (t < inB) {
    x = lerp(x0, x1, E.outCubic(invLerp(inA, inB, t)));
    walking = true;
  } else if (t >= turn) {
    x = lerp(x1, x2, E.inCubic(invLerp(turn + 0.15, outB, t)));
    walking = t > turn + 0.15;
    face = x2 > x1 ? 1 : -1;
  }
  const ph = t * 14;
  const bob = walking ? Math.abs(Math.sin(ph)) * -6 : 0;
  const leg = walking ? Math.sin(ph) * 16 : 0;
  const op = 1 - clamp((t - outB + 0.35) / 0.35);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: "50% 100%", opacity: op }}>
      {label && (
        <div style={{ position: "absolute", left: "50%", top: -50, transform: "translateX(-50%)", fontFamily: SANS, fontWeight: 600, fontSize: 24, color: "#fff", background: color, padding: "3px 14px 5px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {label}
        </div>
      )}
      <svg width={90} height={150} viewBox="0 0 60 100" style={{ display: "block", overflow: "visible", transform: `translateY(${bob}px) scaleX(${face})` }}>
        <circle cx={30} cy={14} r={11} fill={color} />
        <path d="M14 58 C14 34 20 28 30 28 C40 28 46 34 46 58 Z" fill={color} />
        <line x1={24} y1={58} x2={24 + leg * 0.6} y2={92} stroke={color} strokeWidth={8} strokeLinecap="round" />
        <line x1={36} y1={58} x2={36 - leg * 0.6} y2={92} stroke={color} strokeWidth={8} strokeLinecap="round" />
        <circle cx={35} cy={12} r={2.2} fill="#fff" />
      </svg>
    </div>
  );
};

/* ================= 放大镜 ================= */
export const Magnifier: React.FC<{ x: number; y: number; r?: number; children?: React.ReactNode }> = ({ x, y, r = 70, children }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `10px solid ${C.deep}`, background: "rgba(255,255,255,0.25)", boxShadow: "0 12px 26px rgba(20,30,20,0.3), inset 0 0 0 4px rgba(255,255,255,0.6)", overflow: "hidden" }}>
      {children}
    </div>
    <div style={{ position: "absolute", left: r * 1.55, top: r * 1.55, width: r * 0.32, height: r * 0.95, borderRadius: 10, background: C.deep, transform: "rotate(-45deg)", transformOrigin: "50% 0" }} />
  </div>
);

/* ================= 价格台阶：一级级往下走，每级落点弹一下 ================= */
export type Step = [t: number, v: number, label?: string];
export const Stairs: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  steps: Step[];
  vmin: number;
  vmax: number;
  color?: string;
  extend?: number; // 虚线往下延伸（买家预期“下次更低”）开始时间
  line?: [number, number, string]; // [出现时间, 价位, 文字] 买家不等线
}> = ({ t, at, x, y, w, h, steps, vmin, vmax, color = C.red, extend, line }) => {
  if (t < at) return null;
  const k = E.outCubic(clamp((t - at) / 0.5));
  const sx = (i: number) => 70 + (i / steps.length) * (w - 150);
  const sy = (v: number) => 30 + (1 - (v - vmin) / (vmax - vmin)) * (h - 90);
  const n = steps.filter(([ts]) => t >= ts).length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const [ts, v] = steps[i];
    const drop = i === 0 ? 1 : E.outBack(clamp((t - ts) / 0.4), 1.6);
    const vPrev = i === 0 ? v : steps[i - 1][1];
    const vv = lerp(vPrev, v, drop);
    const xa = sx(i);
    const xb = sx(i + 1);
    const grow = i === n - 1 ? E.outCubic(clamp((t - ts) / 0.5)) : 1;
    d += `${i === 0 ? "M" : "L"}${xa} ${sy(vv)} L${lerp(xa, xb, grow)} ${sy(vv)} `;
  }
  const last = n > 0 ? steps[n - 1] : null;
  const ext = extend !== undefined ? E.inOutCubic(clamp((t - extend) / 1.2)) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[vmin, (vmin + vmax) / 2, vmax].map((g) => (
          <line key={g} x1={60} y1={sy(g)} x2={w - 20} y2={sy(g)} stroke={C.text} strokeOpacity={0.08} strokeWidth={2} />
        ))}
        <line x1={60} y1={h - 50} x2={w - 20} y2={h - 50} stroke={C.text} strokeOpacity={0.3} strokeWidth={3} />
        <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        {last && ext > 0 && (
          <path
            d={`M${sx(n)} ${sy(last[1])} L${lerp(sx(n), w - 30, ext)} ${lerp(sy(last[1]), sy(last[1]) + (h - 90) * 0.32, ext)}`}
            fill="none"
            stroke={color}
            strokeOpacity={0.55}
            strokeWidth={6}
            strokeDasharray="4 16"
            strokeLinecap="round"
          />
        )}
        {line && t >= line[0] && (
          <g opacity={E.outCubic(clamp((t - line[0]) / 0.4))}>
            <line x1={60} y1={sy(line[1])} x2={lerp(60, w - 20, E.outExpo(clamp((t - line[0]) / 0.7)))} y2={sy(line[1])} stroke={C.green} strokeWidth={5} strokeDasharray="18 10" />
          </g>
        )}
      </svg>
      {steps.map(([ts, v, label], i) => {
        if (t < ts) return null;
        const kk = E.outBack(clamp((t - ts - 0.15) / 0.4), 2);
        return (
          <div key={i} style={{ position: "absolute", left: sx(i) + (sx(i + 1) - sx(i)) / 2, top: sy(v) - 70, transform: `translateX(-50%) scale(${kk})`, fontFamily: NUM, fontWeight: 700, fontSize: 44, color: i === 0 ? C.text : color, whiteSpace: "nowrap" }}>
            {label ?? v}
            <span style={{ fontFamily: SANS, fontSize: 22, marginLeft: 2 }}>万</span>
          </div>
        );
      })}
      {line && t >= line[0] && (
        <div style={{ position: "absolute", left: w - 24, top: sy(line[1]) + 10, transform: `translateX(-100%) scale(${E.outBack(clamp((t - line[0] - 0.3) / 0.4), 1.8)})`, transformOrigin: "100% 0", fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#fff", background: C.green, padding: "4px 16px 6px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {line[2]}
        </div>
      )}
    </div>
  );
};

/* ================= 窗外：窗框里是马路，车来车往 ================= */
export const WindowView: React.FC<{ t: number; at: number; x: number; y: number; w: number; h: number; label?: string }> = ({ t, at, x, y, w, h, label }) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.5), 1.3);
  const open = E.inOutCubic(clamp((t - at - 0.2) / 0.6));
  const cars = [0, 1, 2, 3];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${lerp(0.6, 1, k)})`, opacity: clamp(k * 2) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "#CFE3E8", overflow: "hidden", boxShadow: "inset 0 0 0 14px #FFFDF8, 0 18px 40px rgba(60,40,20,0.25)" }}>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
          <rect x={0} y={h * 0.55} width={w} height={h * 0.45} fill="#8E9A97" />
          <line x1={0} y1={h * 0.77} x2={w} y2={h * 0.77} stroke="#fff" strokeWidth={5} strokeDasharray="30 22" strokeDashoffset={-t * 120} />
          {cars.map((i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            const sp = 260 + i * 60;
            const span = w + 260;
            const px = ((((t - at) * sp + i * 210) % span) + span) % span;
            const cx = dir > 0 ? px - 130 : w + 130 - px;
            const cy = dir > 0 ? h * 0.83 : h * 0.66;
            const col = [C.red, C.orange, "#5B6F8A", C.deep][i];
            return (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <rect x={-60} y={-30} width={120} height={36} rx={10} fill={col} />
                <rect x={-34} y={-50} width={62} height={26} rx={8} fill={col} />
                <rect x={-28} y={-46} width={24} height={18} rx={3} fill="#DDEFF2" />
                <circle cx={-34} cy={8} r={10} fill="#222" />
                <circle cx={34} cy={8} r={10} fill="#222" />
              </g>
            );
          })}
        </svg>
      </div>
      {/* 窗帘拉开 */}
      <div style={{ position: "absolute", left: 14, top: 14, bottom: 14, width: (w / 2 - 14) * (1 - open), background: `repeating-linear-gradient(90deg, ${C.slab} 0 22px, #E8DCC8 22px 44px)` }} />
      <div style={{ position: "absolute", right: 14, top: 14, bottom: 14, width: (w / 2 - 14) * (1 - open), background: `repeating-linear-gradient(90deg, ${C.slab} 0 22px, #E8DCC8 22px 44px)` }} />
      <div style={{ position: "absolute", left: w / 2 - 5, top: 14, bottom: 14, width: 10, background: "#FFFDF8" }} />
      <div style={{ position: "absolute", left: 14, right: 14, top: h / 2 - 5, height: 10, background: "#FFFDF8" }} />
      {label && (
        <div style={{ position: "absolute", left: 30, top: 30, fontFamily: SANS, fontWeight: 600, fontSize: 26, color: "#fff", background: "rgba(24,61,51,0.75)", padding: "4px 14px 6px", borderRadius: 10 }}>{label}</div>
      )}
    </div>
  );
};

/* ================= 小人头顶的想法气泡（云朵 + 三个小圆点） ================= */
export const Thought: React.FC<{ t: number; at: number; out?: number; x: number; y: number; children: React.ReactNode; color?: string }> = ({ t, at, out = Infinity, x, y, children, color = C.card }) => {
  if (t < at || t > out + 0.3) return null;
  const k = E.outBack(clamp((t - at) / 0.45), 1.8);
  const o = Number.isFinite(out) ? E.inCubic(clamp((t - out) / 0.3)) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${k * (1 - 0.3 * o)})`, transformOrigin: "50% 100%", opacity: 1 - o }}>
      <div style={{ position: "relative", background: color, borderRadius: 40, padding: "16px 30px 20px", boxShadow: "0 14px 30px rgba(60,40,20,0.2)", whiteSpace: "nowrap" }}>{children}</div>
      {[18, 11].map((r, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: `calc(100% + ${8 + i * 22}px)`, width: r, height: r, marginLeft: -r / 2 + (i + 1) * 10, borderRadius: r, background: color, boxShadow: "0 6px 12px rgba(60,40,20,0.15)" }} />
      ))}
    </div>
  );
};

/** 数字滚动显示（带千分位外的普通格式） */
export const rollTo = (t: number, a: number, b: number, from: number, to: number) => lerp(from, to, E.outCubic(clamp((t - a) / (b - a))));

/** 计数器小部件：图标 + 标签 + 数字（数字跳动） */
export const Counter: React.FC<{ t: number; at: number; x: number; y: number; label: string; v: number; unit?: string; color?: string; icon?: React.ReactNode }> = ({
  t,
  at,
  x,
  y,
  label,
  v,
  unit,
  color = C.red,
  icon,
}) => {
  if (t < at) return null;
  const k = E.outBack(clamp((t - at) / 0.45), 1.8);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${k})`, transformOrigin: "0% 50%", display: "flex", alignItems: "center", gap: 14, background: C.card, borderRadius: 20, padding: "12px 22px", boxShadow: "0 6px 0 #DED2BE, 0 16px 30px rgba(70,50,20,0.16)", whiteSpace: "nowrap" }}>
      {icon}
      <span style={{ fontFamily: SANS, fontSize: 28, color: C.sub }}>{label}</span>
      <span style={{ fontFamily: NUM, fontWeight: 700, fontSize: 44, color }}>{v}</span>
      {unit && <span style={{ fontFamily: SANS, fontSize: 24, color: C.sub }}>{unit}</span>}
    </div>
  );
};
