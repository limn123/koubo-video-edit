import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// 本地字体（免费可商用，原文件在项目根 fonts/，按用字子集化后放 public/fonts，见 scripts/subset_fonts.py）
// 层级：得意黑=大标题/金句；思源黑体 Medium=说明文字（与字幕同款）；Inter Tight=数字与英文标注
// 权重范围注册为 100–900：任何 fontWeight 都直接命中这一个字形文件，浏览器不会合成假粗体
const FONTS: [string, string, string][] = [
  ["Smiley Sans", "fonts/SmileySans-Oblique.ttf", "100 900"],
  ["Noto Sans SC", "fonts/NotoSansSC-Medium.otf", "100 900"],
  ["Inter Tight", "fonts/InterTight-VF.ttf", "100 900"],
];

let loaded = false;
export const ensureFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("fonts");
  Promise.all(
    FONTS.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)})`, { weight });
      return f.load().then((ff) => document.fonts.add(ff));
    }),
  )
    .then(() => continueRender(h))
    // 字体加载失败直接中止渲染，绝不静默回退
    .catch((e) => cancelRender(e));
};

// SERIF 沿用旧名：现在是“标题字体”（得意黑）
export const SERIF = '"Smiley Sans", "Noto Sans SC", sans-serif';
export const SANS = '"Noto Sans SC", sans-serif';
export const NUM = '"Inter Tight", "Noto Sans SC", sans-serif';
