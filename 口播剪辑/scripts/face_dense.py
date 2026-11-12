"""密集人脸跟踪（边走边说的远景/近景都要跟）：每 0.1s 一帧，缩到 1080 宽（=设计坐标）。
正脸 alt2 + 侧脸（左右各一）三个检测器合在一起，取离上一个点最近的候选（跳太远的丢掉）；
没检出的点线性插值，再按中值（去跳点）+ 高斯（σ=0.3s，零延迟）平滑位置，人脸宽度用 σ=0.6s 平滑。
输出 [[t, x, y, w], ...]，并打印命中率。
python face_dense.py rough.mp4 face.json [--step 0.1] [--until 秒] [--max-face 700 --ymin 300]
"""
import argparse, json
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--step", type=float, default=0.1); ap.add_argument("--until", type=float, default=1e9)
# 室内近景（脸宽 400+）用 --max-face 700 --ymin 300
ap.add_argument("--max-face", type=int, default=260); ap.add_argument("--ymin", type=float, default=500); ap.add_argument("--ymax", type=float, default=1450)
a = ap.parse_args()
cap = cv2.VideoCapture(a.src)
fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); dur = min(n / fps, a.until)
F = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
P = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
every = max(1, round(a.step * fps))
ts, xs, ys, ws = [], [], [], []
prev = None
miss = 0
fi = -1
while True:
    fi += 1
    if fi >= int(dur * fps):
        break
    if fi % every:
        if not cap.grab():
            break
        continue
    ok, fr = cap.read()
    if not ok:
        break
    t = fi / fps
    fr = cv2.resize(fr, (1080, 1920))
    g = cv2.equalizeHist(cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY))
    c = []
    for (x, y, w, h) in F.detectMultiScale(g, 1.07, 4, minSize=(36, 36), maxSize=(a.max_face, a.max_face)):
        c.append((x + w / 2, y + h / 2, w, 1.0))
    for (x, y, w, h) in P.detectMultiScale(g, 1.07, 4, minSize=(40, 40), maxSize=(a.max_face, a.max_face)):
        c.append((x + w / 2, y + h / 2, w, 0.8))
    for (x, y, w, h) in P.detectMultiScale(cv2.flip(g, 1), 1.07, 4, minSize=(40, 40), maxSize=(a.max_face, a.max_face)):
        c.append((1080 - x - w / 2, y + h / 2, w, 0.8))
    c = [k for k in c if a.ymin < k[1] < a.ymax]
    hit = None
    if c:
        if prev is None:
            hit = max(c, key=lambda k: k[2] * k[3])
        else:
            lim = max(160, a.max_face * 0.6) + 120 * min(miss, 5)  # 丢得越久允许跳得越远
            best = min(c, key=lambda k: np.hypot(k[0] - prev[0], k[1] - prev[1]))
            if np.hypot(best[0] - prev[0], best[1] - prev[1]) < lim:
                hit = best
    ts.append(round(t, 3))
    if hit:
        xs.append(hit[0]); ys.append(hit[1]); ws.append(hit[2]); prev = hit; miss = 0
    else:
        xs.append(np.nan); ys.append(np.nan); ws.append(np.nan); miss += 1
xs, ys, ws = map(np.array, (xs, ys, ws))
ok = ~np.isnan(xs)
print(f"{ok.sum()}/{len(xs)} hit ({ok.mean() * 100:.0f}%)")
idx = np.arange(len(xs))
xs = np.interp(idx, idx[ok], xs[ok]); ys = np.interp(idx, idx[ok], ys[ok]); ws = np.interp(idx, idx[ok], ws[ok])


def med(v, k=5):
    return np.array([np.median(v[max(0, i - k // 2):i + k // 2 + 1]) for i in range(len(v))])


def gauss(v, sigma_s):
    sig = sigma_s / a.step
    r = int(3 * sig)
    ker = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2); ker /= ker.sum()
    return np.convolve(np.pad(v, r, mode="edge"), ker, mode="valid")


xs = gauss(med(xs), 0.3); ys = gauss(med(ys), 0.3); ws = gauss(med(ws, 9), 0.6)
json.dump([[ts[i], round(float(xs[i]), 1), round(float(ys[i]), 1), round(float(ws[i]), 1)] for i in range(len(ts))], open(a.out, "w"))
# 每 2 秒打印一行，方便核对
for i in range(0, len(ts), int(2 / a.step)):
    print(f"{ts[i]:6.1f}  x={xs[i]:5.0f} y={ys[i]:5.0f} w={ws[i]:4.0f}{'' if ok[i] else '  (插值)'}")
