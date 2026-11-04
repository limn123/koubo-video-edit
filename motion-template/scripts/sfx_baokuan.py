# -*- coding: utf-8 -*-
"""早期示例音效（第二版，程序化合成，无版权风险）。
按爆款口播的习惯，用观众一听就懂的声音，每类动作固定一种声音：
  人物缩放/段落转场=whoosh  章节切换=swipe（快扫+小冲击）  照片入场=shutter（快门）  标签/卡片弹出=pop（气泡啵）
  优点/打勾=correct（叮咚）  缺点/打叉=wrong（嗡嗡）  数字滚动=tick  钱/价格=cash（收银机）、coin  降价=slide_down
  结论大字=slam + boom  印章=stamp  疑问=question  人群出现/筛掉=crowd_in/crowd_out  货车=horn/truck
  剪价=scissors  上锁=lock  日历=calendar  扫描=scan  锁定=target  纸/地图=paper  记账=writing  私信=notify  结尾=chime_end

python scripts/sfx_baokuan.py public/sfx
"""
import os
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(23)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.003, r=0.1):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-np.maximum(0, x - a) / max(r, 1e-4))


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    m = np.convolve(m, np.hanning(31) / np.hanning(31).sum(), mode="same")
    return np.fft.irfft(X * m, len(x))


def noise(d):
    return rng.standard_normal(int(SR * d))


def silence(d):
    return np.zeros(int(SR * d))


def M(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def place(dst, src, at, g=1.0):
    i = int(at * SR)
    j = min(len(dst), i + len(src))
    if j > i:
        dst[i:j] += src[: j - i] * g
    return dst


def norm(x, peak=1.0):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def sweep(f0, f1, d, shape=1.0):
    x = t_(d)
    f = f0 * (f1 / f0) ** ((x / d) ** shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def square(f, d, duty=0.5):
    ph = (t_(d) * f) % 1
    return np.where(ph < duty, 1.0, -1.0)


def partials(f, d, ratios, decays, amps):
    tt = t_(d)
    x = np.zeros_like(tt)
    for r, dc, a in zip(ratios, decays, amps):
        x += a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / dc)
    return x


def thump(f=70, d=0.35, bend=1.4):
    x = t_(d)
    fr = f * (1 + bend * np.exp(-x / 0.02))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x / (d / 4))


def click(lo=2000, hi=7000, d=0.006):
    n = int(SR * d)
    return band(noise(d), lo, hi) * env(n, 0.0003, d / 4)


def whoosh_core(d, f0, f1, peak=0.55):
    """经典 whoosh：带通噪声中心频率滑动，振幅在 peak 处最大（快起慢收）"""
    n = int(SR * d)
    src = noise(d + 0.05)
    out = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk // 2):
        k = i / n
        fc = f0 * (f1 / f0) ** k
        seg = src[i: i + blk]
        seg = seg * np.hanning(len(seg))
        y = band(seg, fc * 0.55, fc * 1.6)
        j = min(len(y), n - i)
        out[i: i + j] += y[:j]
    x = t_(d) / d
    e = np.where(x < peak, (x / peak) ** 2, np.exp(-(x - peak) / (1 - peak) * 3.2))
    return norm(out) * e


def room(x, mix=0.12, rt=0.28):
    n = int(SR * rt * 2)
    ir = band(rng.standard_normal(n), 200, 6000) * np.exp(-np.arange(n) / SR / (rt / 3))
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n), len(x) + n)
    wet = norm(wet) * np.max(np.abs(x))
    return M(x, wet * mix)


def to_stereo(x, pan=0.0, move=None):
    p = np.linspace(move[0], move[1], len(x)) if move else np.full(len(x), pan)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


def write(path, st, peak=0.75):
    st = st / (np.max(np.abs(st)) + 1e-9) * peak
    fi, fo = int(SR * 0.0015), int(SR * 0.02)
    st[:fi] *= np.linspace(0, 1, fi)[:, None]
    st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())


# ---------------- 声音 ----------------
def pop(f0, d=0.07):
    """气泡“啵”：短促上滑正弦 + 一点点起音咔"""
    x = t_(d)
    f = f0 * (1 + 1.6 * (x / d) ** 0.7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.022) * np.minimum(1, x / 0.002)
    return M(s, click(3000, 8000, 0.003) * 0.25)


def ding(f, d=0.7):
    return partials(f, d, [1, 2.0, 2.76, 5.4], [0.32, 0.12, 0.08, 0.03], [1, 0.25, 0.18, 0.06]) * np.minimum(1, t_(d) / 0.002)


def correct():
    x = silence(0.8)
    place(x, ding(1318.5, 0.25), 0)
    place(x, ding(1760.0, 0.6), 0.11)
    return x


def wrong():
    """综艺“答错”：两声低沉方波嗡嗡"""
    x = silence(0.42)
    for i, f in enumerate([233.0, 196.0]):
        b = band(square(f, 0.15, 0.4), 80, 2600) * env(int(SR * 0.15), 0.004, 0.09)
        place(x, b, i * 0.17)
    return x


def shutter():
    x = silence(0.25)
    place(x, click(3000, 9000, 0.008), 0)
    whirr = band(noise(0.05), 900, 3500) * (0.5 + 0.5 * np.sin(2 * np.pi * 180 * t_(0.05))) * env(int(SR * 0.05), 0.003, 0.02)
    place(x, whirr * 0.5, 0.01)
    place(x, M(click(1800, 6000, 0.01), thump(220, 0.05, 0.2) * 0.4), 0.085)
    return x


def cash():
    """收银机：咔啦（抽屉棘轮）+ 叮（铃）+ 硬币"""
    x = silence(1.1)
    for k in range(5):
        place(x, click(2500, 8000, 0.006) * (0.6 + 0.08 * k), k * 0.018)
    place(x, partials(2637, 0.9, [1, 1.5, 2.01], [0.35, 0.2, 0.12], [1, 0.4, 0.3]), 0.1)
    for k in range(4):
        place(x, partials(4200 + 600 * rng.random(), 0.25, [1, 1.47], [0.08, 0.05], [0.4, 0.2]), 0.16 + k * 0.05)
    return x


def coin(f=4400):
    return partials(f, 0.45, [1, 1.47, 2.13], [0.12, 0.08, 0.05], [1, 0.5, 0.3])


def boom(d=1.1):
    s = sweep(95, 34, d, 0.5) * env(int(SR * d), 0.004, d / 3.2)
    hit = band(noise(0.04), 60, 1500) * env(int(SR * 0.04), 0.001, 0.012) * 0.8
    return room(M(s, hit), 0.15, 0.4)


def slam():
    body = thump(78, 0.32, 1.6)
    snare = band(noise(0.18), 1200, 6500) * env(int(SR * 0.18), 0.001, 0.05) * 0.55
    return room(M(body, snare, click(2000, 7000, 0.004) * 0.5), 0.12)


def stamp():
    return room(M(thump(115, 0.22, 0.6), band(noise(0.05), 300, 2600) * env(int(SR * 0.05), 0.001, 0.015) * 0.9, band(noise(0.12), 900, 3500) * env(int(SR * 0.12), 0.015, 0.04) * 0.25), 0.1)


def ticks(d=0.6, start=0.025, grow=1.08, f=(3200, 6000)):
    x = silence(d)
    tt, gap = 0.0, start
    while tt < d - 0.01:
        place(x, M(click(f[0], f[1], 0.005), partials(1500, 0.02, [1], [0.006], [0.3])), tt)
        tt += gap
        gap *= grow
    return x


def slide_down(d=0.55):
    tt = t_(d)
    f = 820 * (300 / 820) ** ((tt / d) ** 0.8) * (1 + 0.012 * np.sin(2 * np.pi * 7 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tri = 2 / np.pi * np.arcsin(np.sin(ph))
    return (0.7 * tri + 0.3 * np.sin(2 * ph) * 0.4) * env(len(tt), 0.01, d / 1.6)


def question():
    """疑问“嗯？”：带颤音的上滑"""
    d = 0.32
    tt = t_(d)
    f = 380 * (760 / 380) ** ((tt / d) ** 1.4) * (1 + 0.03 * np.sin(2 * np.pi * 14 * tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.16)


def lock():
    x = silence(0.4)
    place(x, M(click(2500, 8000, 0.008), partials(2100, 0.12, [1, 2.3], [0.03, 0.02], [0.6, 0.3])), 0)
    place(x, M(click(1500, 6000, 0.012) * 1.2, thump(170, 0.1, 0.3) * 0.7, partials(1500, 0.2, [1, 2.4], [0.05, 0.03], [0.5, 0.2])), 0.09)
    return x


def scissors():
    x = silence(0.4)
    for i in range(2):
        sn = M(band(noise(0.05), 3000, 9500) * env(int(SR * 0.05), 0.001, 0.012), partials(4300 - i * 400, 0.08, [1, 1.6], [0.02, 0.012], [0.4, 0.2]))
        place(x, sn, i * 0.14)
    return x


def horn():
    x = silence(0.55)
    for i in range(2):
        h = band(square(415, 0.16, 0.5) + square(520, 0.16, 0.5), 150, 3000) * env(int(SR * 0.16), 0.006, 0.12)
        place(x, h, i * 0.21)
    return x


def truck(d=1.3):
    tt = t_(d)
    k = tt / d
    f0 = 44 * (1.05 - 0.1 / (1 + np.exp(-(k - 0.5) * 10)))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    eng = sum(np.sin(ph * h) / h for h in range(1, 6))
    rumble = band(noise(d), 60, 700) * 0.7
    return band(eng * 0.8 + rumble, 30, 1200) * np.exp(-((k - 0.5) ** 2) / 0.07)


def sparkle(d=0.9):
    x = silence(d)
    for k in range(14):
        place(x, partials(2400 + rng.random() * 3600, 0.25, [1], [0.06], [1]) * (0.35 + 0.5 * rng.random()), k * 0.05 + rng.random() * 0.02)
    return M(x, whoosh_core(d, 2000, 7000, 0.3) * 0.25)


def notify():
    x = silence(0.8)
    place(x, ding(1567.98, 0.3), 0)
    place(x, ding(2093.0, 0.6), 0.14)
    return x


def paper(d=0.25):
    tt = t_(d)
    return band(noise(d), 1200, 7500) * (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 24 * tt))) * env(len(tt), 0.004, d / 3)


def writing(d=0.8):
    tt = t_(d)
    strokes = np.abs(np.sin(2 * np.pi * 5 * tt + np.sin(2 * np.pi * 1.1 * tt))) ** 2
    return band(noise(d), 2000, 7000) * strokes * np.sin(np.pi * tt / d) ** 0.4


def marker(d=0.5):
    tt = t_(d)
    sq = np.abs(np.sin(2 * np.pi * 3 * tt)) ** 0.5
    return band(noise(d), 1500, 5000) * sq * np.sin(np.pi * tt / d) * 0.8


def calendar():
    x = silence(1.2)
    for i in range(6):
        place(x, paper(0.12) * (0.6 + 0.07 * i), i * 0.17)
    return x


def scan():
    x = silence(1.1)
    place(x, sweep(500, 1500, 1.0) * np.sin(np.pi * t_(1.0)) * 0.2, 0)
    for k in range(5):
        place(x, partials(1700 + 150 * k, 0.07, [1], [0.03], [1]) * 0.6, 0.1 + k * 0.18)
    return x


def target():
    x = silence(0.5)
    place(x, partials(2200, 0.06, [1], [0.03], [1]), 0)
    place(x, partials(2200, 0.06, [1], [0.03], [1]), 0.09)
    place(x, ding(2637, 0.35) * 0.7, 0.18)
    return x


def crowd_in():
    x = silence(0.6)
    for k in range(6):
        place(x, pop(450 + 70 * k, 0.05) * 0.7, k * 0.05)
    return x


def crowd_out():
    x = silence(0.7)
    for k in range(6):
        f = 700 - 70 * k
        place(x, sweep(f, f * 0.7, 0.07) * env(int(SR * 0.07), 0.002, 0.03) * 0.7, k * 0.07)
    return x


def stack(n=6):
    x = silence(0.12 * n + 0.3)
    for k in range(n):
        place(x, M(thump(150 + 20 * k, 0.1, 0.3) * 0.7, click(1500, 5000, 0.004) * 0.3), k * 0.1)
    return x


def chime_end():
    x = silence(1.8)
    for k, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        place(x, ding(f, 1.2) * 0.8, k * 0.09)
    return room(x, 0.15)


def glitch():
    d = 0.26
    tt = t_(d)
    n = len(tt)
    sq = square(220 + 700 * (np.floor(tt * 30) % 3), d, 0.5)
    crush = np.round(band(noise(d), 800, 9000) * 5) / 5
    gate = (np.floor(tt * 34) % 2) * 0.7 + 0.3
    return (0.3 * sq + 0.5 * crush) * gate * env(n, 0.002, 0.1)


def build():
    lib = {}
    # 转场
    lib["whoosh_1"] = (whoosh_core(0.45, 350, 3800), (-0.5, 0.5))
    lib["whoosh_2"] = (whoosh_core(0.42, 420, 3200), (0.5, -0.5))
    lib["whoosh_3"] = (whoosh_core(0.5, 300, 2600, 0.45), (-0.4, 0.4))
    lib["whoosh_down"] = (whoosh_core(0.45, 3200, 380, 0.4), (0.4, -0.4))
    for i, (a, b) in enumerate([(500, 6500), (600, 7500), (450, 6000), (550, 7000)]):
        x = M(whoosh_core(0.32, a, b, 0.6), silence(0.4))
        place(x, thump(62, 0.35, 1.0) * 0.45, 0.24)
        lib[f"swipe_{i + 1}"] = (x, (-0.8, 0.8) if i % 2 == 0 else (0.8, -0.8))
    # 弹出 / 判定
    for i, f in enumerate([520, 620, 720, 820, 940]):
        lib[f"pop_{i + 1}"] = (pop(f), None)
    lib["ding"] = (ding(1760), None)
    lib["ding_hi"] = (ding(2093), None)
    lib["correct"] = (correct(), None)
    lib["wrong"] = (wrong(), None)
    lib["question"] = (question(), None)
    lib["shutter"] = (shutter(), None)
    lib["click"] = (M(click(2000, 6000, 0.006), silence(0.05)), None)
    # 钱 / 数字
    lib["cash"] = (cash(), None)
    lib["coin"] = (coin(), None)
    x = silence(0.9)
    for k in range(7):
        place(x, coin(3800 + 500 * rng.random()) * (0.8 - 0.08 * k), k * 0.08 + rng.random() * 0.02)
    lib["coins"] = (x, None)
    lib["tick"] = (ticks(), None)
    lib["tick_b"] = (ticks(0.7, 0.02, 1.1, (2600, 5200)), None)
    lib["slide_down"] = (slide_down(), None)
    # 冲击
    lib["boom"] = (boom(), None)
    lib["slam"] = (slam(), None)
    lib["stamp"] = (stamp(), None)
    # 拟物
    lib["lock"] = (lock(), None)
    lib["scissors"] = (scissors(), None)
    lib["horn"] = (horn(), None)
    lib["truck"] = (truck(), (-0.9, 0.9))
    lib["paper"] = (paper(), None)
    lib["writing"] = (writing(), None)
    lib["marker"] = (marker(), None)
    lib["calendar"] = (calendar(), None)
    lib["stack"] = (stack(), None)
    lib["scan"] = (scan(), (-0.5, 0.5))
    lib["target"] = (target(), None)
    lib["crowd_in"] = (crowd_in(), None)
    lib["crowd_out"] = (crowd_out(), None)
    lib["sparkle"] = (sparkle(), None)
    lib["notify"] = (notify(), None)
    lib["chime_end"] = (chime_end(), None)
    lib["glitch"] = (glitch(), None)
    x = silence(0.9)
    for k in range(4):
        place(x, paper(0.16) * 0.7, k * 0.06)
    lib["map"] = (x, None)
    return lib


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith(".wav"):
            os.remove(os.path.join(out, f))
    lib = build()
    for k, (x, move) in lib.items():
        x = np.asarray(x, dtype=np.float64)
        pan = ((sum(map(ord, k)) % 5) - 2) / 10
        write(os.path.join(out, f"{k}.wav"), to_stereo(x, pan, move))
    print(f"wrote {len(lib)} sounds -> {out}")


if __name__ == "__main__":
    main()
