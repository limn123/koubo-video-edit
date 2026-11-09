# -*- coding: utf-8 -*-
"""字体样张：把这条视频自己的封面标题 + 一句字幕，用几套候选字体组合直接叠在原片画面上，拼成一张对比图，给用户挑。

python font_samples.py --video 原片或粗剪.mp4 --t 3.0 --title "楼王 2 号楼|屋里冷两度！" --kicker "本地 · 示例花园" \
    --sub "整个屋子的温度会比其他的少个两度" --out 字体样张.jpg [--sets A,B,C,D,E,F]

每套 = 标题字体 + 字幕字体（手写/毛笔类只用在标题，字幕一律用好读的字体）。字体都是 OFL/开源可商用。
字体目录：skill 的 assets/fonts/ 和 assets/fonts/fun/。
"""
import argparse
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DIRS = [os.path.join(HERE, "..", "assets", "fonts", "fun"), os.path.join(HERE, "..", "assets", "fonts")]

# 代号: (名称与适用风格, 标题字体文件, 字幕字体文件)
SETS = {
    "A": ("站酷快乐体 · 活泼卡通（生活/吐槽/探盘；拿不准时的默认）", "ZCOOLKuaiLe-Regular.ttf", "ZCOOLKuaiLe-Regular.ttf"),
    "B": ("得意黑 · 利落斜体（干货/数据/行情）", "SmileySans-Oblique.ttf", "NotoSansSC-Medium.otf"),
    "C": ("马善政毛笔 + 思源黑（温情/养老/老小区故事）", "MaShanZheng-Regular.ttf", "NotoSansSC-Medium.otf"),
    "D": ("志莽行书 + 快乐体（个人感悟/经历）", "ZhiMangXing-Regular.ttf", "ZCOOLKuaiLe-Regular.ttf"),
    "E": ("龙藏体 + 思源黑（轻松 vlog/手写感）", "LongCang-Regular.ttf", "NotoSansSC-Medium.otf"),
    "F": ("思源黑 · 稳重（高端盘/政策/严肃话题）", "NotoSansSC-Medium.otf", "NotoSansSC-Medium.otf"),
}


def find(name):
    for d in DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def grab(video, t, w=540, h=960):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", video, "-frames:v", "1",
                        "-vf", f"scale={w}:{h}", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    from io import BytesIO
    return Image.open(BytesIO(r.stdout)).convert("RGB")


def panel(base, code, title_lines, kicker, sub):
    label, tf, sf = SETS[code]
    im = base.copy()
    d = ImageDraw.Draw(im, "RGBA")
    ink = (24, 61, 51)
    y = 96
    if kicker:
        kf = ImageFont.truetype(find(sf), 18)
        tw = d.textlength(kicker, font=kf)
        d.rounded_rectangle([30, y, 30 + tw + 20, y + 30], 5, fill=ink)
        d.text((40, y + 4), kicker, font=kf, fill="white")
        y += 40
    for i, line in enumerate(title_lines):
        size = 44
        f = ImageFont.truetype(find(tf), size)
        tw = d.textlength(line, font=f)
        d.rounded_rectangle([30, y, 30 + tw + 24, y + size + 18], 6, fill=(255, 253, 248, 245))
        d.text((42, y + 4), line, font=f, fill=ink if i == 0 else (217, 72, 59))
        y += size + 26
    sfnt = ImageFont.truetype(find(sf), 30)
    tw = d.textlength(sub, font=sfnt)
    d.text(((im.width - tw) / 2, im.height * 0.74), sub, font=sfnt, fill=ink, stroke_width=3, stroke_fill="white")
    # 底部说明条
    lf = ImageFont.truetype(find("NotoSansSC-Medium.otf"), 17)
    d.rectangle([0, im.height - 64, im.width, im.height], fill=(0, 0, 0, 170))
    d.text((14, im.height - 56), f"{code}  {label}", font=lf, fill="white")
    return im


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--t", type=float, default=2.0)
    ap.add_argument("--title", required=True, help="用 | 分行")
    ap.add_argument("--kicker", default="")
    ap.add_argument("--sub", required=True)
    ap.add_argument("--sets", default="A,B,C,D,E,F")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    base = grab(a.video, a.t)
    codes = [c.strip() for c in a.sets.split(",") if c.strip() in SETS]
    cols = 3
    rows = (len(codes) + cols - 1) // cols
    sheet = Image.new("RGB", (base.width * cols, base.height * rows), "white")
    for i, c in enumerate(codes):
        sheet.paste(panel(base, c, a.title.split("|"), a.kicker, a.sub), ((i % cols) * base.width, (i // cols) * base.height))
    sheet.save(a.out, quality=90)
    print(f"{len(codes)} 套 -> {a.out}")


if __name__ == "__main__":
    main()
