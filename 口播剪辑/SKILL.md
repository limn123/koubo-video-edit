---
name: 口播剪辑
description: 把自录的竖版口播视频一条龙剪成可直接发抖音/视频号/小红书的成片：开工前先看片定风格（字体、主色、节奏）、粗剪精剪（删口误卡顿、删矛盾重复句、可前置钩子、可调顺序）+ 按实测语速调速、米白纸面风格的 B-roll 讲解动画（人物缩进右上圆环，密集跟踪、逆光补光）、开头钩子、全屏关键词推近、每条重新合成且不重复的爆款音效、关键词标红的单行字幕、结尾评论卡、抖音安全区排版、全屏不加滤镜不挡脸，最后自动自检并交付。用户上传口播视频（可附文案和照片素材）说“剪辑这个视频”“口播剪辑”“剪口播”“把口播剪成片”“加 B-roll / 字幕 / 音效”时使用。 用户说“剪口播”“口播剪辑”“剪辑这个视频”时使用。素材是“边走边拍 + 多段实拍空镜”的探盘、探房、看房 Vlog 不用这个，用 探盘剪辑。
---

# 竖版口播剪辑

用户给一段自己录的**竖版**口播（常见 2160×3840 / 1080×1920，30 或 60fps），同目录可能有 `口播文案.txt` 和 `素材/` 照片。你要交付一条**能直接发布**的成片，不能只交中间文件或建议。

成片的构成：
- 粗剪、精剪后的口播
- 代码生成的 B-roll 讲解动画（Remotion），讲解时人物缩成右上角圆环，总起、总结、背书、号召时人物全屏
- 真实录制的音效（默认不加背景音乐，留给用户自己配）
- 居中单行字幕，关键词标红

基于 [LeaderAI「Lead-自媒体口播剪辑」](LICENSE.leaderai)（MIT）改写，加入了在真实账号上反复调出来的一套默认规矩。

## 先说一条：每条片子从它自己的文案长出来

`motion-template/` 是一条完整的示例工程，留着是为了能直接编译、看积木怎么拼。**它的钩子、章节数、比喻动画、标题句式都不是模板。** 每条先读文案、看素材、写分镜，再决定这条的钩子用哪句、分几段、每段用什么比喻。连着两条片子长得一样，就是偷懒了。下面的“默认规矩”管的是底线（不挡脸、不加滤镜、安全区、音效密度），不管内容。

## 默认规矩（每条都遵守，用户另有要求时以用户为准）

1. **人物全屏不加任何滤镜**
   - 全屏画面就是原片色彩，不叠颗粒、暗角、压暗渐变、漏光、故障效果。颗粒和暗角只铺在 B-roll 纸面上，在人物下层。
   - Remotion 每次渲染都加 `--color-space=bt709`，否则画面会偏绿。
   - 成片用 `color_check.py` 比对颜色。圆环里的补光只在圆环状态生效（见第 10 条）。
2. **字幕、标题、标签、箭头都不挡脸**
   - 全屏段人物整体下移 `fullDY`，只是位移（远景人物头顶空间够时为 0）。标题做成米白纸条，放在头顶 y 185–560。其他道具只放在脸两侧或头顶的空白处。
   - 全屏字幕放在胸前（ASS 底边 y=3170，`restyle_subs.py` 的默认值）。全屏推近时下巴会下到约 y 1300，字幕贴着下巴不好看。
   - 近景坐着讲时 `fullDY` 取 120 左右，封面纸条和头顶之间要留空，别压着头发。
   - 成片后用 `fullscreen_sub_check.py` 逐帧确认。
3. **背景固定**：用 `motion-template/src/bg.tsx`，包括米白纸面、测绘网格、斜穿的河道、等高线、底部透视地面、章节进度条、镂空章节大字。每条只改章节名和时间，不换纹样，保持账号风格统一。
4. **开头要有亮点**
   - 第 0 帧就是完整封面（米白纸条大标题），画面从第 0 帧就在动。
   - 前 6 秒跟着口播关键词卡点：做一个和主题相关的比喻道具动画，加人物推近和一次冲击音效。
   - **口播开头只是铺垫时，把全片最有冲击力的一两句剪到最前面当钩子**（约 5 秒），再用闪白转场接原开场。
5. **动画流畅、不重复、够大**
   - 每个讲解段换不同的转场和不同的比喻动画。大字冲击全片不超过 3 处。见 `references/动画与版式.md`。
   - 胶囊标签 ≥40 号、说明字 ≥32；主视觉区 y 560–1300 用满，不留下半屏空白；三位数字要放得进它的图形里。
   - 原片正好在拍讲到的东西时（湖、楼栋、房间），保留实景全屏 + 标注，比画动画更有说服力。
6. **音效用真实录制的、每条重新搭配、不重复、不密**
   - 程序合成的音效听着机械、有“AI 感”，不要用。用 `assets/sfx_real/` 里的真实音效（清单 `sfx_map.json`，首次用先跑 `fetch_sfx.py` 下载）。不够就去 mixkit.co 挑，下载前把清单给用户确认。
   - 一类动作固定一类声音，同类轮换；每条按本条的动作重新排，不照抄上一条的时间表。
   - **默认不加背景音乐**，成片只有人声和音效，配乐留给用户自己加；用户明确要时才加 `--music`。
   - 全片约 50 处，**任意 10 秒 ≤7 下**，同一个声音 ≤3 次、不连续出现。
   - 连续同类动作只在首、尾、最大处出声；“嗖”只用在全屏↔圆环切换和换章节。
   - 音效比人声峰值低：中位数 10–13 dB，最少 6 dB。见 `references/音效规范.md`。
7. **抖音安全区按宽松版排**（1080×1920 设计坐标）
   - 主信息放在 **x 33–975、y 112–1600**。卡片边压进按钮列一点点没关系。
   - 不能盖住：右侧按钮图标（圆心 x≈1010、半径≈48，y 875/1060/1215/1370/1540/1720，评论按钮约 y 1215）、底部作者名和文案（y≥1607）、顶栏（y<112）。
   - 示意图：`references/抖音安全区示意.png`。检查用 `safearea_check.py`。
8. **语速以流畅为准，倍率按实测计算**
   - 目标约 5.4 字/秒。倍率 = 5.4 ÷ 实测，四舍五入到 0.05，范围 0.9–1.25。
   - 实测已经在 5.0–5.8 字/秒就不调；说得太快可以略放慢。
   - 画面用 setpts，声音用 atempo，音调不变。不靠剪掉句间停顿来提速，否则全屏会跳切。
9. **不确定就问、不编素材**：口播里听不清或前后矛盾的数字，先给选项问用户，不要猜。画面只用本条的照片和原片画面，不借别的视频的照片；没有素材就画示意动画。举例、走势、示例留言都标“示意”或“示例”，示例数字要和片中数据的量级一致。口播里没有、你加上去的文字（比如结尾评论卡的问题）要告诉用户。
10. **人物圆环流畅跟人、不发黑**
    - 人脸每 0.1 秒跟踪一次（`face_dense.py`），平滑后用样条插值到每一帧，圆环半径跟脸的大小走。
    - 逆光拍的脸在圆环里会显黑：用 `face_gain.py` 算伽马，**只在圆环状态**提暗部，全屏不加。
    - 人转身或出画时，圆环提前收起，不露后脑勺。
    - 圆环里框住头发顶到两肩，只框一个头看着怪。
11. **修改建议一次列全**：交付后用户问“还有什么可以优化”时，把内容、画面、字幕、声音的问题编号列成一张清单，附上推荐做哪几条，用户回编号后一次改完、一次重渲染。列之前先逐帧核对，联系表的取帧时间可能有偏差。

## 环境

- FFmpeg（有 h264_nvenc 就用）
- Python 3.10+：openai-whisper（推荐 `large-v3-turbo`）、numpy、Pillow、opencv-python、fontTools、jieba
- Node 22+（Remotion 4）
- 字体都在 `assets/fonts/`（含 `fun/`），全部 SIL OFL 1.1。**每条按风格选**，见第 0.5 步和 `references/风格与字体.md`。
- 运行 Python 时设 `PYTHONIOENCODING=utf-8`。
- 下文路径记号：`$S` = 本 skill 的 `scripts/` 绝对路径，`$W` = 工作素材目录，`$M` = 动效工程目录。
- 目录约定：
  - 输出：视频所在目录的 `剪辑成果/`
  - 中间文件：`剪辑成果/工作素材/`（每轮大改开一个 `v2/`、`v3/` 子目录）
  - 动效工程：`<工作目录>/.code/<项目名>/motion`
- 长的 Python 补丁写成文件再执行，不要塞进 shell heredoc：容易被引号截断，中文特殊符号（如 ③）也可能被改掉。
- 用户可能正开着上一版成片在播放器里看，文件会被占用：新版另存为 `<名称>_成片_第N版.mp4`。

## 流程

### 0. 看素材
- `ffprobe` 看分辨率、帧率、时长。
- `contact.py --step 4` 抽帧看人物的位置、构图、光线。
- `素材/` 里的照片拼一张联系表看一遍。

### 0.5 定风格（字体、主色、节奏）——开工前必做
按 `references/风格与字体.md`：
- 看场景、构图、光线、话题调性、说话状态，写一张**风格卡**放在 `分镜.md` 最前面：字体组合、主色、动画节奏、音效密度、人物取景、要不要前置钩子、要不要结尾评论卡。
- 用 `font_samples.py` 拿这条的画面、封面标题和一句字幕出字体样张。
- 风格和这个账号以前认可过的一样就直接沿用；风格变了或拿不准，把样张发给用户选。
- 定下来再改 `fonts.ts`、子集化、设字幕字体。

### 1. 转写、粗剪、精剪、调速
```bash
ffmpeg -i 口播视频.mov -vn -ac 1 -ar 16000 $W/audio16k.wav
python $S/transcribe.py $W/audio16k.wav $W/transcript_raw.json --terms "<专有名词，空格分隔>"
python $S/probe_windows.py $W/audio16k.wav --win 5 --hop 2.5 > $W/probe.txt     # 重叠短窗复听，抓重说
python $S/speech_islands.py $W/audio16k.wav islands --thr -42 > $W/islands.txt   # 能量岛 = 真实切点；户外风噪大时调到 -30/-26
python $S/speech_islands.py $W/audio16k.wav listen s1 e1 s2 e2 …                # 可疑段精听
```
- 判断标准见 `references/粗剪规则.md`：有文案时按文案顺序，每句保留最完整的一遍；没有文案时按技巧模式。
- 重点抓：重复的词（“应该应该应该”）、卡壳的“就是……”、半句、结尾的“还有啥”、口误、数字。
- 切点落在字与字之间的静音里：用 40ms 能量表找谷底，拼好测试音频用 `listen` 复听，确认没截字再定。
- **精剪**（用户允许时）：删掉和后文矛盾、意思重复的句子；可以把“亲身证据”挪到观点后面；开头弱时前置钩子（规矩 4）；口播没有号召时在结尾加评论卡（第 2 步）。改动写进剪辑说明，请用户确认。
- 统计字/秒（汉字和数字个数 ÷ 首字到末字的时长），按规矩 8 算出倍率，写进 `edl.json`。edl 格式：keep / removed / speed / speed_note。
```bash
python $S/rough_speed.py 口播视频.mov $W/edl.json $W/rough.mp4 --width 2160                # 片段顺序基本向前、或需要调速时
python $S/cut_segments.py 口播视频.mov $W/edl.json $W/rough.mp4 --width 2160 --pad 2.0     # 片段多且前后穿插（前置钩子、挪句子）时：逐段整帧裁切再拼，防 4K HEVC 内存爆；--pad 给结尾卡片补定格
ffmpeg -i $W/rough.mp4 -vn -ac 1 -ar 16000 $W/rough16k.wav
python $S/transcribe.py $W/rough16k.wav $W/transcript_rough.json --terms "…"   # 之后卡点和字幕都用它
```
- 用 2160 宽：远景人物缩进圆环要放大，1440 宽会糊。
- 剪点前后 3 秒用 `listen` 复核；复听开头、中段、结尾，确认语速自然。

- **剪完复查结巴和重说**：整段转写会把重说合并、把卡顿抹平，只看原片转写会漏。粗剪后把 rough 的人声再原样转写一遍：
```bash
python $S/verbatim_check.py $W/rough16k.wav --terms "…"
```
  标“≈上句”的多半是重说（留后一遍）；标“长音”的去看能量表，句中空白超过 0.4 秒就剪掉。剪点放在静音谷里；b/p/d/t 开头的字前面有一小段闭塞静音，别当成字间空隙切下去。正常的语气拉长不算结巴。

### 2. 动效工程
```bash
cp -r <skill>/motion-template $M
cd $M && npm ci                     # 或者用目录联接 / 软链接复用上一个工程的 node_modules（约 800MB）
cp $W/rough.mp4 public/rough.mp4
# 人物跟踪（规矩 10）：先转 1080 宽代理，顺序读帧（4K 跳帧 seek 极慢）
ffmpeg -i $W/rough.mp4 -an -vf scale=1080:1920 -c:v libx264 -crf 22 $W/proxy1080.mp4
python $S/face_dense.py $W/proxy1080.mp4 $W/face_dense.json                          # 每 0.1s：正脸+侧脸，去跳点，平滑 → [t,x,y,w]
#   核对它每 2 秒打印的一行：人出画、误认到窗户的几秒手动改成线性过渡
python $S/face_gain.py $W/proxy1080.mp4 $W/face_dense.json src/data/face.json        # 第 5 列：圆环补光伽马
# 素材照片转成 ASCII 文件名放进 public/clips/（p01.jpg …，长边 ≤1200）
```
模板是一条完整的示例工程（房产话题，能直接编译）。**在它上面改写，不要从零写：**
- `src/project.ts`：`DURATION`（粗剪帧数 ÷ 30）、`MODES`（全屏/圆环切换）、`FULL_DY_SEG`、`FULL_TITLES`；`faceAt` 已是“0.1 秒轨迹 + 样条插值 + 半径跟脸宽 + 补光伽马”的版本；`toOld/SEGMAP` 用于“动画写完后又改了剪辑”时的时间对照，新片从头做设成 `[[0, 0]]`。
- `src/engine/Presenter.tsx`：圆环取景、全屏推近、圆环补光（只在圆环状态）。
- `src/teaser.tsx`：前置钩子 `Teaser` 和结尾评论卡 `EndCard`（从圆环处展开，抛一个问题，箭头指评论按钮）。不需要时在 `Story.tsx` 去掉。
- `src/kit.tsx` 的 `CHAPTERS`；`src/bg.tsx` 的 `WHIPS`、`RAIL`、`railOn`
- `src/fulltitle.tsx` 的 `Cover`（封面纸条）；`src/hook.tsx`：开场道具和 `PUNCH` 推近关键帧；`src/overlay.tsx`：实景标注
- `src/scenes/`：示例的 S1–S3，整组重写成本条内容。可复用的积木：
  - `parts2.tsx`：Block 转场容器、Kinetic 大字、Snap 快门照片、Bubble 气泡、MarkCircle 手绘圈
  - `parts3.tsx`：Walker 走路小人、Magnifier 放大镜
  - `parts4.tsx`：Cleaver 菜刀、Tag 价签、Fig 小人、Gauge 仪表盘、Gavel 法槌、Gift 礼盒、Pill 胶囊、QMark 问号
  - `kit.tsx`：Title 标题区、Stamp 印章、Reveal、Pop、图标

写场景之前，先写 `$W/分镜.md`（风格卡 + 分镜表），格式和版式规则见 `references/动画与版式.md`。场景写完、或者加了新字，都要跑字体子集化：`python $S/subset_fonts.py $M`

### 3. 音效（真实音效，规矩 6）
- 首次使用：`python $S/fetch_sfx.py <skill>/assets/sfx_real`（按 `sfx_map.json` 从 Mixkit 下载，约 1.6 MB）。
- 写本条的 `$W/cues.json`：`[[成片秒, "音效名"], …]`，逐条卡在动作发生的那一帧。音效名、用途见 `sfx_map.json`，动作配哪类声音见 `references/音效规范.md`。
- 要新声音：在 mixkit.co 上挑，清单给用户确认后下载，存成 `mk_<编号>.mp3`，在 `sfx_map.json` 加一条（嗖、重击用 `"align": "peak"`，其它用 `"on"`）。
```bash
python $S/normalize_voice.py $W/rough.mp4 $W/voice.wav
python $S/mix_real.py --voice $W/voice.wav --cues $W/cues.json --out $W/mix.wav      # 默认无配乐；会报太密、重复、挨太近
```
- 模板里的 `scripts/cues.py`、`sfx_v*.py` 是早期程序合成音效的做法，只留档。

### 4. 字幕
需要三个文件：
- `$W/subtitle_text.txt`：实际说出的话，改正识别错字。断不好的地方用逗号、句号引导断句。
- `$W/terms.txt`：不能拆开的词。
- `$W/keywords.txt`：要标红的数字和结论，10–30 个。
```bash
python $S/make_subtitles.py --words $W/transcript_rough.json --text $W/subtitle_text.txt --terms $W/terms.txt --out-dir $W --layout vertical \
  --max-width 1440 --font <字幕字体路径> --fontname "<字体名>"
python $S/restyle_subs.py $W/字幕.ass $W/字幕.ass --project $M/src/project.ts     # 圆环段和全屏段的字幕位置不同，全屏段默认 y=3170（胸前）
python $S/highlight_subs.py $W/字幕.ass $W/字幕.ass --keywords $W/keywords.txt    # 关键词标红
sed -i 's/^Style: Default,\(.*\),144,/Style: Default,\1,156,/' $W/字幕.ass          # 字号放大一档（所以上面 max-width 用 1440）
```
- 动画用了 `toOld` 时，`restyle_subs.py` 要读一份按新时间写的 MODES。
- 逐行读 `字幕_断句检查.txt`：数字和单位、定语和中心词、动词和宾语都不能拆开；“讲 | 一讲”这种拆词补 terms 或改标点重跑。详见 `references/字幕规范.md`。

### 5. 渲染与检查
```bash
cd $M && npx tsc --noEmit && npx remotion bundle --out-dir ../bundle
npx remotion still ../bundle Final ../stills/x.jpg --frame=N --scale=0.5 --gl=angle --color-space=bt709    # 关键帧
npx remotion render ../bundle Final ../draft.mp4 --scale=0.5 --gl=angle --muted --color-space=bt709        # 半分辨率草稿（后台跑）
python $S/contact.py ../draft.mp4 ../sheets --step 0.5 --cols 8 --rows 4                                    # 联系表
python $S/safearea_check.py ../draft.mp4 ../safearea --step 1                                                # 安全区叠图
```
逐张检查以下几点，修完再出一版草稿。**草稿没问题后先出一版 1080 成片给用户看（不带 `--scale` 渲染，合成声音和字幕），用户确认没有要改的了，再渲染 4K**——4K 要跑很久，而用户通常还要改：
- 有没有压脸；元素有没有重叠、出画、太小、留大片空白
- 安全区叠图：白圈（按钮图标）、白框（作者名、文案）里不能有字
- 推镜有没有盖住标题和圆环（推镜只在纸面版心里放大）
- 卡片有没有在入场前提前露出；有没有文字被挤成竖排
- 圆环里是不是人（不是楼、不是后脑勺）：在远景、近景、走到镜头前、侧身 4 段各连续裁 12 帧圆环拼图，看稳不稳、跟不跟得上、亮度够不够
```bash
npx remotion render ../bundle Final ../broll_master.mp4 --scale=2 --gl=angle --muted --codec=h264 --crf=12 --color-space=bt709   # 4K 母版（后台跑）
```
- 判断渲染完成用 `Encoded <总帧数>/<总帧数>`，不要 grep 文件名：日志开头就包含文件名。
- 只改了一小段时，用 `--frames=A-B` 只渲染那一段，再用 ffmpeg trim + concat 拼回母版（保持 BT.709 标记）。
- 只改字幕或音效时，不用重渲染画面，直接重新合成。

### 6. 合成与自检
```bash
python $S/final_compose.py --video broll_master.mp4 --audio $W/mix.wav --ass $W/字幕.ass --fonts-dir <只放字幕字体的目录> --expect-font <字体名一词> --out 剪辑成果/<名称>_成片.mp4
python $S/qa_check.py --video 剪辑成果/<名称>_成片.mp4 --text $W/subtitle_text.txt --work $W
python $S/color_check.py --final 剪辑成果/<名称>_成片.mp4 --rough $W/rough.mp4 --t 1.0 --dy <开头的 fullDY>
python $S/fullscreen_sub_check.py --video 剪辑成果/<名称>_成片.mp4 --motion $M --out $W/look/fullscreen_sub_check.jpg
python $S/safearea_check.py 剪辑成果/<名称>_成片.mp4 $W/safearea --step 2
```
- `color_check` 在推近的帧会因为取景变化报“有偏差”：三通道同幅度的小差（<5）是取景差，不是偏色，再用大面积平均色确认一次。
- `qa_check` 报的“疑似残留起句”要逐条判断，排比句和原话里的叠词是有意的。
- 按 `references/验收清单.md` 逐项打勾。

## 交付
`剪辑成果/` 下面放：
- `<名称>_成片.mp4`：2160×3840、30fps、H.264/AAC、已烧录字幕、-16 LUFS（改版时旧版改名 `_第N版` 留着对比）
- `<名称>_字幕.srt` / `<名称>_字幕.ass`
- `剪辑说明.md`：格式见 `references/剪辑说明模板.md`，第一节写风格卡
- `工作素材/`

用户要发布时，再给标题备选、作品描述和话题、封面说明和参考图，写法见 `references/发布文案与封面.md`。定稿后可以用 `python $S/clean_project.py <项目目录>` 列出能删的中间文件，给用户确认后再删。

回复用户时说明：
- 成片不带背景音乐，哪几段没人说话、加配乐时要抬音量
- 成片路径和时长
- 按规矩做了什么
- 删了什么、挪了什么、调速倍率多少
- 画面里哪些是示意或示例、加了哪些口播里没有的文字（请用户确认）
- 自检结论
- 没在手机上实际播放过，请用户看一遍
