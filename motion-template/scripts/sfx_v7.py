# -*- coding: utf-8 -*-
"""示例工程音效（本条重新合成，程序化，无版权风险；从 v6 换随机种子、重调 whoosh / pop / ding / punch 的频率和包络）。
本条新增：服务台按铃 desk_bell、衣架挂上咔哒 hanger_1..8（一件比一件高，像音阶往上走）、冷得打哆嗦 shiver、道闸抬杆 barrier、
汽车停进车位 car_park、温度计下降 cool_down、集卡点亮木琴 blip_1..4（上行）、第二种消息提示 notify_2、第二种印章 stamp_2、闪白转场 flash。
本条新增：电梯到站叮咚 lift、公交喇叭 bus_horn、汽车呼啸而过 car_by、来电铃 phone_ring、小火车汽笛 train、
水位上涨咕噜 bubbles、方块翻转噼里啪啦 tiles、卷尺回弹 tape_snap。
沿用爆款口播“一类动作一种声音”的对应关系，每条重新调音色；同类动作准备多个变体轮换，避免同一个声音反复出现。
本条（探房）新增：钥匙叮当 keys、行李箱落地 bag_land、开关拨动 switch、闹铃 alarm、穿堂风 wind、地暖热浪 heat、新风气流 air、
锁扣 lock、开门 door_open、星光 sparkle、吊牌晃 swing。
上一条新增：菜刀剁、刀光嗖、硬币抛起旋转、法槌、锁链崩断、心跳、时钟滴答、关门、雷达 ping、打字/删字、卷尺拉出、
硬币飞出、礼盒弹开、撕日历、仪表指针晃、漏斗滴落、照片砸进堆、月份翻页、指南针晃、天平摇。

动作 → 声音：
  人物缩放/段落转场=whoosh_1..5（轮换）  章节切换（甩镜）=swipe_1/2  照片=shutter  标签/卡片弹出=pop_1..6  好/打勾=correct
  不好/打叉=wrong  疑问=question  消息=notify  钱/价格=cash、coin_fly  数字滚动=tick  降价=slide_down  暴跌=drop_duang
  结论大字=slam + boom（全片 2 处）  印章=stamp  荧光笔/划掉=marker  菜刀剁=chop  刀光=blade  抛硬币=coin_toss
  法槌=gavel  锁链断=chain  心跳=heartbeat  时钟=clock  关门=door  雷达=radar  打字=typing  删字=backspace  卷尺=tape
  礼盒=gift  撕日历=tear  仪表晃=boing  漏斗=drip  照片砸进堆=thud_stack  月份翻页=flip  罗盘=spin  天平=balance
  夜里=night  全屏关键词推近=punch_1/2  评论框打字=typing_s  结尾=chime_end

python scripts/sfx_v6.py public/sfx
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import sfx_baokuan as K  # 只复用底层合成原语（噪声、包络、正弦叠加），每个声音在这里重新调参
from sfx_baokuan import M, SR, band, click, env, noise, partials, place, room, silence, sweep, t_, thump, to_stereo, whoosh_core, write

rng = np.random.default_rng(1109)


def pop(f0, d=0.07):
    x = t_(d)
    f = f0 * (1 + 1.1 * (x / d) ** 0.55)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.022) * np.minimum(1, x / 0.0012)
    return M(s, click(2400, 7200, 0.003) * 0.2)


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


# ---------------- 本条新增 ----------------
def keys():
    """钥匙串叮当：几声错开的高频金属小铃"""
    x = silence(0.6)
    for k, f in enumerate([3150, 4210, 3620, 4880]):
        place(x, partials(f, 0.28, [1, 2.76], [0.07, 0.035], [0.7, 0.25]) * (0.8 - k * 0.12), k * 0.055 + rng.random() * 0.015)
    return x


def bag_land():
    """行李箱砸到地上：闷“咚”+ 轮子咔嗒两下"""
    x = silence(0.6)
    place(x, M(thump(72, 0.32, 1.1), band(noise(0.07), 120, 1800) * env(int(SR * 0.07), 0.001, 0.025) * 0.5), 0)
    place(x, click(1800, 5200, 0.01) * 0.5, 0.06)
    place(x, click(1600, 4800, 0.01) * 0.35, 0.13)
    return room(x, 0.12)


def switch():
    """开关拨过去：两声短促塑料咔哒"""
    x = silence(0.3)
    place(x, M(click(1800, 6500, 0.006), thump(260, 0.05, 0.4) * 0.35), 0)
    place(x, M(click(2400, 8000, 0.005) * 0.8, thump(320, 0.04, 0.4) * 0.3), 0.07)
    return x


def alarm(n=6, gap=0.075):
    """闹铃：小锤快速敲两个铃"""
    x = silence(n * gap + 0.35)
    for i in range(n):
        place(x, partials(2380 if i % 2 == 0 else 2610, 0.16, [1, 2.4, 3.9], [0.05, 0.03, 0.02], [0.7, 0.25, 0.1]), i * gap)
    return x


def wind(d=1.2):
    """穿堂风：低通噪声缓慢鼓起再落下，带一点呼啸"""
    a = whoosh_core(d, 260, 900, 0.45)
    b = whoosh_core(d, 900, 2200, 0.5) * 0.35
    return M(a, b)


def heat(d=1.0):
    """地暖热浪：暖色低频嗡 + 缓慢上扬的软噪声"""
    tt = t_(d)
    hum = np.sin(2 * np.pi * (110 + 40 * tt / d) * tt) * np.sin(np.pi * tt / d) * 0.35
    return M(hum, whoosh_core(d, 300, 1400, 0.6) * 0.6)


def air(d=0.8):
    """新风：明亮的气流嘶声从一侧扫过"""
    return M(whoosh_core(d, 1800, 5200, 0.4) * 0.8, whoosh_core(d, 700, 1600, 0.5) * 0.3)


def door_open():
    """开门：门锁咔嗒 + 门轴轻吱 + 空气“呼”"""
    x = silence(0.9)
    place(x, click(1800, 6000, 0.008) * 0.6, 0)
    tt = t_(0.3)
    creak = band(K.square(190, 0.3, 0.3) * (1 + 0.4 * np.sin(2 * np.pi * 19 * tt)), 350, 2600) * np.sin(np.pi * tt / 0.3) * 0.2
    place(x, creak, 0.05)
    place(x, whoosh_core(0.5, 400, 1600, 0.5) * 0.6, 0.12)
    return room(x, 0.14, 0.35)


def swing():
    """吊牌晃：两声轻木吱呀"""
    x = silence(0.7)
    for i, f in enumerate([520, 430]):
        tt = t_(0.18)
        c = band(K.square(f, 0.18, 0.35) * (1 + 0.3 * np.sin(2 * np.pi * 31 * tt)), 400, 3000) * np.sin(np.pi * tt / 0.18) * 0.3
        place(x, c, i * 0.3)
    return x


def lift():
    """电梯到站：叮—咚 两声柔和钟音"""
    x = silence(1.3)
    place(x, ding(1318.5, 0.9) * 0.9, 0)
    place(x, ding(1046.5, 1.0) * 0.9, 0.32)
    return x


def bus_horn():
    """公交喇叭：嘀嘀两声（方波和弦，带通）"""
    x = silence(0.6)
    for i in range(2):
        d = 0.14
        b = M(K.square(392, d, 0.5), K.square(494, d, 0.5) * 0.8)
        b = band(b, 200, 3200) * env(int(SR * d), 0.005, 0.12) * 0.55
        place(x, b, i * 0.2)
    return x


def car_by(d=0.9):
    """汽车呼啸而过：发动机低频锯齿 + 多普勒下滑 + 风噪"""
    tt = t_(d)
    f = 150 * (90 / 150) ** (1 / (1 + np.exp(-(tt - d * 0.55) * 14)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = (ph / np.pi) % 2 - 1
    amp = np.exp(-((tt - d * 0.55) / (d * 0.28)) ** 2)
    eng = band(saw, 60, 1800) * amp * 0.55
    return M(eng, whoosh_core(d, 500, 2600, 0.55) * 0.5)


def phone_ring(n=8, gap=0.05):
    """来电铃：两个频率快速交替的电子铃"""
    x = silence(n * gap * 2 + 0.2)
    for i in range(n * 2):
        f = 1320 if i % 2 == 0 else 1650
        place(x, np.sin(2 * np.pi * f * t_(gap)) * env(int(SR * gap), 0.002, gap) * 0.32, i * gap)
    return x


def train():
    """小火车：呜——一声短汽笛（三和弦带颤音）"""
    d = 0.7
    tt = t_(d)
    vib = 1 + 0.008 * np.sin(2 * np.pi * 6 * tt)
    s = sum(np.sin(2 * np.pi * f * np.cumsum(vib) / SR) * a for f, a in [(587, 0.5), (740, 0.4), (880, 0.3)])
    return band(s, 300, 4000) * env(len(tt), 0.06, 0.35) * 0.45


def bubbles(n=7):
    """水位上涨：一串咕噜气泡（上滑短正弦）"""
    x = silence(0.9)
    for i in range(n):
        f0 = 300 + rng.random() * 400
        d = 0.06
        b = sweep(f0, f0 * 2.4, d, 0.6) * env(int(SR * d), 0.002, 0.03) * 0.5
        place(x, b, i * 0.1 + rng.random() * 0.03)
    return x


def tiles(n=10, gap=0.035):
    """方块翻转：一串轻快的塑料咔嗒"""
    x = silence(n * gap + 0.15)
    for i in range(n):
        place(x, click(1800 + i * 120, 6500, 0.012) * (0.8 - i * 0.04), i * gap)
    return x


def tape_snap():
    """卷尺：拉出时连续咔咔 + 尾部弹回一下"""
    x = silence(0.8)
    place(x, tape(0.45), 0)
    place(x, thump(180, 0.12, 2.0) * 0.4, 0.5)
    return x




def desk_bell():
    """服务台按铃：清脆“叮——”，带长尾和轻微拍频"""
    x = partials(2093.0, 1.2, [1, 2.76, 5.4], [0.36, 0.12, 0.05], [1, 0.4, 0.15]) * np.minimum(1, t_(1.2) / 0.001)
    return M(x, click(3000, 8000, 0.004) * 0.3)


def hanger(f=1250.0):
    """衣架挂上横杆：金属小“咔哒”+ 一点颤音；f 控制音高，8 件衣服依次升高"""
    x = silence(0.3)
    place(x, click(1800, 6000, 0.006) * 0.55, 0)
    place(x, partials(f, 0.22, [1, 2.4], [0.18, 0.06], [1, 0.3]), 0.004)
    place(x, click(2400, 7000, 0.004) * 0.25, 0.05)
    return x


def blip(f):
    """木琴音：集卡一格格点亮"""
    d = 0.35
    x = partials(f, d, [1, 3.9, 9.2], [0.32, 0.08, 0.025], [1, 0.25, 0.08]) * np.minimum(1, t_(d) / 0.0015)
    return M(x, click(2500, 6000, 0.003) * 0.15)


def notify_2():
    """第二种消息提示：两声木质“嘟嘟”，和 notify 的叮咚区分开"""
    x = silence(0.5)
    for i, f in enumerate([880.0, 1174.7]):
        place(x, partials(f, 0.14, [1, 2.0], [0.26, 0.05], [1, 0.3]) * np.minimum(1, t_(0.14) / 0.002), i * 0.11)
    return x


def stamp_2():
    """第二种印章：更脆的“啪”+ 纸面震一下"""
    return room(M(thump(150, 0.16, 0.5), band(noise(0.04), 600, 4200) * env(int(SR * 0.04), 0.001, 0.012) * 0.9), 0.08)


def flash():
    """闪白转场：上扬的亮音扫过 + 一点空气"""
    d = 0.45
    tt = t_(d)
    f = 900 * (3200 / 900) ** ((tt / d) ** 0.7)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.05, 0.2) * 0.25
    return M(x, whoosh_core(0.4, 900, 7000, 0.6) * 0.6, K.sparkle(0.5) * 0.3)


def shiver(d=0.9):
    """冷得打哆嗦：“brrr”——低频噪声按 22Hz 抖动"""
    tt = t_(d)
    n = band(noise(d), 120, 900)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 22 * tt)
    return n * am * env(len(tt), 0.05, 0.35) * 0.8


def barrier():
    """道闸抬杆：电机嗡一声上扬 + 末尾“咔”"""
    d = 0.55
    tt = t_(d)
    f = 180 * (360 / 180) ** (tt / d)
    m = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + band(noise(d), 300, 2000) * 0.15
    x = M(m * env(len(tt), 0.03, 0.12), silence(0.7))
    place(x, click(1500, 5000, 0.008) * 0.6, d - 0.02)
    return x


def car_park():
    """小车开进车位：引擎低吼减速 + 轻刹车"""
    d = 0.8
    tt = t_(d)
    f = 120 * (70 / 120) ** (tt / d)
    eng = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * tt))
    x = M(band(eng, 50, 800) * env(len(tt), 0.08, 0.3) * 0.6, silence(1.0))
    place(x, band(noise(0.18), 2500, 6500) * env(int(SR * 0.18), 0.01, 0.12) * 0.12, d - 0.1)
    return x


def cool_down():
    """温度计往下掉：下滑的玻璃音 + 一点冰凉的高频闪"""
    d = 0.6
    tt = t_(d)
    f = 1800 * (600 / 1800) ** ((tt / d) ** 0.8)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.3) * 0.5
    return M(x, K.sparkle(0.5) * 0.35)


def build():
    lib = {}
    lib["whoosh_1"] = (whoosh_core(0.36, 400, 4500), (-0.5, 0.5))
    lib["whoosh_2"] = (whoosh_core(0.32, 600, 5600, 0.5), (0.5, -0.5))
    lib["whoosh_3"] = (whoosh_core(0.44, 300, 3300, 0.44), (-0.3, 0.6))
    lib["whoosh_4"] = (whoosh_core(0.29, 720, 6800, 0.56), (0.6, -0.3))
    lib["whoosh_5"] = (whoosh_core(0.4, 470, 3800, 0.4), (-0.6, 0.2))
    lib["whoosh_down"] = (whoosh_core(0.46, 2800, 320, 0.4), (0.3, -0.3))
    for i, (a, b) in enumerate([(540, 7200), (460, 6000)]):
        x = M(whoosh_core(0.3, a, b, 0.6), silence(0.4))
        place(x, thump(56, 0.3, 1.0) * 0.5, 0.22)
        lib[f"swipe_{i + 1}"] = (x, (-0.8, 0.8) if i % 2 == 0 else (0.8, -0.8))
    for i, f in enumerate([590, 680, 780, 890, 1020, 1170]):
        lib[f"pop_{i + 1}"] = (pop(f), None)
    lib["ding"] = (ding(1567.98), None)
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
    lib["punch_1"] = (punch(100, 1.0), None)
    lib["punch_2"] = (punch(128, 0.75), None)
    lib["typing_s"] = (typing(4, 0.07), None)
    lib["chime_end"] = (chime_end(), None)
    lib["keys"] = (keys(), None)
    lib["bag_land"] = (bag_land(), None)
    lib["switch"] = (switch(), None)
    lib["alarm"] = (alarm(), None)
    lib["wind"] = (wind(), (-0.2, 0.2))
    lib["heat"] = (heat(), None)
    lib["air"] = (air(), (0.7, -0.7))
    lib["lock"] = (K.lock(), None)
    lib["door_open"] = (door_open(), (-0.4, 0.4))
    lib["sparkle"] = (K.sparkle(0.8), None)
    lib["swing"] = (swing(), None)
    lib["lift"] = (lift(), None)
    lib["bus_horn"] = (bus_horn(), None)
    lib["car_by"] = (car_by(), (-0.7, 0.7))
    lib["phone_ring"] = (phone_ring(), None)
    lib["train"] = (train(), (-0.5, 0.5))
    lib["bubbles"] = (bubbles(), None)
    lib["tiles"] = (tiles(), None)
    lib["tape_snap"] = (tape_snap(), (-0.4, 0.4))
    lib["desk_bell"] = (desk_bell(), None)
    for i in range(8):
        lib[f"hanger_{i + 1}"] = (hanger(1046.5 * 2 ** (i * 2 / 12)), None)  # 大调全音阶往上走
    for i, f in enumerate([1046.5, 1174.7, 1318.5, 1568.0]):
        lib[f"blip_{i + 1}"] = (blip(f), None)
    lib["notify_2"] = (notify_2(), None)
    lib["stamp_2"] = (stamp_2(), None)
    lib["flash"] = (flash(), None)
    lib["shiver"] = (shiver(), None)
    lib["barrier"] = (barrier(), None)
    lib["car_park"] = (car_park(), (-0.7, 0.1))
    lib["cool_down"] = (cool_down(), None)
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
