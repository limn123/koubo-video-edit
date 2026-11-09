# 口播动效工程模板

这是一条房产话题口播的完整示例工程（小区优缺点点评），去掉了 rough.mp4、音效和 node_modules，可以直接编译。用法见上一级 SKILL.md 第 2 步。

- `src/project.ts`：时长、`MODES`、`FULL_DY_SEG`、`FULL_TITLES`；`faceAt`（0.1s 人脸轨迹 + Catmull-Rom 插值 + 圆环半径跟脸宽 + 第 5 列补光伽马）；`toOld/SEGMAP`（动画写完后又改剪辑时的时间对照，新片从头做设 `[[0, 0]]`）。
- `src/engine/`：Presenter（全屏/圆环、全屏推近、圆环补光只在圆环状态）、缓动、字体（`fonts.ts` 按风格卡登记：SERIF=标题、SANS=标注、NUM=数字）、配色与版面分区。
- `src/bg.tsx`：固定背景，只改 WHIPS、RAIL、railOn。
- `src/fulltitle.tsx`：全屏纸条标题和开场封面；`src/hook.tsx`：开场道具和 PUNCH 推近；`src/teaser.tsx`：前置钩子 + 结尾评论卡；`src/overlay.tsx`：实景标注（湖面圈注示例）。
- `src/scenes/`：上一条的 S1_Good / S2_Fee / S3_Cold，作为写法参考，新视频整组重写。
- 积木：`kit.tsx`、`parts.tsx`、`parts2.tsx`、`parts3.tsx`、`parts4.tsx`。
- `scripts/sfx_v7.py` + `sfx_baokuan.py`：音效合成（含衣架音阶、木琴、两种消息/印章、闪白、打哆嗦、道闸等），每条复制成新版本再调。`scripts/cues.py`：音效时间表（钩子用新时间、正片用动画时间自动换算），每条重写。
- 准备：
  1. `public/rough.mp4`（2160 宽）
  2. `src/data/face.json`（`face_dense.py` + `face_gain.py` 生成，5 列）
  3. `public/clips/pXX.jpg`（只放本条素材）
  4. `python <skill>/scripts/subset_fonts.py . <字体完整路径…>` 生成 `public/fonts`
  5. 运行 sfx 脚本生成 `public/sfx`
