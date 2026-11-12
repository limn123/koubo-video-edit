# -*- coding: utf-8 -*-
"""字幕关键词变色（不改时间轴、不改断句）：数字和关键结论在主文字层换成红色，投影层不动。
在 restyle_subs.py 之后运行。关键词文件一行一个（写成字幕里的实际写法，如“97个”“整整50个”“心慌”）。

python highlight_subs.py 字幕.ass 字幕.ass --keywords 工作素材/keywords.txt
"""
import argparse
import re

BASE = r"\1c&H333D18&"  # 墨绿主色（与 restyle_subs.py 一致）
HL = r"\1c&H3B48D9&"  # 红色 #D9483B（ASS 为 BGR）


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--keywords", required=True)
    a = ap.parse_args()
    kws = [k.strip() for k in open(a.keywords, encoding="utf-8").read().splitlines() if k.strip()]
    pat = re.compile("|".join(re.escape(k) for k in sorted(set(kws), key=len, reverse=True)))
    out, n = [], 0
    for line in open(a.src, encoding="utf-8-sig").read().splitlines():
        m = re.match(r"(Dialogue: 1,[^,]+,[^,]+,.*?\{.*?\})(.*)$", line)
        if m:
            head, text = m.groups()
            new = pat.sub(lambda k: "{" + HL + "}" + k.group(0) + "{" + BASE + "}", text)
            n += new != text
            line = head + new
        out.append(line)
    open(a.dst, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"关键词 {len(kws)} 个，变色字幕 {n} 条")


if __name__ == "__main__":
    main()
