# 口播动效工程模板（主播版）

这是示例工程（2026-11-04）的完整工程，去掉了素材和 node_modules，可以直接编译。用法见上一级 SKILL.md 第 2 步。

- `src/engine/`：人物全屏/圆环（Presenter，含全屏下移 fullDY 和推近 punch）、缓动、字体、配色与版面分区。`theme.ts` 里 `PLATFORM_UI`、`SAFE`、`SUB_BAND` 是抖音安全区，按宽松版：x 33–975、y 112–1600；字幕底边 1390，进度条 1430。
- `src/project.ts`：时长、MODES、FULL_DY_SEG、FULL_TITLES。每条都要改。
- `src/bg.tsx`：固定背景，只改 WHIPS、RAIL、railOn。
- `src/fulltitle.tsx`：全屏纸条标题和第 0 帧封面。`src/hook.tsx`：开头钩子和 PUNCH 推近。`src/overlay.tsx`：评论区箭头和评论框示范。
- `src/scenes/`：上一条的 S1–S7，作为写法参考，新视频整组重写。
- 积木：`kit.tsx`、`parts.tsx`、`parts2.tsx`、`parts3.tsx`、`parts4.tsx`。
- `scripts/sfx_v4.py` + `sfx_baokuan.py`：音效合成，每条复制成新版本再调。`scripts/cues.py`：音效时间表，每条重写。
- 准备：
  1. `public/rough.mp4`
  2. `public/clips/pXX.jpg`
  3. `python <skill>/scripts/subset_fonts.py .` 生成 `public/fonts`
  4. 运行 sfx 脚本生成 `public/sfx`
