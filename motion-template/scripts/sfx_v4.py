# -*- coding: utf-8 -*-
"""示例工程音效（本条重新合成，程序化，无版权风险）。
沿用爆款口播“一类动作一种声音”的对应关系，每条重新调音色；同类动作准备多个变体轮换，避免同一个声音反复出现。
本条新增：菜刀剁、刀光嗖、硬币抛起旋转、法槌、锁链崩断、心跳、时钟滴答、关门、雷达 ping、打字/删字、卷尺拉出、
硬币飞出、礼盒弹开、撕日历、仪表指针晃、漏斗滴落、照片砸进堆、月份翻页、指南针晃、天平摇。

动作 → 声音：
  人物缩放/段落转场=whoosh_1..5（轮换）  章节切换（甩镜）=swipe_1/2  照片=shutter  标签/卡片弹出=pop_1..6  好/打勾=correct
  不好/打叉=wrong  疑问=question  消息=notify  钱/价格=cash、coin_fly  数字滚动=tick  降价=slide_down  暴跌=drop_duang
  结论大字=slam + boom（全片 2 处）  印章=stamp  荧光笔/划掉=marker  菜刀剁=chop  刀光=blade  抛硬币=coin_toss
  法槌=gavel  锁链断=chain  心跳=heartbeat  时钟=clock  关门=door  雷达=radar  打字=typing  删字=backspace  卷尺=tape
  礼盒=gift  撕日历=tear  仪表晃=boing  漏斗=drip  照片砸进堆=thud_stack  月份翻页=flip  罗盘=spin  天平=balance
  夜里=night  全屏关键词推近=punch_1/2  评论框打字=typing_s  结尾=chime_end

python scripts/sfx_v4.py public/sfx
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import sfx_baokuan as K  # 只复用底层合成原语（噪声、包络、正弦叠加），每个声音在这里重新调参
from sfx_baokuan import M, SR, band, click, env, noise, partials, place, room, silence, sweep, t_, thump, to_stereo, whoosh_core, write

rng = np.random.default_rng(1104)


def pop(f0, d=0.07):
    x = t_(d)
    f = f0 * (1 + 1.1 * (x / d) ** 0.55)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.022) * np.minimum(1, x / 0.0012)
    return M(s, click(2600, 7500, 0.003) * 0.22)


def ding(f, d=0.7):
    return partials(f, d, [1, 2.0, 3.0, 4.1], [0.34, 0.13, 0.07, 0.03], [1, 0.32, 0.12, 0.05]) * np.minimum(1, t_(d) / 0.002)


def correct():
    x = silence(0.8)
    place(x, ding(1318.5, 0.25), 0)
    place(x, ding(1760.0, 0.6), 0.1)
    return x


def wrong():
    x = silence(0.48)
    for i, f in enumerate([233.1, 174.6]):
        b = band(K.square(f, 0.16, 0.4), 90, 2600) * env(int(SR * 0.16), 0.004, 0.1)
        place(x, b, i * 0.18)
    return x


def question():
    d = 0.32
    tt = t_(d)
    f = 400 * (840 / 400) ** ((tt / d) ** 1.5) * (1 + 0.03 * np.sin(2 * np.pi * 13 * tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.16)


def drop_duang():
    d = 0.75
    tt = t_(d)
    f = 860 * (100 / 860) ** ((tt / d) ** 1.25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tri = 2 / np.pi * np.arcsin(np.sin(ph))
    x = silence(1.1)
    place(x, tri * env(len(tt), 0.01, 0.4) * 0.8, 0)
    place(x, thump(55, 0.4, 1.2), 0.62)
    return x


def chop():
    """菜刀剁到砧板：短促木头闷响 + 金属颤音 + 一点碎屑"""
    x = silence(0.6)
    place(x, M(thump(140, 0.16, 0.9) * 1.1, band(noise(0.04), 400, 4000) * env(int(SR * 0.04), 0.0005, 0.01)), 0)
    place(x, partials(2850, 0.45, [1, 1.38, 2.7], [0.12, 0.07, 0.04], [0.35, 0.2, 0.1]), 0.002)
    return room(x, 0.1)


def blade(d=0.32):
    """刀光：高频细 whoosh + 末尾“叮”的金属尾音"""
    x = silence(d + 0.4)
    place(x, whoosh_core(d, 2500, 9000, 0.7) * 0.9, 0)
    place(x, partials(5200, 0.35, [1, 1.5], [0.08, 0.05], [0.4, 0.15]), d * 0.75)
    return x


def coin_toss():
    """硬币抛起：叮 + 旋转嗡嗡"""
    x = silence(0.9)
    place(x, partials(3900, 0.3, [1, 1.47], [0.1, 0.06], [1, 0.4]), 0)
    tt = t_(0.7)
    spin = band(noise(0.7), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 26 * tt)) * np.sin(np.pi * tt / 0.7) * 0.35
    place(x, spin, 0.08)
    return x


def gavel():
    """法槌：两声木头敲击（第二下重）"""
    x = silence(0.7)
    knock = lambda g: M(thump(190, 0.14, 0.5) * g, band(noise(0.03), 500, 3500) * env(int(SR * 0.03), 0.0005, 0.008) * g * 0.8)
    place(x, knock(0.5), 0)
    place(x, knock(1.0), 0.16)
    return room(x, 0.18, 0.35)


def chain():
    """锁链崩断：几声金属叮当 + 一声断裂"""
    x = silence(0.7)
    for k in range(3):
        place(x, partials(2300 + 400 * rng.random(), 0.12, [1, 2.6], [0.04, 0.02], [0.5, 0.25]), k * 0.05)
    place(x, M(band(noise(0.06), 1500, 9000) * env(int(SR * 0.06), 0.0005, 0.015) * 1.2, partials(1700, 0.3, [1, 2.2, 3.9], [0.08, 0.05, 0.03], [0.6, 0.3, 0.15])), 0.18)
    return x


def heartbeat(n=3, gap=0.42):
    x = silence(n * gap + 0.3)
    for k in range(n):
        place(x, thump(55, 0.16, 0.6), k * gap)
        place(x, thump(48, 0.14, 0.6) * 0.7, k * gap + 0.14)
    return x


def clock(n=6, gap=0.25):
    x = silence(n * gap + 0.1)
    for k in range(n):
        f = 3200 if k % 2 == 0 else 2600
        place(x, M(click(f - 600, f + 1800, 0.004), partials(f / 2, 0.03, [1], [0.008], [0.3])), k * gap)
    return x


def door():
    """关门：吱 + 咚 + 门锁咔嗒"""
    x = silence(0.8)
    tt = t_(0.25)
    creak = band(K.square(160, 0.25, 0.3) * (1 + 0.5 * np.sin(2 * np.pi * 23 * tt)), 300, 2400) * np.sin(np.pi * tt / 0.25) * 0.25
    place(x, creak, 0)
    place(x, M(thump(85, 0.3, 0.7), band(noise(0.06), 100, 1500) * env(int(SR * 0.06), 0.001, 0.02)), 0.22)
    place(x, click(2000, 6000, 0.008) * 0.6, 0.36)
    return room(x, 0.15, 0.4)


def radar():
    """雷达 ping：纯音 + 两次回声"""
    x = silence(1.2)
    p = partials(1480, 0.5, [1, 2.0], [0.12, 0.05], [1, 0.2])
    place(x, p, 0)
    place(x, p * 0.4, 0.28)
    place(x, p * 0.16, 0.56)
    return x


def typing(n=9, gap=0.085):
    x = silence(n * gap + 0.1)
    for k in range(n):
        place(x, M(click(1800, 6500, 0.006), thump(320 + 40 * rng.random(), 0.03, 0.2) * 0.25) * (0.7 + 0.3 * rng.random()), k * gap + rng.random() * 0.015)
    return x


def backspace(n=7, gap=0.06):
    x = silence(n * gap + 0.1)
    for k in range(n):
        place(x, M(click(1400, 4200, 0.005), thump(260, 0.025, 0.2) * 0.3) * 0.8, k * gap)
    return x


def tape(d=0.9):
    """卷尺拉出：棘轮咔咔咔（越来越快）+ 末尾“啪”"""
    x = silence(d + 0.2)
    tt, gap = 0.0, 0.05
    while tt < d - 0.05:
        place(x, click(2500, 8000, 0.004) * 0.7, tt)
        tt += gap
        gap = max(0.018, gap * 0.93)
    place(x, M(click(1500, 6000, 0.01), thump(300, 0.05, 0.3) * 0.5), d)
    return x


def gift():
    """礼盒弹开：啵 + 闪亮"""
    x = silence(0.9)
    place(x, pop(520, 0.09) * 1.2, 0)
    for k in range(8):
        place(x, partials(2600 + rng.random() * 3000, 0.25, [1], [0.06], [1]) * (0.3 + 0.3 * rng.random()), 0.06 + k * 0.05)
    return x


def tear(d=0.22):
    tt = t_(d)
    rip = band(noise(d), 900, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 55 * tt))) * env(len(tt), 0.003, d / 2.2)
    return M(rip, click(1500, 5000, 0.006) * 0.5)


def boing(d=0.6):
    tt = t_(d)
    f = 180 + 120 * np.exp(-tt / 0.15) * np.cos(2 * np.pi * 9 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.004, d / 2.5) * 0.9


def drip():
    tt = t_(0.18)
    f = 700 * (1700 / 700) ** (tt / 0.18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.05)


def thud_stack(n=8, gap=0.2):
    x = silence(n * gap + 0.3)
    for k in range(n):
        place(x, M(thump(120 + 12 * k, 0.12, 0.4) * 0.8, band(noise(0.05), 800, 5000) * env(int(SR * 0.05), 0.001, 0.015) * 0.5), k * gap)
    return x


def flip(n=5, gap=0.17):
    x = silence(n * gap + 0.25)
    for k in range(n):
        place(x, K.paper(0.1) * (0.6 + 0.08 * k), k * gap)
    return x


def spin_wobble(d=0.7):
    """指南针晃：快速来回的小金属刮擦"""
    tt = t_(d)
    return band(noise(d), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * env(len(tt), 0.01, d / 2) * 0.6


def balance():
    """天平摇：两声轻木吱呀 + 小铃"""
    x = silence(0.9)
    for k in range(2):
        tt = t_(0.18)
        place(x, band(K.square(200 + 30 * k, 0.18, 0.35), 300, 2500) * np.sin(np.pi * tt / 0.18) * 0.3, k * 0.3)
    place(x, ding(2349.3, 0.4) * 0.5, 0.55)
    return x


def night(d=1.6):
    x = silence(d)
    for k in range(5):
        tt = t_(0.18)
        ch = np.sin(2 * np.pi * 4300 * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 42 * tt))) * env(len(tt), 0.01, 0.06)
        place(x, ch * 0.35, k * 0.3 + rng.random() * 0.05)
    return x


def coin_fly():
    x = silence(0.6)
    place(x, whoosh_core(0.22, 1200, 4000, 0.6) * 0.4, 0)
    place(x, K.coin(4100 + 500 * rng.random()), 0.2)
    return x


def steps_away(n=4, gap=0.24):
    x = silence(n * gap + 0.2)
    for k in range(n):
        place(x, M(thump(110, 0.08, 0.3) * 0.6, click(800, 3000, 0.01) * 0.4) * (1 - 0.15 * k), k * gap)
    return x


def punch(f=95, bright=1.0):
    """镜头推近：短促的低频“咚”+ 一点空气感（比 slam 轻得多）"""
    x = silence(0.4)
    place(x, M(thump(f, 0.22, 0.9), band(noise(0.08), 300, 2500) * env(int(SR * 0.08), 0.002, 0.03) * 0.35 * bright), 0)
    return room(x, 0.1)


def chime_end():
    x = silence(1.8)
    for k, f in enumerate([1174.7, 1480.0, 1760.0, 2349.3]):
        place(x, ding(f, 1.2) * 0.8, k * 0.1)
    return room(x, 0.15)


def build():
    lib = {}
    lib["whoosh_1"] = (whoosh_core(0.42, 300, 3400), (-0.5, 0.5))
    lib["whoosh_2"] = (whoosh_core(0.38, 480, 4400, 0.5), (0.5, -0.5))
    lib["whoosh_3"] = (whoosh_core(0.5, 240, 2600, 0.45), (-0.3, 0.6))
    lib["whoosh_4"] = (whoosh_core(0.34, 640, 5600, 0.6), (0.6, -0.3))
    lib["whoosh_5"] = (whoosh_core(0.46, 380, 3000, 0.4), (-0.6, 0.2))
    lib["whoosh_down"] = (whoosh_core(0.46, 2800, 320, 0.4), (0.3, -0.3))
    for i, (a, b) in enumerate([(540, 7200), (460, 6000)]):
        x = M(whoosh_core(0.3, a, b, 0.6), silence(0.4))
        place(x, thump(56, 0.3, 1.0) * 0.5, 0.22)
        lib[f"swipe_{i + 1}"] = (x, (-0.8, 0.8) if i % 2 == 0 else (0.8, -0.8))
    for i, f in enumerate([500, 590, 680, 780, 900, 1040]):
        lib[f"pop_{i + 1}"] = (pop(f), None)
    lib["ding"] = (ding(1568.0), None)
    lib["correct"] = (correct(), None)
    lib["wrong"] = (wrong(), None)
    lib["question"] = (question(), None)
    lib["shutter"] = (K.shutter(), None)
    lib["notify"] = (K.notify(), None)
    lib["cash"] = (K.cash(), None)
    lib["coin_fly"] = (coin_fly(), (-0.6, 0.6))
    lib["tick"] = (K.ticks(0.7, 0.026, 1.06, (2700, 5400)), None)
    lib["slide_down"] = (K.slide_down(0.6), None)
    lib["drop_duang"] = (drop_duang(), None)
    lib["boom"] = (K.boom(1.0), None)
    lib["slam"] = (K.slam(), None)
    lib["stamp"] = (K.stamp(), None)
    lib["marker"] = (K.marker(0.4), None)
    lib["paper"] = (K.paper(0.22), None)
    lib["chop"] = (chop(), None)
    lib["blade"] = (blade(), (0.6, -0.6))
    lib["coin_toss"] = (coin_toss(), None)
    lib["gavel"] = (gavel(), None)
    lib["chain"] = (chain(), None)
    lib["heartbeat"] = (heartbeat(), None)
    lib["clock"] = (clock(), None)
    lib["door"] = (door(), (0.3, 0.5))
    lib["radar"] = (radar(), None)
    lib["typing"] = (typing(), None)
    lib["backspace"] = (backspace(), None)
    lib["tape"] = (tape(), (-0.4, 0.4))
    lib["gift"] = (gift(), None)
    lib["tear"] = (tear(), (0, 0.6))
    lib["boing"] = (boing(), None)
    lib["drip"] = (drip(), None)
    lib["thud_stack"] = (thud_stack(), None)
    lib["flip"] = (flip(), None)
    lib["spin"] = (spin_wobble(), None)
    lib["balance"] = (balance(), None)
    lib["night"] = (night(), None)
    lib["steps_away"] = (steps_away(), (0.0, 0.9))
    lib["punch_1"] = (punch(95, 1.0), None)
    lib["punch_2"] = (punch(120, 0.7), None)
    lib["typing_s"] = (typing(4, 0.07), None)
    lib["chime_end"] = (chime_end(), None)
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
