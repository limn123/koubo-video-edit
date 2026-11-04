import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "./engine/fonts";
import { Presenter, pipProgress } from "./engine/Presenter";
import { C } from "./engine/theme";
import { Backdrop, BottomStage, WHIPS } from "./bg";
import { BottomShade, CommentArrow, CommentBox } from "./overlay";
import { Cover, FullFrame, FullTitle } from "./fulltitle";
import { OpenHook } from "./hook";
import { FilmGrain, WhipSeam, shake } from "./fx";
import { S1_Hook } from "./scenes/S1_Hook";
import { S2_Hand } from "./scenes/S2_Hand";
import { S3_Next } from "./scenes/S3_Next";
import { S4_Anchor } from "./scenes/S4_Anchor";
import { S5_Cost } from "./scenes/S5_Cost";
import { S6_Ask } from "./scenes/S6_Ask";
import { S7_Neutral } from "./scenes/S7_Neutral";
import { FULL_TITLES, MODES, VIDEO, faceAt } from "./project";

ensureFonts();

// 冲击抖动（只作用于 B-roll 舞台，人物不抖）：结论落点
export const HITS: [number, number][] = [
  [41.62, 0.5],
  [53.78, 0.5],
  [62.42, 0.4],
  [80.52, 0.6],
  [95.45, 0.5],
  [100.95, 0.9],
  [106.72, 0.9],
  [123.18, 0.4],
];

// 画面合成；音频不在这里（渲染加 --muted，用 mix_audio.py 混人声+音效，final_compose 合成）
// 人物全屏时：不叠颗粒、暗角、漏光、故障、压暗渐变——人物保持原片色彩，只有标题纸条和顶部角标。
export const Story: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pip = pipProgress(t, MODES);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {pip > 0.001 && (
        <AbsoluteFill>
          <Backdrop t={t} />
          <BottomStage t={t} />
          <AbsoluteFill style={{ transform: shake(t, HITS, 0.8) }}>
            <S1_Hook t={t} />
            <S2_Hand t={t} />
            <S3_Next t={t} />
            <S4_Anchor t={t} />
            <S5_Cost t={t} />
            <S6_Ask t={t} />
            <S7_Neutral t={t} />
          </AbsoluteFill>
          {WHIPS.map((w) => (
            <WhipSeam key={w} t={t} at={w} />
          ))}
          {/* 纸面颗粒与暗角只铺在 B-roll 上（在人物下面） */}
          <FilmGrain frame={frame} opacity={0.05} />
          <BottomShade pip={pip} />
        </AbsoluteFill>
      )}
      <Presenter t={t} modes={MODES} src={VIDEO} face={faceAt(t)} />
      <FullFrame t={t} full={1 - pip} />
      {FULL_TITLES.map((s, i) => (
        <FullTitle key={i} t={t} s={s} />
      ))}
      <Cover t={t} />
      <OpenHook t={t} />
      <CommentBox t={t} />
      <CommentArrow t={t} />
    </AbsoluteFill>
  );
};
