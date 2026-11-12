# -*- coding: utf-8 -*-
"""查结巴和重说：把拼好的人声（audio_mix.py 输出的 *_人声16k.wav）原样转写一遍，标出可疑处。
python verbatim_check.py <人声16k.wav> [--terms "小区名 …"]

whisper 整段转写会把重说合并、把卡顿抹平，所以要单独对"剪完的人声"再转一遍，并提示它保留重复和口误。
标记：≈上句 = 跟上一句开头相同（多半是重说，留后一遍）；长音 = 单字超过 0.55s（拖音或句中卡顿，去看能量表）。
"""
import argparse
import sys

import whisper

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("wav")
ap.add_argument("--terms", default="")
a = ap.parse_args()
m = whisper.load_model("large-v3-turbo")
r = m.transcribe(a.wav, language="zh", word_timestamps=True, condition_on_previous_text=False, temperature=0.0,
                 initial_prompt="以下是普通话口语，原样转写，包括重复、口误、语气词。" + a.terms)
prev = ""
flags = 0
for s in r["segments"]:
    txt = s["text"].strip()
    core = txt.lstrip("所以那就呢啊嗯，, ")
    marks = []
    if prev and len(core) >= 3 and (core[:3] in prev or prev[-4:] in txt):
        marks.append("≈上句")
    long = [f"{w['word'].strip()}({w['end'] - w['start']:.2f}s)" for w in s.get("words", []) if w["end"] - w["start"] > 0.55]
    if long:
        marks.append("长音 " + " ".join(long))
    flags += bool(marks)
    print(f"[{s['start']:6.1f}] {txt}" + ("   ← " + "；".join(marks) if marks else ""))
    prev = txt
print(f"\n可疑 {flags} 处：逐条听一下，是重说/卡顿就回去改保留段，是正常语气拉长就留着。")
