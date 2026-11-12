# -*- coding: utf-8 -*-
"""本条片子的时间线 → src/data/main.json。  python scripts/build_main.py
出 4K60：VLOG_FPS=60 VLOG_CLIPDIR=clips4k python scripts/build_main.py

这是一张白纸：先写好分镜（剪辑成果/工作素材/分镜.md），再照分镜把这里填满。
结构、开头、分几段、用哪些包装，都从这条的文案和素材里来——不要照搬以前哪条片子的段落和文字。
下面注释里的写法只是演示每个函数怎么用。
"""
from tl_lib import Timeline

tl = Timeline(
    colors={},        # 这条的配色，按内容定，例：{"a": "#C8412F", "b": "#2F7A5B"}；不写用默认
    sub_y=1470,       # 字幕底边；近景大脸时往下放（≤1600），别贴下巴
)
tl.face_clips = []    # 哪些代理是"人对着镜头说"的，例：["talk_yard.mp4"]，用来检查纯人脸段是不是太长

# ---------- 主线：按保留段一段段接（时间 = 原素材秒数） ----------
# SRC = "在小区里拍的口播.mov"
# tl.play("talk_yard.mp4", 11.60, 15.50, rate=1.25, source=SRC, lines=[
#     (11.73, 13.15, "字幕一句", ["关键词"]),
# ])
# tl.play("env1.mp4", 3.3, 4.8)                      # 空镜做换场（不取声音；要现场声用 tl.ambient）
# at = lambda s: tl.at(SRC, s)                       # 原素材第几秒 → 成片第几秒

# ---------- 盖在主线上的实拍、包装、音效 ----------
# tl.insert("video", at(20.0), at(23.5), src="env2.mp4", **{"from": 4.0})
# tl.overlay("chip", at(17.3), at(19.5), text="一句话标签", y=210)
# tl.cue(at(17.3), "pop")

# tl.hold(1.0)
tl.save()
