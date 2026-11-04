# -*- coding: utf-8 -*-
"""音效电平自检：单独混一版“只有音效”的音轨，逐条算每个音效 0.6s 窗口峰值比人声峰值（99.9 分位）低多少 dB。
目标：中位数 10–13 dB，最小 ≥ 6 dB；不达标就在 cues.py 里调低对应音效再跑。

python sfx_headroom.py --voice 工作素材/voice.wav --sfx-dir motion/public/sfx --cues motion/src/sfx.json --duration 164.57
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def rd(p):
    w = wave.open(p)
    ch, sr = w.getnchannels(), w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float).reshape(-1, ch).mean(1) / 32768
    return x, sr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True)
    ap.add_argument("--sfx-dir", required=True)
    ap.add_argument("--cues", required=True)
    ap.add_argument("--duration", type=float, required=True)
    a = ap.parse_args()
    tmp = tempfile.mkdtemp()
    silent, only = os.path.join(tmp, "silent.wav"), os.path.join(tmp, "sfx_only.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.voice, "-af", "volume=0", silent], check=True)
    subprocess.run([sys.executable, os.path.join(HERE, "mix_audio.py"), "--voice", silent, "--sfx-dir", a.sfx_dir,
                    "--cues", a.cues, "--duration", str(a.duration), "--out", only], check=True, capture_output=True)
    v, _ = rd(a.voice)
    s, sr = rd(only)
    vp = np.percentile(np.abs(v), 99.9)
    res = []
    for t, n, _g in json.load(open(a.cues)):
        seg = s[int(t * sr): int(t * sr) + int(0.6 * sr)]
        res.append((20 * np.log10(vp / (np.max(np.abs(seg)) + 1e-9)), t, n))
    res.sort()
    print(f"{len(res)} 条音效；比人声峰值低：中位数 {np.median([r[0] for r in res]):.1f} dB，最小 {res[0][0]:.1f} dB")
    print("最响的几条：", [(round(d, 1), t, n) for d, t, n in res[:6]])


if __name__ == "__main__":
    main()
