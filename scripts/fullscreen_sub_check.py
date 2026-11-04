# -*- coding: utf-8 -*-
"""全屏字幕 vs 下巴自检：人物全屏时有推近（PUNCH）和缓慢推镜，下巴会往下走，字幕可能压到脸。
从 project.ts 读全屏段（MODES）、从 hook.tsx 读 PUNCH 关键帧，取每个推近峰值（起点+0.3s）和每段全屏结束前 0.4s，
从成片抽帧，只截脸到胸口那一带（设计坐标 y 840–1680），带时间标签拼成一张图，逐张看字幕顶边是否离下巴 ≥ 60px。

python fullscreen_sub_check.py --video 成片.mp4 --motion <motion 目录> --out 工作素材/look/fullscreen_sub_check.jpg
"""
import argparse
import os
import re
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont


def full_segments(project_ts):
    src = open(project_ts, encoding="utf-8").read()
    body = src[src.index("export const MODES"):]
    body = body[: body.index("];")]
    modes = [(float(t), m) for t, m in re.findall(r"t:\s*([\d.]+),\s*mode:\s*\"(full|pip)\"", body)]
    segs, start = [], None
    for t, m in modes:
        if m == "full" and start is None:
            start = t
        elif m == "pip" and start is not None:
            segs.append((start, t))
            start = None
    if start is not None:
        segs.append((start, None))
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--motion", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.video],
                               capture_output=True, text=True).stdout.strip())
    segs = [(s, e if e is not None else dur) for s, e in full_segments(os.path.join(a.motion, "src", "project.ts"))]
    hook = open(os.path.join(a.motion, "src", "hook.tsx"), encoding="utf-8").read()
    punches = [float(x) for x in re.findall(r"^\s*\[([\d.]+),\s*[\d.]+,\s*[\d.]+\]", hook, re.M)]
    times = sorted({round(min(p + 0.3, dur - 0.1), 2) for p in punches if any(s <= p < e for s, e in segs)} |
                   {round(max(s, e - 0.4), 2) for s, e in segs})
    tmp = tempfile.mkdtemp()
    tiles = []
    font = ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fonts", "NotoSansSC-Medium.otf"), 22)
    for i, t in enumerate(times):
        p = os.path.join(tmp, f"{i}.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", a.video, "-frames:v", "1",
                        "-vf", "scale=540:960,crop=540:420:0:420,drawgrid=w=540:h=50:t=1:c=red@0.35", p], check=True)
        im = Image.open(p).convert("RGB")
        ImageDraw.Draw(im).text((6, 4), f"{t:.2f}s", fill="yellow", font=font, stroke_width=2, stroke_fill="black")
        tiles.append(im)
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (540 * cols, 420 * rows), "black")
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * 540, (i // cols) * 420))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    sheet.save(a.out, quality=88)
    print(f"全屏段 {len(segs)} 段，抽查 {len(times)} 帧：{times}\n-> {a.out}（红线每 100 设计像素；字幕顶边要离下巴 ≥ 60px）")


if __name__ == "__main__":
    main()
