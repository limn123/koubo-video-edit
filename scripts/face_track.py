"""人脸跟踪：每 0.5s 取一帧，OpenCV Haar 找最大人脸，输出 [t, x, y]（1080×1920 设计坐标），中值 + 滑动平均平滑。
用法：python face_track.py rough.mp4 face.json
"""
import json
import sys

import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
dur = n / fps
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

raw = []
t = 0.0
while t < dur:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, fr = cap.read()
    if not ok:
        break
    h, w = fr.shape[:2]
    k = 540 / w
    g = cv2.cvtColor(cv2.resize(fr, (540, int(h * k))), cv2.COLOR_BGR2GRAY)
    fs = casc.detectMultiScale(g, 1.1, 6, minSize=(90, 90))
    if len(fs):
        x, y, fw, fh = max(fs, key=lambda f: f[2] * f[3])
        # 设计坐标 = 540 宽缩略图 × 2
        raw.append([t, (x + fw / 2) * 2, (y + fh / 2) * 2, fw * 2])
    else:
        raw.append([t, None, None, None])
    t = round(t + 0.5, 2)

# 缺失帧用前后插值
arr = np.array([[r[0], np.nan if r[1] is None else r[1], np.nan if r[2] is None else r[2], np.nan if r[3] is None else r[3]] for r in raw], float)
for c in (1, 2, 3):
    m = ~np.isnan(arr[:, c])
    arr[:, c] = np.interp(arr[:, 0], arr[m, 0], arr[m, c])


def smooth(v, med=5, avg=5):
    p = med // 2
    vv = np.pad(v, p, mode="edge")
    v = np.array([np.median(vv[i : i + med]) for i in range(len(v))])
    p = avg // 2
    vv = np.pad(v, p, mode="edge")
    return np.convolve(vv, np.ones(avg) / avg, mode="valid")


xs, ys = smooth(arr[:, 1]), smooth(arr[:, 2])
json.dump([[float(a), int(round(x)), int(round(y))] for a, x, y in zip(arr[:, 0], xs, ys)], open(out, "w"))
print(f"{len(arr)} samples, face width median {np.median(arr[:, 3]):.0f}px, x {xs.min():.0f}-{xs.max():.0f}, y {ys.min():.0f}-{ys.max():.0f}")
