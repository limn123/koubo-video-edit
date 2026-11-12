import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "./engine/fonts";
import { Presenter, pipProgress } from "./engine/Presenter";
import { C } from "./engine/theme";
import { E, clamp } from "./engine/ease";
import { Backdrop, BottomStage, WHIPS } from "./bg";
import { BottomShade, LakeMark } from "./overlay";
import { Cover, FullFrame, FullTitle } from "./fulltitle";
import { OpenHook } from "./hook";
import { EndCard, Teaser } from "./teaser";
import { FilmGrain, WhipSeam, shake } from "./fx";
import { S1_Good } from "./scenes/S1_Good";
import { S2_Fee } from "./scenes/S2_Fee";
import { S3_Cold } from "./scenes/S3_Cold";
import { FULL_TITLES, MODES, VIDEO, faceAt, toOld } from "./project";

ensureFonts();

// 冲击抖动（只作用于 B-roll 舞台，人物不抖）：结论落点
export const HITS: [number, number][] = [
  [26.62, 0.5],
  [48.1, 0.5],
  [86.94, 0.9],
  [90.5, 0.4],
  [95.2, 0.5],
];

// 画面合成；音频不在这里（渲染加 --muted，用 mix_audio.py 混人声+音效，final_compose 合成）
// 人物全屏时：不叠颗粒、暗角、漏光、故障、压暗渐变——人物保持原片色彩，只有标题纸条和顶部角标。
export const Story: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // tn = 新粗剪时间（视频、人脸跟踪用）；t = 旧时间（所有动画都按它写，见 project.ts 的 toOld）
  const tn = frame / fps;
  const t = toOld(tn);
  const pip = pipProgress(t, MODES);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {pip > 0.001 && (
        <AbsoluteFill>
          <Backdrop t={t} />
          <BottomStage t={t} />
          <AbsoluteFill style={{ transform: shake(t, HITS, 0.8) }}>
            <S1_Good t={t} />
            <S2_Fee t={t} />
            <S3_Cold t={t} />
          </AbsoluteFill>
          {WHIPS.map((w) => (
            <WhipSeam key={w} t={t} at={w} />
          ))}
          {/* 纸面颗粒与暗角只铺在 B-roll 上（在人物下面） */}
          <FilmGrain frame={frame} opacity={0.05} />
          <BottomShade pip={pip} />
        </AbsoluteFill>
      )}
      {/* 94.3s 起她转身背对镜头，圆环缩小收走（结尾卡片 95.85s 从同一位置展开） */}
      <AbsoluteFill style={{ transformOrigin: "880px 360px", transform: `scale(${1 - E.inCubic(clamp((t - 94.3) / 0.35))})` }}>
        <Presenter t={t} modes={MODES} src={VIDEO} face={faceAt(tn)} />
      </AbsoluteFill>
      <FullFrame t={t} full={1 - pip} />
      <LakeMark t={t} />
      {FULL_TITLES.map((s, i) => (
        <FullTitle key={i} t={t} s={s} />
      ))}
      <Cover t={t} />
      <OpenHook t={t} />
      <Teaser tn={tn} />
      <EndCard t={t} />
    </AbsoluteFill>
  );
};
