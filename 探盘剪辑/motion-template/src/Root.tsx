import React from "react";
import { Composition } from "remotion";
import { Vlog } from "./Vlog";
import main from "./data/main.json";

// 时间线里的 fps 决定帧率：出 1080 预览用 30，出 4K60 用 60（见 scripts/build_full.py 的环境变量）
const m = main as any;
export const Root: React.FC = () => (
  <Composition id="Main" component={Vlog} durationInFrames={m.frames} fps={m.fps} width={1080} height={1920} defaultProps={{ tl: m }} />
);
