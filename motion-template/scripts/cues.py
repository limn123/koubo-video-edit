# -*- coding: utf-8 -*-
"""音效时间表（示例工程）：每类动作固定一种声音（见 scripts/sfx_v4.py 头部的对应表），同类用变体轮换，只卡关键节拍。
python scripts/cues.py src/sfx.json
"""
import json
import sys
from collections import Counter

C = [
    # —— 开场钩子（全屏）：价签甩进来 → 菜刀剁 → 心跳 → 刀光 ——
    (0.05, "boing", 0.06), (2.55, "punch", 0.1), (3.15, "whoosh_down", 0.1), (3.4, "boing", 0.07), (3.78, "blade", 0.08), (4.12, "chop", 0.16), (4.13, "boom", 0.07),
    (4.62, "heartbeat", 0.13), (5.45, "blade", 0.11),
    # —— 砍多少不是关键 ——
    (6.5, "whoosh", 0.16), (7.02, "tear", 0.1), (7.4, "pop", 0.09), (8.15, "marker", 0.1),
    (8.85, "whoosh", 0.12), (9.29, "tear", 0.08), (10.05, "pop", 0.1), (11.05, "tear", 0.07), (12.25, "pop", 0.1),
    # —— 挂了好几个月 / 一开口低一大截 ——
    (12.86, "whoosh", 0.13), (13.0, "pop", 0.09), (14.45, "flip", 0.1), (15.95, "notify", 0.1),
    (17.0, "whoosh", 0.1), (17.4, "slide_down", 0.1), (18.85, "marker", 0.09), (19.2, "wrong", 0.08),
    # —— 接 / 不接 ——
    (19.58, "whoosh", 0.12), (19.95, "pop", 0.09), (20.3, "wrong", 0.07), (21.35, "pop", 0.09), (21.75, "question", 0.09),
    (22.5, "pop", 0.09), (23.85, "question", 0.09),
    # —— 夜里翻来覆去 ——
    (24.85, "whoosh", 0.12), (24.95, "night", 0.08), (25.3, "coin_toss", 0.12), (25.85, "ding", 0.07), (26.6, "boing", 0.09),
    # —— 看什么（全屏）——
    (27.72, "whoosh", 0.14), (27.82, "paper", 0.09), (28.8, "punch", 0.1), (29.55, "pop", 0.09), (29.85, "pop", 0.09), (30.1, "pop", 0.09),
    # —— 01 他手里的价 ——
    (30.42, "whoosh", 0.18), (31.3, "paper", 0.1), (32.55, "question", 0.09), (33.6, "pop", 0.1),
    (35.55, "pop", 0.09), (35.8, "pop", 0.09), (36.05, "pop", 0.09),
    (37.05, "whoosh", 0.12), (37.25, "shutter", 0.12), (38.85, "pop", 0.09), (40.3, "pop", 0.09),
    (41.6, "slam", 0.15), (41.63, "boom", 0.1),
    (42.15, "whoosh", 0.12), (42.4, "shutter", 0.12), (43.6, "tick", 0.07), (45.2, "slide_down", 0.09), (45.45, "shutter", 0.08),
    (47.25, "marker", 0.09),
    (48.25, "whoosh", 0.12), (48.4, "pop", 0.09), (49.75, "pop", 0.08), (50.0, "pop", 0.08), (50.25, "pop", 0.08),
    (51.95, "pop", 0.09), (52.35, "slide_down", 0.11), (53.62, "blade", 0.13),
    (54.5, "whoosh", 0.12), (55.6, "pop", 0.1), (55.9, "correct", 0.08), (56.85, "pop", 0.1),
    (57.35, "whoosh", 0.12), (57.45, "question", 0.08), (59.6, "tick", 0.08), (60.9, "boing", 0.1), (61.75, "spin", 0.09),
    (62.3, "boing", 0.08), (62.42, "stamp", 0.14),
    # —— 02 他走了之后 ——
    (62.95, "swipe", 0.17), (63.25, "pop", 0.08), (63.75, "steps_away", 0.1), (64.6, "wrong", 0.07), (65.95, "question", 0.08),
    (66.98, "whoosh", 0.12), (67.25, "thud_stack", 0.1), (68.85, "pop", 0.1), (69.45, "whoosh_down", 0.08), (70.6, "drip", 0.12),
    (71.64, "whoosh", 0.12), (71.75, "pop", 0.08), (72.35, "whoosh_down", 0.08), (73.9, "whoosh", 0.09), (74.3, "ding", 0.08),
    (75.52, "whoosh", 0.12), (75.65, "shutter", 0.12), (77.55, "cash", 0.1), (78.7, "pop", 0.09), (80.5, "stamp", 0.15),
    (81.1, "pop", 0.08), (81.35, "drop_duang", 0.13),
    (82.25, "whoosh", 0.12), (83.95, "steps_away", 0.1), (85.0, "door", 0.13), (85.6, "question", 0.08), (86.5, "pop", 0.09),
    # —— 03 你心里的价 ——
    (87.45, "swipe", 0.17), (87.6, "marker", 0.07), (88.2, "pop", 0.09), (89.5, "question", 0.08),
    (90.85, "whoosh", 0.12), (91.0, "shutter", 0.12), (92.4, "pop", 0.09), (93.85, "wrong", 0.08), (95.1, "cash", 0.1),
    (96.3, "clock", 0.09), (97.35, "wrong", 0.07),
    (97.65, "whoosh", 0.12), (98.3, "slide_down", 0.08), (99.55, "chain", 0.13), (100.0, "shutter", 0.08), (100.95, "gavel", 0.16),
    (101.82, "whoosh", 0.12), (101.95, "whoosh_down", 0.09), (102.55, "tick", 0.07), (103.1, "pop", 0.09), (104.3, "pop", 0.08),
    (106.2, "marker", 0.08), (106.7, "slam", 0.16), (106.73, "boom", 0.11),
    (107.52, "whoosh", 0.12), (107.65, "spin", 0.09), (108.6, "pop", 0.09), (110.6, "pop", 0.08), (111.2, "marker", 0.08),
    (112.1, "whoosh", 0.1),
    # —— 一个毛病（全屏）——
    (113.6, "whoosh", 0.14), (113.7, "paper", 0.09), (114.9, "punch", 0.1),
    # —— 心慌 / 接太急 / 拖太久 ——
    (115.58, "whoosh", 0.16), (115.8, "heartbeat", 0.12), (118.1, "boing", 0.08),
    (119.72, "whoosh", 0.12), (120.75, "coin_fly", 0.08), (121.25, "coin_fly", 0.08), (121.75, "coin_fly", 0.08), (123.15, "gift", 0.12),
    (123.9, "whoosh", 0.12), (124.7, "steps_away", 0.08), (125.5, "whoosh_down", 0.07),
    (127.5, "tear", 0.09), (127.95, "tear", 0.09), (128.35, "tear", 0.09), (128.75, "tear", 0.09),
    # —— 都有人疼（全屏）——
    (129.12, "whoosh", 0.14), (129.25, "paper", 0.09), (130.74, "punch", 0.1), (131.6, "pop", 0.08),
    # —— 先别急 / 先问三句 ——
    (132.48, "whoosh", 0.12), (132.52, "notify", 0.08), (132.8, "typing", 0.09), (133.55, "backspace", 0.1),
    (134.5, "whoosh", 0.1), (134.9, "pop", 0.09), (136.1, "pop", 0.09), (136.4, "tape", 0.11), (137.9, "question", 0.08),
    (138.7, "whoosh", 0.1), (139.0, "radar", 0.1), (140.5, "whoosh_down", 0.08), (140.85, "pop", 0.09),
    (141.45, "whoosh", 0.1), (142.4, "pop", 0.08), (142.7, "clock", 0.08), (145.3, "pop", 0.09), (145.6, "question", 0.08),
    # —— 入行背书（全屏）——
    (146.72, "whoosh", 0.14), (146.85, "paper", 0.09), (147.66, "punch", 0.1), (149.2, "pop", 0.08), (150.72, "punch", 0.1), (153.55, "punch", 0.08),
    # —— 不劝接 / 不劝不接 ——
    (154.26, "whoosh", 0.12), (154.4, "ding", 0.07), (155.0, "balance", 0.1), (155.3, "marker", 0.08),
    (155.9, "stamp", 0.12), (156.85, "stamp", 0.12), (157.2, "pop", 0.08),
    # —— 号召（全屏）——
    (157.86, "whoosh", 0.14), (157.98, "paper", 0.09),
    (158.0, "pop", 0.09), (158.3, "typing_s", 0.09), (158.8, "typing_s", 0.09), (159.4, "typing_s", 0.09), (160.45, "typing_s", 0.09),
    (160.95, "whoosh", 0.07), (161.6, "punch", 0.09), (161.88, "paper", 0.08), (163.3, "punch", 0.09), (163.6, "chime_end", 0.1),
]

# 同类动作的变体轮换（按出现顺序依次取，循环使用）；音效由 scripts/sfx_v4.py 生成
FAMILY = {
    "whoosh": ["whoosh_1", "whoosh_2", "whoosh_3", "whoosh_4", "whoosh_5"],
    "pop": ["pop_3", "pop_1", "pop_5", "pop_2", "pop_6", "pop_4"],
    "swipe": ["swipe_1", "swipe_2"],
    "punch": ["punch_1", "punch_2"],
}
KEEP = ("whoosh", "swipe", "stamp", "slam", "boom")  # 结构性音效：不参与合并
# 这些声音本身就对应“同一类动作连续发生”（连拍快门、硬币一枚枚飞、日历一页页撕……），允许相邻重复
ALLOW_REPEAT = {"shutter", "tick", "coin_fly", "tear", "stamp", "question", "wrong", "marker", "paper", "typing_s"}
MAX_USE = 12
GAIN = 1.7


def vary(cues):
    out = []
    for c in cues:
        if out and c[0] - out[-1][0] < 0.25 and not c[1].startswith(KEEP) and not out[-1][1].startswith(KEEP):
            print(f"  合并：{c} 与 {out[-1]} 相距不足 0.25s，跳过")
            continue
        out.append(c)
    pos = {}
    res = []
    for t, n, v in out:
        fam = FAMILY.get(n)
        if fam:
            i = pos.get(n, 0)
            pos[n] = i + 1
            n = fam[i % len(fam)]
        res.append((t, n, v))
    return res


def main():
    cues = vary(sorted(C))
    names = [n for _, n, _ in cues]
    bad = [(cues[i][0], n) for i, n in enumerate(names[1:], 1) if n == names[i - 1] and n not in ALLOW_REPEAT]
    assert not bad, f"同一音效连续出现：{bad}"
    cnt = Counter(names)
    over = [(n, k) for n, k in cnt.items() if k > MAX_USE and n not in ALLOW_REPEAT]
    assert not over, f"同一音效出现超过 {MAX_USE} 次：{over}"
    print(f"{len(cues)} 条音效，{len(cnt)} 种；最多：{cnt.most_common(6)}")
    json.dump([[t, n, round(v * GAIN, 3)] for t, n, v in cues], open(sys.argv[1], "w"), indent=0)


if __name__ == "__main__":
    main()
