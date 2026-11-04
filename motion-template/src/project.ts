// 本条视频：示例工程——买家把价砍到你心慌，这一刀该不该接？看三样：他手里拿的价 / 他走了之后 / 你心里的价对着什么定的。
// 时间均为粗剪成片秒数（原片 1.1 倍速，transcript_rough.json）
import type { Mode } from "./engine/Presenter";
import type { Cue } from "./engine/Sfx";
import type { FullTitleSpec } from "./fulltitle";
import sfx from "./sfx.json";
import faceTrack from "./data/face.json";

export const FPS = 30; // 与 rough.mp4 一致
export const DURATION = 164.566667; // rough.mp4 时长（4937 帧）
export const VIDEO = "rough.mp4";
export const ORIENTATION: "landscape" | "vertical" = "vertical";
export const PIP_CORNER: "tr" | "tl" = "tr";

// 人物头肩中心：OpenCV 人脸跟踪（每 0.5s，已平滑；y≈鼻尖），半径取能完整装下头部的大小
const FACE_R = 520;
const TRACK = faceTrack as [number, number, number][];
export const faceAt = (t: number) => {
  const i = Math.max(0, Math.min(TRACK.length - 2, Math.floor(t / 0.5)));
  const [t0, x0, y0] = TRACK[i];
  const [t1, x1, y1] = TRACK[i + 1];
  const k = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - 40, r: FACE_R };
};
export const FACE = faceAt(0);

// 人物全屏 / 圆环：开场钩子、“看三样”、“一个毛病”、“都有人疼”、入行背书与结尾号召全屏，其余讲解段缩进圆环
export const MODES: Mode[] = [
  { t: 0, mode: "full" },
  { t: 6.5, mode: "pip" },
  { t: 27.72, mode: "full", dur: 0.5 },
  { t: 30.42, mode: "pip", dur: 0.55 },
  { t: 113.6, mode: "full", dur: 0.5 },
  { t: 115.58, mode: "pip", dur: 0.5 },
  { t: 129.12, mode: "full", dur: 0.5 },
  { t: 132.48, mode: "pip", dur: 0.5 },
  { t: 146.72, mode: "full" },
  { t: 154.26, mode: "pip", dur: 0.5 },
  { t: 157.86, mode: "full", dur: 0.5 },
];

// 全屏段人物整体下移量（设计坐标，只是位移，不加任何滤镜）：发际线落到 y≈610 以下，头顶 185–560 留给标题纸条。
// 实测发际线 ≈ 人脸跟踪 y − 350；各段取值让发际线 ≥ 610。切换都发生在圆环段里，观众看不到跳动
const FULL_DY_SEG: [number, number, number][] = [
  [0, 27.72, 80],
  [27.72, 30.42, 90],
  [30.42, 115.58, 125],
  [115.58, 132.48, 115],
  [132.48, 999, 120],
];
export const fullDY = (t: number) => (FULL_DY_SEG.find(([a, b]) => t >= a && t < b) ?? FULL_DY_SEG[0])[2];

// 人物全屏段的标题（版式见 fulltitle.tsx：米白纸条 + 墨绿字，不铺暗色渐变）：hl=关键词色块；lineAt=每行单独出现时间
export const FULL_TITLES: FullTitleSpec[] = [
  { at: 27.78, out: 30.3, kicker: "那这一刀到底", text: "看什么？", hl: "看什么", size: 108, chips: [["① 他手里的价", "#E07A35"], ["② 他走了之后", "#2A8C5F"], ["③ 你心里的价", "#D9483B"]], chipsAt: 29.55, chipTimes: [29.55, 29.85, 30.1] },
  { at: 113.66, out: 115.48, kicker: "这三样说到底", text: "是一个毛病", hl: "毛病", color: "#D9483B", size: 104 },
  { at: 129.2, out: 132.36, kicker: "接和不接", text: "都有人疼\n疼在哪你看不出", hl: ["看不出", "疼"], lineAt: [129.3, 131.6], color: "#D9483B", size: 92 },
  { at: 146.8, out: 150.6, kicker: "我自己", text: "当过两回买家\n怎么砍价我清楚", hl: ["买家", "清楚"], lineAt: [147.5, 149.2], color: "#2A8C5F", size: 92 },
  { at: 150.72, out: 154.16, kicker: "2019 年入行", text: "天天盯本地\n各小区真实成交价", hl: "真实成交价", lineAt: [152.0, 153.1], size: 90 },
  {
    at: 157.96,
    out: 161.6,
    kicker: "把这 4 样",
    text: "打在评论区",
    hl: "评论区",
    lineAt: [158.05],
    size: 100,
    // 下面是评论框示范（overlay.tsx 的 CommentBox），随口播逐项打字
  },
  { at: 161.7, out: 166, kicker: "我帮你看看", text: "这一刀\n该不该接", hl: "该不该接", lineAt: [162.0, 163.5], color: "#2A8C5F", size: 104 },
];

export const SFX = sfx as Cue[];
