// 本条视频：本地示例花园的缺点——优点简单讲（11 栋楼、商超、户型集齐、物业着重），缺点着重讲：物业收费争议 / 人工湖打理 / 楼王 2 号楼平面窗冬天冷。
// 时间均为粗剪成片秒数（用户降噪后的粗剪再精剪，未调速，transcript_rough.json）
import type { Mode } from "./engine/Presenter";
import type { Cue } from "./engine/Sfx";
import type { FullTitleSpec } from "./fulltitle";
import sfx from "./sfx.json";
import faceTrack from "./data/face.json";

export const FPS = 30; // 与 rough.mp4 一致
export const DURATION = 98.566667; // rough.mp4 时长（2957 帧，含结尾补的 2 秒定格）
export const VIDEO = "rough.mp4";
export const ORIENTATION: "landscape" | "vertical" = "vertical";
export const PIP_CORNER: "tr" | "tl" = "tr";

/* 时间轴：动画都按上一版粗剪（v2）的时间写（下称“旧时间”），新粗剪在最前面加了 5.4 秒钩子、删掉了旧 29.03–34.50 那句。
   toOld(新时间) → 旧时间：钩子段是负数（-5.4 … 0），之后每段一个固定偏移（按逐段裁切的整帧数算出来的） */
export const TEASER = 5.4;
const SEGMAP: [number, number][] = [
  [0, -5.4],
  [34.433333, 34.5],
  [67.2, 67.27],
  [78.533333, 78.62],
  [83.633333, 83.71],
];
export const toOld = (t: number) => {
  let k = 0;
  for (let i = 0; i < SEGMAP.length; i++) if (t >= SEGMAP[i][0]) k = i;
  return SEGMAP[k][1] + (t - SEGMAP[k][0]);
};

/* 人物跟踪：新粗剪上每 0.1 秒一个点（正脸 + 左右侧脸检测，去跳点后高斯平滑），Catmull-Rom 样条插值，圆环跟着人走不顿。
   圆环半径跟脸的大小走（远景脸小、走到镜头前脸大），框住头肩；中心放在脸下方半张脸 */
const TRACK = faceTrack as [number, number, number, number, number][];
const STEP = 0.1;
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
export const faceAt = (t: number) => {
  const f = Math.max(0, Math.min(TRACK.length - 1.001, t / STEP));
  const i = Math.floor(f);
  const u = f - i;
  const g = (j: number) => TRACK[Math.max(0, Math.min(TRACK.length - 1, j))];
  const v = (c: 1 | 2 | 3 | 4) => cr(g(i - 1)[c], g(i)[c], g(i + 1)[c], g(i + 2)[c], u);
  const w = v(3);
  const r = Math.max(105, Math.min(200, w * 1.55));
  // 第 5 列：圆环补光的伽马指数（逆光脸暗，只在圆环里提暗部；全屏不加任何滤镜）
  return { x: v(1), y: v(2) + w * 0.5, r, g: Math.max(0.55, Math.min(1, v(4))) };
};
export const FACE = faceAt(0);

// 人物全屏 / 圆环：开场、“缺点来了”、“个人意见”+ 人工湖实景、“楼王 2 号楼”全屏，其余讲解段缩进圆环
export const MODES: Mode[] = [
  { t: -5.4, mode: "full" },
  { t: 7.55, mode: "pip" },
  { t: 34.5, mode: "full", dur: 0.5 },
  { t: 35.85, mode: "pip", dur: 0.55 },
  { t: 53.05, mode: "full", dur: 0.55 },
  { t: 73.15, mode: "pip", dur: 0.55 },
];

// 全屏段人物下移量：远景人物脸在 y≈830–960，头顶天空足够放标题纸条，不用下移
const FULL_DY_SEG: [number, number, number][] = [[0, 999, 0]];
export const fullDY = (t: number) => (FULL_DY_SEG.find(([a, b]) => t >= a && t < b) ?? FULL_DY_SEG[0])[2];

// 人物全屏段的标题（米白纸条 + 墨绿字）
export const FULL_TITLES: FullTitleSpec[] = [
  { at: 34.52, out: 35.7, kicker: "说完优点", text: "缺点来了！", hl: "缺点", color: "#D9483B", size: 110 },
  { at: 53.3, out: 55.4, kicker: "以上", text: "仅代表\n主播个人意见", hl: "个人意见", lineAt: [53.6, 54.3], color: "#2A8C5F", size: 92 },
  {
    at: 55.62,
    out: 67.3,
    kicker: "缺点 ②",
    text: "人工湖打理",
    hl: "人工湖",
    color: "#D9483B",
    size: 100,
    chips: [["好环境靠大家维护", "#2A8C5F"], ["物业先清理干净", "#E07A35"], ["舒适的环境", "#183D33"]],
    chipTimes: [60.5, 63.5, 66.3],
  },
  { at: 67.78, out: 73.0, kicker: "缺点 ③", text: "楼王 2 号楼\n我不太喜欢", hl: "不太喜欢", lineAt: [69.6, 70.95], color: "#D9483B", size: 96 },
];

export const SFX = sfx as Cue[];
