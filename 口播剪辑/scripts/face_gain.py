"""给人物圆环算补光倍数：沿 face.json 的轨迹，每 0.1s 量一次脸部区域的平均亮度（Rec.709 luma），
算伽马指数 = ln(TARGET/255) / ln(实测/255)，限制在 0.55–1.0（1=不变，越小提暗部越多），σ=0.5s 平滑，写成 face.json 的第 5 列。
Presenter 只在圆环状态用它（SVG feComponentTransfer gamma），全屏不加。
python face_gain.py proxy1080.mp4 face.json out.json
"""
import json, sys
import cv2
import numpy as np

src, fj, out = sys.argv[1:4]
TARGET = 125.0
tr = json.load(open(fj))
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
lum = []
fi, k = -1, 0
times = [r[0] for r in tr]
while k < len(tr):
    want = round(times[k] * fps)
    ok = True
    while fi < want - 1:
        ok = cap.grab(); fi += 1
        if not ok:
            break
    ok, fr = cap.read(); fi += 1
    if not ok:
        break
    _, x, y, w = tr[k][:4]
    h = int(w * 0.6)
    x0, x1 = int(max(0, x - h)), int(min(1079, x + h))
    y0, y1 = int(max(0, y - h)), int(min(1919, y + h))
    roi = fr[y0:y1, x0:x1].astype(float)
    if roi.size == 0:
        lum.append(np.nan)
    else:
        b, g, r = roi[..., 0].mean(), roi[..., 1].mean(), roi[..., 2].mean()
        lum.append(0.2126 * r + 0.7152 * g + 0.0722 * b)
    k += 1
lum = np.array(lum + [np.nan] * (len(tr) - len(lum)))
ok = ~np.isnan(lum)
idx = np.arange(len(lum))
lum = np.interp(idx, idx[ok], lum[ok])
# 伽马提暗部：把脸的平均亮度提到 TARGET 附近，高光基本不动；指数限制在 0.55–1.0（1=不变）
gain = np.clip(np.log(TARGET / 255) / np.log(np.clip(lum, 5, 254) / 255), 0.55, 1.0)
s = 0.5 / 0.1
r = int(3 * s)
ker = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2); ker /= ker.sum()
gain = np.convolve(np.pad(gain, r, mode="edge"), ker, mode="valid")
res = [list(tr[i][:4]) + [round(float(gain[i]), 3)] for i in range(len(tr))]
json.dump(res, open(out, "w"))
print(f"luma 中位数 {np.median(lum):.0f}，最暗 {lum.min():.0f}；伽马指数 中位数 {np.median(gain):.2f}，最小 {gain.min():.2f}")
for t in range(0, len(tr), 50):
    print(f"{tr[t][0]:5.1f}s  luma={lum[t]:5.0f}  gain={gain[t]:.2f}")
