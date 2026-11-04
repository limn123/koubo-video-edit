# -*- coding: utf-8 -*-
"""从视频按固定间隔抽帧，拼成带时间标签的联系表（每张 6×4）。
python scripts/contact.py draft.mp4 out_dir [--step 1.0] [--start 0] [--end 999]
"""
import argparse
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--step", type=float, default=1.0)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=999)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--rows", type=int, default=4)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a.start), "-to", str(a.end), "-i", a.video,
                    "-vf", f"fps=1/{a.step},scale=240:-1", os.path.join(tmp, "f_%05d.jpg")], check=True)
    fs = sorted(os.listdir(tmp))
    font = ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fonts", "NotoSansSC-Medium.otf"), 18)
    per = a.cols * a.rows
    for k in range(0, len(fs), per):
        chunk = fs[k:k + per]
        im0 = Image.open(os.path.join(tmp, chunk[0]))
        W, H = im0.size
        sheet = Image.new("RGB", (a.cols * W, a.rows * (H + 24)), "white")
        d = ImageDraw.Draw(sheet)
        for i, f in enumerate(chunk):
            t = a.start + (k + i) * a.step
            x = (i % a.cols) * W
            y = (i // a.cols) * (H + 24)
            sheet.paste(Image.open(os.path.join(tmp, f)), (x, y + 24))
            d.text((x + 4, y + 1), f"{t:.1f}s", fill="black", font=font)
        p = os.path.join(a.out, f"sheet_{k // per + 1:02d}.jpg")
        sheet.save(p, quality=85)
        print(p)


if __name__ == "__main__":
    main()
