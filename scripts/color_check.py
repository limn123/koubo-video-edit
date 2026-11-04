# -*- coding: utf-8 -*-
"""全屏人物颜色自检：取成片某一全屏时刻的人脸区域，与粗剪原片同一区域（扣除全屏下移量 fullDY）比较平均 RGB。
三个通道平均差应在 2 个色阶以内，绿色通道不能单独偏高（偏绿 = 色彩矩阵错了，检查是否用了 --color-space=bt709）。

python color_check.py --final 成片.mp4 --rough 工作素材/rough.mp4 --t 1.0 --dy 80
"""
import argparse
import subprocess

import numpy as np


def grab(path, t, y0, w=600, h=500, x0=240):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", path, "-frames:v", "1",
                          "-vf", f"scale=1080:1920,crop={w}:{h}:{x0}:{y0}", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(float)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--final", required=True)
    ap.add_argument("--rough", required=True)
    ap.add_argument("--t", type=float, default=1.0)
    ap.add_argument("--dy", type=int, default=80, help="该时刻的 fullDY（人物全屏下移量，设计坐标）")
    ap.add_argument("--y", type=int, default=850, help="成片里取样区域上沿（设计坐标），默认脸到胸口")
    a = ap.parse_args()
    f = grab(a.final, a.t, a.y)
    r = grab(a.rough, a.t, a.y - a.dy)
    mf, mr = f.mean((0, 1)), r.mean((0, 1))
    print(f"成片 RGB {mf.round(1)}  原片 RGB {mr.round(1)}  通道差 {(mf - mr).round(1)}  逐像素平均差 {np.abs(f - r).mean():.2f}")
    ok = np.all(np.abs(mf - mr) < 3) and (mf - mr)[1] - max((mf - mr)[0], (mf - mr)[2]) < 2
    print("结论：" + ("颜色一致，未偏色" if ok else "有偏差，检查渲染色彩空间 / 是否叠了滤镜"))


if __name__ == "__main__":
    main()
