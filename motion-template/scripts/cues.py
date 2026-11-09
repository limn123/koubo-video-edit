# -*- coding: utf-8 -*-
"""音效时间表（示例工程，第二版）：每类动作固定一种声音（见 scripts/sfx_v7.py 头部的对应表），同类用变体轮换，只卡关键节拍。
第三版按用户“衣架那一块音效有点重复”再减：衣架 8 下 → 3 下（第一件、第一排最后一件、最大一件，三种声音），
集卡 4 下木琴 → 1 声亮音；“嗖”只留人物全屏/圆环切换和换章甩镜，同一章里换画面不再“嗖”。全片约 50 处，任意 10 秒不超过 7 下。
时间：TEASER 里是新粗剪时间（开头 5.4 秒钩子），C 里是旧时间（与动画代码一致），输出前用 to_new 换算成新时间；
落在被删掉那句（旧 29.03–34.50）里的音效丢掉。
python scripts/cues.py src/sfx.json
"""
import json
import sys
from collections import Counter

# 旧时间 → 新时间（与 src/project.ts 的 SEGMAP 对应）：[新起点, 旧起点]
SEGMAP = [(0.0, -5.4), (34.433333, 34.5), (67.2, 67.27), (78.533333, 78.62), (83.633333, 83.71)]
CUT = (29.0333, 34.5)


def to_new(old):
    if CUT[0] <= old < CUT[1]:
        return None
    k = 0
    for i, (_, o) in enumerate(SEGMAP):
        if old >= o:
            k = i
    if k == 0 and old >= CUT[0]:
        k = 1
    n0, o0 = SEGMAP[k]
    return n0 + (old - o0)


TEASER = [
    # —— 钩子（新时间，全屏）：纸条 → 飘雪 → “-2℃”砸下 → 闪白进开场 ——
    (0.08, "paper", 0.08), (1.85, "wind", 0.05), (4.66, "slam", 0.09), (5.08, "flash", 0.1),
]

C = [
    # —— 开场：体检单晃 → 优点打勾 → 简单讲 → 缺点红圈 + 重点章 ——
    (2.35, "correct", 0.08), (7.08, "stamp", 0.12),
    # —— 优点：11 栋楼 / 商超 ——
    (7.55, "whoosh", 0.12), (8.4, "tiles", 0.08), (10.6, "cash", 0.08),
    # —— 户型尺码表（甩镜）：衣架一件比一件高 ——
    (11.3, "swipe", 0.12), (13.5, "hanger_1", 0.1), (16.24, "hanger_5", 0.09),
    (17.85, "air", 0.06), (20.66, "ding", 0.07),
    # —— 集卡册：木琴上行 → 基本集齐章 → 划掉特殊户型 ——
    (23.0, "sparkle", 0.06),
    (26.62, "stamp_2", 0.12),
    # —— 缺点来了（全屏）——
    (34.5, "whoosh", 0.1), (34.62, "punch", 0.08),
    # —— 01 物业收费：评论一条条冒出来 → 手指一划 ——
    (35.85, "whoosh", 0.12), (38.1, "notify", 0.08), (39.5, "notify_2", 0.08),
    (44.6, "desk_bell", 0.08), (46.2, "car_park", 0.09), (47.3, "barrier", 0.09), (48.1, "stamp", 0.12),
    (48.95, "thud_stack", 0.08),
    (51.8, "wrong", 0.07),
    # —— 个人意见 + 02 人工湖（全屏实景）——
    (53.05, "whoosh", 0.12),
    (55.62, "paper", 0.08), (59.0, "pop", 0.08), (63.55, "marker", 0.07), (66.3, "sparkle", 0.05),
    # —— 03 楼王 2 号楼（全屏）——
    (67.78, "paper", 0.08), (69.6, "punch", 0.08), (71.48, "punch", 0.07),
    # —— 外面光照长 / 屋里冷 ——
    (73.15, "whoosh", 0.12), (73.6, "heat", 0.06), (75.7, "wind", 0.06), (76.4, "shiver", 0.09),
    # —— 工作室 四五个月 ——
    (79.6, "keys", 0.08), (81.05, "swing", 0.08),
    # —— 低两度 ——
    (86.94, "slam", 0.08), (86.95, "boom", 0.06),
    # —— 平面窗 / 外凸窗（甩镜）——
    (87.2, "swipe", 0.11), (90.5, "wrong", 0.07),
    # —— 冬天阳光照不进客厅 ——
    (92.2, "tape_snap", 0.08), (95.2, "stamp_2", 0.11),
    # —— 结尾卡片：从圆环展开 → 评论区聊聊 → 箭头 ——
    (95.85, "whoosh", 0.12), (97.25, "chime_end", 0.08),
]

# 同类动作的变体轮换（按出现顺序依次取，循环使用）
FAMILY = {
    "whoosh": ["whoosh_1", "whoosh_2", "whoosh_3", "whoosh_4", "whoosh_5"],
    "pop": ["pop_3", "pop_1", "pop_5", "pop_2", "pop_6", "pop_4"],
    "swipe": ["swipe_1", "swipe_2"],
    "punch": ["punch_1", "punch_2"],
}
KEEP = ("whoosh", "swipe", "stamp", "slam", "boom", "flash")  # 结构性音效：不参与合并
MAX_USE = 3
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
    conv = list(TEASER)
    for t, n, v in C:
        tn = to_new(t)
        if tn is None:
            print(f"  落在删掉的句子里，丢掉：{(t, n)}")
            continue
        conv.append((round(tn, 3), n, v))
    cues = vary(sorted(conv))
    names = [n for _, n, _ in cues]
    bad = [(cues[i][0], n) for i, n in enumerate(names[1:], 1) if n == names[i - 1]]
    assert not bad, f"同一音效连续出现：{bad}"
    cnt = Counter(names)
    over = [(n, k) for n, k in cnt.items() if k > MAX_USE]
    assert not over, f"同一音效出现超过 {MAX_USE} 次：{over}"
    ts = [t for t, _, _ in cues]
    dense = max(sum(1 for x in ts if a0 <= x < a0 + 10) for a0 in [i * 0.5 for i in range(int(max(ts) * 2) + 1)])
    assert dense <= 7, f"有 10 秒窗口里 {dense} 下音效，超过 7 下"
    print(f"{len(cues)} 条音效，{len(cnt)} 种；最多：{cnt.most_common(6)}")
    json.dump([[t, n, round(v * GAIN, 3)] for t, n, v in cues], open(sys.argv[1], "w"), indent=0)


if __name__ == "__main__":
    main()
