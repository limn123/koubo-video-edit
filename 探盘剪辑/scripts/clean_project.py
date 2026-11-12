# -*- coding: utf-8 -*-
"""定稿后清理一条片子的中间文件（旧版本的无声渲染、试听混音、抽帧图、打包缓存、4K 代理）。
python clean_project.py <.code 下的项目目录>            # 只列清单和大小，不删
python clean_project.py <项目目录> --delete             # 用户看过清单、同意后才加这个

保留：motion/ 里的源码、脚本、时间线和 1080 代理（以后还能重渲染）。删掉的都能重新生成，只是要花时间。
"""
import os
import shutil
import sys

root = sys.argv[1]
delete = "--delete" in sys.argv
KEEP_EXT = {".py", ".md", ".json", ".tsx", ".ts", ".txt"}
items = []
for name in sorted(os.listdir(root)):
    p = os.path.join(root, name)
    if name == "motion":
        for sub in ("public/clips4k",):
            q = os.path.join(p, sub)
            if os.path.isdir(q) and not os.path.islink(q):
                items.append(q)
        continue
    if os.path.isdir(p) and not os.path.islink(p):
        items.append(p)                         # bundle、stills、sheets、preview……
    elif os.path.splitext(name)[1].lower() not in KEEP_EXT:
        items.append(p)                         # mp4 / wav / jpg / log


def size(p):
    if os.path.isfile(p):
        return os.path.getsize(p)
    return sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(p) for f in fs)


total = 0
for p in items:
    s = size(p)
    total += s
    print(f"{s / 1e6:9.1f} MB  {os.path.relpath(p, root)}")
print(f"合计 {total / 1e9:.2f} GB，{'已删除' if delete else '以上是可以删的（没有删）'}")
if delete:
    for p in items:
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
