# -*- coding: utf-8 -*-
"""按画面切换字幕样式（不改时间轴）：
- 全片统一墨绿字 + 白描边 + 暖色柔和投影（B-roll 是米白纸面，白字会发虚）；
- 圆环段（B-roll）：字幕底边下移到 y=2780（设计坐标 1390，原 2560 太靠上；底部安全区按宽松版放到 1600）；
- 人物全屏段：字幕下移到锁骨位置（ASS 画布底边 y=2940，抖音安全区下沿 y=2960 以内）。
  全屏有推近（PUNCH），下巴会往下走到设计坐标 y≈1300，2830 会贴着下巴，所以默认 2940；改完用 fullscreen_sub_check.py 抽查。
人物圆环/全屏的时间段直接从 motion/src/project.ts 的 MODES 读取，不用手抄。

python restyle_subs.py 字幕.ass 字幕.ass --project <motion>/src/project.ts [--broll-y 2780] [--full-y 2940]
"""
import argparse
import re


def ts(s):
    h, m, sec = s.split(":")
    return int(h) * 3600 + int(m) * 60 + float(sec)


def pip_intervals(project_ts):
    src = open(project_ts, encoding="utf-8").read()
    body = src[src.index("export const MODES"):]
    body = body[: body.index("];")]
    modes = [(float(t), m) for t, m in re.findall(r"t:\s*([\d.]+),\s*mode:\s*\"(full|pip)\"", body)]
    out, start = [], None
    for t, m in modes:
        if m == "pip" and start is None:
            start = t
        elif m == "full" and start is not None:
            out.append((start, t))
            start = None
    if start is not None:
        out.append((start, 1e9))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--project", required=True)
    ap.add_argument("--full-y", type=int, default=2940)
    ap.add_argument("--broll-y", type=int, default=2780)
    a = ap.parse_args()
    PIP = pip_intervals(a.project)
    on_broll = lambda s, e: any(x + 0.3 <= (s + e) / 2 <= y + 0.3 for x, y in PIP)
    out, n = [], 0
    for line in open(a.src, encoding="utf-8-sig").read().splitlines():
        m = re.match(r"Dialogue: (\d),([^,]+),([^,]+),(.*?)\{(.*?)\}(.*)$", line)
        if m:
            layer, s, e, mid, tags, text = m.groups()
            broll = on_broll(ts(s), ts(e))
            if broll:
                tags = re.sub(r"\\pos\(1080,2560\)", rf"\\pos(1080,{a.broll_y})", tags)
                tags = re.sub(r"\\pos\(1084\.5,2566\)", rf"\\pos(1084.5,{a.broll_y + 6})", tags)
            else:
                # 全屏段：下移到下巴以下
                tags = re.sub(r"\\pos\(1080,2560\)", rf"\\pos(1080,{a.full_y})", tags)
                tags = re.sub(r"\\pos\(1084\.5,2566\)", rf"\\pos(1084.5,{a.full_y + 6})", tags)
            if layer == "0":
                # 投影层：暖棕色、更淡更柔
                tags = re.sub(r"\\1c&H[0-9A-F]+&\\1a&H[0-9A-F]+&\\3c&H[0-9A-F]+&\\3a&H[0-9A-F]+&",
                              r"\\1c&H24384A&\\1a&HD0&\\3c&H24384A&\\3a&HD8&" if broll else r"\\1c&H24384A&\\1a&HC0&\\3c&H24384A&\\3a&HC8&", tags)
                tags = tags.replace("\\blur6", "\\blur10")
            else:
                tags += "\\1c&H333D18&\\3c&HFFFFFF&" + ("\\bord5.5" if broll else "\\bord6")
                n += broll
            line = f"Dialogue: {layer},{s},{e},{mid}{{{tags}}}{text}"
        out.append(line)
    open(a.dst, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"圆环段 {len(PIP)} 段；B-roll 段字幕 {n} 条（y={a.broll_y}），其余为全屏段（y={a.full_y}）")


if __name__ == "__main__":
    main()
