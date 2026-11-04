---
name: koubo-video-edit
description: 把自录的竖版口播视频一条龙剪成可直接发抖音/视频号/小红书的成片：粗剪（删口误卡顿）+ 按实测语速调速、米白纸面风格的 B-roll 讲解动画（人物缩进右上圆环）、开头钩子、全屏关键词推近、每条重新合成的爆款音效、关键词标红的单行字幕、抖音安全区排版、全屏不加滤镜不挡脸，最后自动自检并交付。用户上传口播视频（可附文案和照片素材）说“剪辑这个视频”“口播剪辑”“剪口播”“把口播剪成片”“加 B-roll / 字幕 / 音效”时使用。
---

# 竖版口播剪辑

用户给一段自己录的**竖版**口播（常见 2160×3840 / 1080×1920，30fps），同目录可能有 `口播文案.txt` 和 `素材/` 照片。你要交付一条**能直接发布**的成片，不能只交中间文件或建议。

成片的构成：
- 粗剪后的口播
- 代码生成的 B-roll 讲解动画（Remotion），讲解时人物缩成右上角圆环，总起、总结、背书、号召时人物全屏
- 程序化合成的音效
- 居中单行字幕，关键词标红

基于 [LeaderAI「Lead-自媒体口播剪辑」](LICENSE.leaderai)（MIT）改写，加入了在真实账号上反复调出来的一套默认规矩。

## 默认规矩（每条都遵守，用户另有要求时以用户为准）

1. **人物全屏不加任何滤镜**
   - 全屏画面就是原片色彩，不叠颗粒、暗角、压暗渐变、漏光、故障效果。颗粒和暗角只铺在 B-roll 纸面上，在人物下层。
   - Remotion 每次渲染都加 `--color-space=bt709`，否则画面会偏绿。
   - 成片用 `color_check.py` 比对颜色。
2. **字幕、标题、标签、箭头都不挡脸**
   - 全屏段人物整体下移 `fullDY`，只是位移。标题做成米白纸条，放在头顶 y 185–560。其他道具只放在脸两侧或头顶的空白处。
   - 全屏字幕放在锁骨位置（ASS 底边 y=2940）。全屏推近时下巴会下到约 y 1300，字幕放高了会压脸。
   - 成片后用 `fullscreen_sub_check.py` 逐帧确认。
3. **背景固定**：用 `motion-template/src/bg.tsx`，包括米白纸面、测绘网格、斜穿的河道、等高线、底部透视地面、章节进度条、镂空章节大字。每条只改章节名和时间，不换纹样，保持账号风格统一。
4. **开头要有亮点**
   - 第 0 帧就是完整封面（米白纸条大标题），画面从第 0 帧就在动（开机拉镜和晃动的道具）。
   - 前 6 秒跟着口播关键词卡点：做一个和主题相关的比喻道具动画，加人物推近和一次冲击音效。
5. **动画流畅、不重复**：每个讲解段换不同的转场和不同的比喻动画。大字冲击全片不超过 3 处。见 `references/动画与版式.md`。
6. **音效每条重新合成、不重复**
   - 用爆款口播那类一听就懂的声音。一类动作固定一种声音，同类做变体轮换，同一个声音不连续出现。
   - 音效比人声峰值低：中位数 10–13 dB，最少 6 dB。见 `references/音效规范.md`。
7. **抖音安全区按宽松版排**（1080×1920 设计坐标）
   - 主信息放在 **x 33–975、y 112–1600**。卡片边压进按钮列一点点没关系。
   - 不能盖住：右侧按钮图标（圆心 x≈1010、半径≈48、y 875–1720）、底部作者名和文案（y≥1607）、顶栏（y<112）。
   - 示意图：`references/抖音安全区示意.png`。检查用 `safearea_check.py`。
8. **语速以流畅为准，倍率按实测计算**
   - 目标约 5.4 字/秒。倍率 = 5.4 ÷ 实测，四舍五入到 0.05，范围 0.9–1.25。
   - 实测已经在 5.0–5.8 字/秒就不调；说得太快可以略放慢。
   - 画面用 setpts，声音用 atempo，音调不变。不靠剪掉句间停顿来提速，否则全屏会跳切。
9. **不确定就问**：口播里听不清或前后矛盾的数字，先给选项问用户，不要猜。画面里的举例、走势、示例留言都标“示意”或“示例”，示例数字要和片中数据的量级一致。

## 环境

- FFmpeg（有 h264_nvenc 就用）
- Python 3.10+：openai-whisper（推荐 `large-v3-turbo`）、numpy、Pillow、opencv-python、fontTools、jieba
- Node 22+（Remotion 4）
- 字体都在 `assets/fonts/`：
  - 字幕：IBM Plex Sans SC SemiBold
  - 动画：得意黑 Smiley Sans（标题）、思源黑 Noto Sans SC Medium（说明）、Inter Tight（数字）
- 运行 Python 时设 `PYTHONIOENCODING=utf-8`。
- 下文路径记号：`$S` = 本 skill 的 `scripts/` 绝对路径，`$W` = 工作素材目录，`$M` = 动效工程目录。
- 目录约定：
  - 输出：视频所在目录的 `剪辑成果/`
  - 中间文件：`剪辑成果/工作素材/`
  - 动效工程：`<工作目录>/.code/<项目名>/motion`
- 长的 Python 补丁写成文件再执行，不要塞进 shell heredoc，那样容易被引号截断。

## 流程

### 0. 看素材
- `ffprobe` 看分辨率、帧率、时长。
- 抽 4 帧看人物的位置。
- `素材/` 里的照片拼一张联系表看一遍：照片会用进 B-roll，文件名里通常有地点或名称。

### 1. 转写、粗剪、调速
```bash
ffmpeg -i 口播视频.mov -vn -ac 1 -ar 16000 $W/audio16k.wav
python $S/transcribe.py $W/audio16k.wav $W/transcript_raw.json --terms "<专有名词，空格分隔>"
python $S/probe_windows.py $W/audio16k.wav --win 5 --hop 2.5 > $W/probe.txt     # 重叠短窗复听，抓重说
python $S/speech_islands.py $W/audio16k.wav islands --thr -42 > $W/islands.txt   # 能量岛 = 真实切点
python $S/speech_islands.py $W/audio16k.wav listen s1 e1 s2 e2 …                # 可疑段精听
```
- 判断标准见 `references/粗剪规则.md`：有文案时按文案顺序，每句保留最完整的一遍；没有文案时按技巧模式。
- 一遍过的口播重点抓三样：0.3–0.6 秒的孤立短岛（卡顿、残留起句）、口误、数字。
- 数字听不准时，裁出 2–3 秒片段换个 prompt 再转写；还拿不准就问用户。
- `--terms` 只放专有名词。可以在 `references/` 里给本账号建一份地名、小区名、品牌名词库，每次都带上。
- 统计字/秒（汉字和数字个数 ÷ 首字到末字的时长），按规矩 8 算出倍率，写进 `edl.json`。edl 格式：keep / removed / speed / speed_note。
```bash
python $S/rough_speed.py 口播视频.mov $W/edl.json $W/rough.mp4        # 裁切 + 调速 + 缩到 1440×2560，BT.709
ffmpeg -i $W/rough.mp4 -vn -ac 1 -ar 16000 $W/rough16k.wav
python $S/transcribe.py $W/rough16k.wav $W/transcript_rough.json --terms "…"   # 之后卡点和字幕都用它
```
剪点前后 3 秒用 `listen` 复核；复听开头、中段、结尾，确认语速自然。

### 2. 动效工程
```bash
cp -r <skill>/motion-template $M
cd $M && npm ci                     # 或者用目录联接 / 软链接复用上一个工程的 node_modules（约 800MB）
cp $W/rough.mp4 public/rough.mp4
python $S/face_track.py $W/rough.mp4 src/data/face.json      # 人脸轨迹，用于圆环取景和 fullDY
# 素材照片转成 ASCII 文件名放进 public/clips/（p01.jpg …，长边 ≤1200）
```
模板是一条完整的示例工程（房产话题，能直接编译）。**在它上面改写，不要从零写：**
- `src/project.ts`：`DURATION`（粗剪帧数 ÷ 30）、`MODES`（全屏/圆环切换）、`FULL_DY_SEG`、`FULL_TITLES`
- `src/kit.tsx` 的 `CHAPTERS`；`src/bg.tsx` 的 `WHIPS`、`RAIL`、`railOn`
- `src/fulltitle.tsx` 的 `Cover`（封面纸条）
- `src/hook.tsx`：开头钩子道具和 `PUNCH` 推近关键帧
- `src/overlay.tsx`：结尾评论区箭头和评论框示范
- `src/scenes/`：示例的 S1–S7，整组重写成本条内容。可复用的积木：
  - `parts2.tsx`：Block 转场容器、Kinetic 大字、Snap 快门照片、Odo 数字滚轮
  - `parts3.tsx`：Walker 走路小人、Magnifier 放大镜
  - `parts4.tsx`：Cleaver 菜刀、Tag 价签、Fig 小人、Gauge 仪表盘、Gavel 法槌、Gift 礼盒、Pill 胶囊、QMark 问号
  - `kit.tsx`：Title 标题区、Stamp 印章、Reveal、Pop、图标

写场景之前，先写 `$W/分镜.md`，格式和版式规则见 `references/动画与版式.md`。场景写完、或者加了新字，都要跑字体子集化：`python $S/subset_fonts.py $M`

### 3. 音效（每条重新合成）
- 把 `scripts/sfx_v4.py` 复制成本条的 `sfx_vN.py`：换随机种子，调各个声音的频率和包络，为本条新出现的动作补声音。
- 改写 `scripts/cues.py`：每条音效卡在动作那一帧（关键词起音前 0–0.15 秒），用 `FAMILY` 做变体轮换。脚本会拦截重复和重叠。
```bash
python scripts/sfx_vN.py public/sfx && python scripts/cues.py src/sfx.json
python $S/normalize_voice.py $W/rough.mp4 $W/voice.wav
python $S/mix_audio.py --voice $W/voice.wav --sfx-dir public/sfx --cues src/sfx.json --duration <秒> --out $W/mix.wav
python $S/sfx_headroom.py --voice $W/voice.wav --sfx-dir public/sfx --cues src/sfx.json --duration <秒>
```

### 4. 字幕
需要三个文件：
- `$W/subtitle_text.txt`：实际说出的话，改正识别错字。数字用阿拉伯数字，或者保留口语写法如“一万七八一平”。
- `$W/terms.txt`：不能拆开的词。
- `$W/keywords.txt`：要标红的数字和结论，10–30 个。
```bash
python $S/make_subtitles.py --words $W/transcript_rough.json --text $W/subtitle_text.txt --terms $W/terms.txt --out-dir $W --layout vertical
python $S/restyle_subs.py $W/字幕.ass $W/字幕.ass --project $M/src/project.ts     # 墨绿字白描边；圆环段 y=2780，全屏段 y=2940
python $S/highlight_subs.py $W/字幕.ass $W/字幕.ass --keywords $W/keywords.txt    # 关键词标红
```
逐行读 `字幕_断句检查.txt`：数字和单位、定语和中心词、动词和宾语都不能拆开；只剩一两个字的孤行，补 terms 后重跑。详见 `references/字幕规范.md`。

### 5. 渲染与检查
```bash
cd $M && npx tsc --noEmit && npx remotion bundle --out-dir ../bundle
npx remotion still ../bundle Final ../stills/x.jpg --frame=N --scale=0.5 --gl=angle --color-space=bt709    # 关键帧
npx remotion render ../bundle Final ../draft.mp4 --scale=0.5 --gl=angle --muted --color-space=bt709        # 半分辨率草稿（后台跑）
python $S/contact.py ../draft.mp4 ../sheets --step 0.5 --cols 8 --rows 4                                    # 联系表
python $S/safearea_check.py ../draft.mp4 ../safearea --step 1                                                # 安全区叠图
```
逐张检查以下几点，修完再出一版草稿：
- 有没有压脸
- 元素有没有重叠或出画
- 安全区叠图：白圈（按钮图标）、白框（作者名、文案）里不能有字
- 推镜有没有盖住标题和圆环（推镜只在纸面版心里放大）
- 卡片有没有在入场前提前露出
- 有没有文字被挤成竖排
```bash
npx remotion render ../bundle Final ../broll_master.mp4 --scale=2 --gl=angle --muted --codec=h264 --crf=12 --color-space=bt709   # 4K 母版（后台跑）
```
- 判断渲染完成用 `Encoded <总帧数>/<总帧数>`，不要 grep 文件名：日志开头就包含文件名。
- 只改了一小段时，用 `--frames=A-B` 只渲染那一段，再用 ffmpeg trim + concat 拼回母版（保持 BT.709 标记）。
- 只改字幕时，不用重渲染画面，直接重新合成。

### 6. 合成与自检
```bash
python $S/final_compose.py --video broll_master.mp4 --audio $W/mix.wav --ass $W/字幕.ass --out 剪辑成果/<名称>_成片.mp4
python $S/qa_check.py --video 剪辑成果/<名称>_成片.mp4 --text $W/subtitle_text.txt --work $W
python $S/color_check.py --final 剪辑成果/<名称>_成片.mp4 --rough $W/rough.mp4 --t 1.0 --dy <开头的 fullDY>
python $S/fullscreen_sub_check.py --video 剪辑成果/<名称>_成片.mp4 --motion $M --out $W/look/fullscreen_sub_check.jpg
python $S/safearea_check.py 剪辑成果/<名称>_成片.mp4 $W/safearea --step 2
```
- `qa_check` 报的“疑似残留起句”要逐条判断，排比句是有意的。
- 按 `references/验收清单.md` 逐项打勾。

## 交付
`剪辑成果/` 下面放：
- `<名称>_成片.mp4`：2160×3840、30fps、H.264/AAC、已烧录字幕、-16 LUFS
- `<名称>_字幕.srt` / `<名称>_字幕.ass`
- `剪辑说明.md`：格式见 `references/剪辑说明模板.md`
- `工作素材/`

回复用户时说明：
- 成片路径和时长
- 按规矩做了什么
- 删了什么、调速倍率多少
- 画面里哪些是示意或示例（请用户确认）
- 自检结论
- 没在手机上实际播放过，请用户看一遍
