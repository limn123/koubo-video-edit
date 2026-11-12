import { ORIENTATION, PIP_CORNER } from "../project";

export const C = {
  // 米白纸面 + 墨绿文字 + 橙（挂牌）/ 绿（成交）/ 红（下跌·警示），与《本地好卖小区自查表》同一套视觉
  bg: "#F4EFE6",
  bg2: "#EBE3D5",
  card: "#FFFDF8",
  slab: "#DDD1BD",
  text: "#183D33",
  sub: "#566660",
  muted: "#8E968F",
  line: "rgba(24,61,51,0.12)",
  orange: "#E07A35",
  green: "#2A8C5F",
  red: "#D9483B",
  deep: "#183D33",
  white: "#FFFFFF",
  // 兼容旧名
  ink: "#F4EFE6",
  paper: "#183D33",
  amber: "#E07A35",
  coral: "#D9483B",
  teal: "#2A8C5F",
};

export const VERTICAL = ORIENTATION === "vertical";

// 设计画布：横版 1920×1080 / 竖版 1080×1920（渲染时 --scale=2 输出 3840×2160 / 2160×3840）
export const W = VERTICAL ? 1080 : 1920;
export const H = VERTICAL ? 1920 : 1080;

// 人物圆环 PIP、圆环禁放区 PIP_KEEPOUT（矩形）、字幕带 SUB_BAND（尽量不放关键信息）
// 横版：圆环在右下角，字幕在底部。
// 竖版：平台底部约 25% 被作者名/标题/音乐条遮挡，右侧中下部是点赞/评论按钮列，顶部约 170px 是状态栏和频道标签，
//       所以圆环放上部一角（顶部栏下方），字幕底边落在距底部约 1/3 处（y≈1280），底部 1/4 只放背景。
const PIP_TR = { x: 880, y: 360, r: 150 };
const PIP_TL = { x: 200, y: 360, r: 150 };
export const PIP = VERTICAL ? (PIP_CORNER === "tl" ? PIP_TL : PIP_TR) : { x: 1714, y: 862, r: 150 };
export const PIP_KEEPOUT = VERTICAL
  ? PIP_CORNER === "tl"
    ? { x0: 0, y0: 170, x1: 380, y1: 540 }
    : { x0: 700, y0: 170, x1: 1080, y1: 540 }
  : { x0: 1500, y0: 650, x1: 1920, y1: 1080 };
// 圆环段字幕底边 y≈1390（ASS 2780）；主视觉区 y 560–1310
export const SUB_BAND = VERTICAL ? { y0: 1300, y1: 1400 } : { y0: 945, y1: 1080 };
// 竖版平台界面遮挡区：顶部栏、右侧按钮列、底部信息区——都不放关键信息
// 抖音手机端实测（<工作目录>\抖音安全区示意.png）：顶栏 y<112，右侧按钮列 x≥935、y 815–1785，底部信息区 y≥1480，左边距 33
// 按“宽松安全区”排（用户：底部还留很多、右边压一点点没关系）：x 33–975，y 112–1600；
// 不能盖住的是右侧按钮图标本身（圆心 x≈1010、半径≈48）、底部作者名（y≥1607）和文案条
export const PLATFORM_UI = VERTICAL ? { top: 112, left: 33, rightX: 935, rightY0: 815, rightY1: 1785, bottom: 1480 } : null;
export const SAFE = VERTICAL ? { x0: 33, x1: 975, y0: 112, y1: 1600 } : { x0: 0, x1: 1920, y0: 0, y1: 1080 };
