# -*- coding: utf-8 -*-
"""口播人声降噪（稳态底噪：空调/风扇/电脑的嗡嗡、嘶嘶声）。
STFT 每个频段用“最近 win 秒里的最低能量”跟踪噪声谱（最小值统计），所以只在有底噪的段落起作用，干净段落几乎不动；
增益用 decision-directed 先验信噪比的维纳增益，时间、频率上各平滑一下防“水声”（musical noise），最低保留 floor（默认 -16 dB），不把底噪抠成真空。
python denoise.py in.wav out.wav [--win 2.0] [--floor -16] [--over 1.3]
"""
import argparse
import subprocess
import sys

import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import istft, stft

ap = argparse.ArgumentParser()
ap.add_argument("inp"); ap.add_argument("out")
ap.add_argument("--win", type=float, default=2.0)
ap.add_argument("--floor", type=float, default=-16.0)
ap.add_argument("--over", type=float, default=1.3)
ap.add_argument("--report", default="")
a = ap.parse_args()

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.inp, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
sr = 48000
N, H = 2048, 512
f, t, X = stft(x, sr, nperseg=N, noverlap=N - H, window="hann")
P = np.abs(X) ** 2
# 先轻度时间平滑，再取滑动最小值估噪声；最小值统计会偏低，乘一个补偿系数
Ps = uniform_filter1d(P, size=5, axis=1)
k = max(3, int(a.win * sr / H))
noise = minimum_filter1d(Ps, size=k, axis=1, mode="nearest")
noise = uniform_filter1d(noise, size=k, axis=1, mode="nearest") * 1.8 * a.over
# 频率方向也平滑一点
noise = uniform_filter1d(noise, size=3, axis=0, mode="nearest")
# decision-directed 维纳增益
floor = 10 ** (a.floor / 20)
G = np.ones_like(P)
prev = np.zeros(P.shape[0])
alpha = 0.96
for j in range(P.shape[1]):
    post = P[:, j] / (noise[:, j] + 1e-20)
    prio = alpha * prev + (1 - alpha) * np.maximum(post - 1, 0)
    g = prio / (1 + prio)
    g = np.maximum(g, floor)
    G[:, j] = g
    prev = (g ** 2) * post
G = uniform_filter1d(G, size=3, axis=0)
G = uniform_filter1d(G, size=3, axis=1)
_, y = istft(X * G, sr, nperseg=N, noverlap=N - H, window="hann")
y = y[: len(x)]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(sr), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", a.out], input=y.astype(np.float64).tobytes(), check=True)
if a.report:
    # 每 10 秒：底噪（p5）降噪前后
    def floor_db(v):
        n = int(0.05 * sr)
        fr = len(v) // n
        return np.array([20 * np.log10(np.sqrt(np.mean(v[i * n:(i + 1) * n] ** 2)) + 1e-12) for i in range(fr)])
    d0, d1 = floor_db(x), floor_db(y)
    for s in range(0, int(len(x) / sr), 10):
        i0, i1 = int(s / 0.05), int((s + 10) / 0.05)
        print(f"{s:4d}-{s + 10:4d}s  底噪 {np.percentile(d0[i0:i1], 5):6.1f} → {np.percentile(d1[i0:i1], 5):6.1f} dB   语音段电平 {np.percentile(d0[i0:i1], 90):6.1f} → {np.percentile(d1[i0:i1], 90):6.1f}")
print("done", a.out)
