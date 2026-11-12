# -*- coding: utf-8 -*-
"""按 sfx_map.json 把真实音效下载到同一个文件夹（已有的跳过）。
python fetch_sfx.py <sfx_real 目录>          # 目录里要有 sfx_map.json

音效来自 Mixkit（mixkit.co），按 Mixkit 免费音效许可可以免费用在自己的视频里（含商用），
但不能把音效文件本身再分发，所以公开仓库里不带 mp3，只带这份清单，用的人自己下载。
"""
import json
import os
import sys
import urllib.request

d = sys.argv[1]
smap = json.load(open(os.path.join(d, "sfx_map.json"), encoding="utf-8"))
todo = {m["file"]: m["source"] for m in smap.values() if not os.path.exists(os.path.join(d, m["file"]))}
print(f"共 {len(set(m['file'] for m in smap.values()))} 个音效，需要下载 {len(todo)} 个")
for f, url in todo.items():
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(os.path.join(d, f), "wb") as o:
        o.write(r.read())
    print("  ", f)
print("好了")
