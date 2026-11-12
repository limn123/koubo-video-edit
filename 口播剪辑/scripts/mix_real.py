# -*- coding: utf-8 -*-
"""口播混音：人声（normalize_voice 的 voice.wav）+ 真实录制的音效（Mixkit）→ -16 LUFS。默认不加背景音乐（用户自己在剪映里加）。

python mix_real.py --voice voice.wav --cues cues.json --out mix.wav [--sfx-dir <skill>/assets/sfx_real] [--music 歌.mp3 --music-from 9.0]

cues.json：[[成片秒, "音效名"], …]，音效名见 sfx_real/sfx_map.json（每个都写了用途、对齐方式、相对人声的音量）。
  on   = 去掉开头空白，从动作那一帧开始响
  peak = 最响那一下落在动作帧（嗖、重击）
脚本会检查：任意 10 秒 ≤7 下、同一个声音 ≤3 次、0.25 秒内不重叠。
"""
import argparse
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))


def db(v):
    return 10 ** (v / 20)


def load(src, ss=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(ss)] if ss else []) + (["-t", str(dur)] if dur else [])
    raw = subprocess.run(cmd + ["-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def place(buf, x, t, g=1.0):
    i = int(t * SR)
    if 0 <= i < len(buf):
        m = min(len(x), len(buf) - i)
        buf[i:i + m] += g * x[:m]


def speech_rms(x):
    fr = x[: len(x) // 960 * 960].reshape(-1, 960)
    r = np.sqrt((fr ** 2).mean(1))
    return np.sqrt((r[r > np.percentile(r, 60)] ** 2).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True)
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sfx-dir", default=os.path.join(HERE, "..", "assets", "sfx_real"))
    ap.add_argument("--music")
    ap.add_argument("--music-from", type=float, default=0.0)
    a = ap.parse_args()

    voice = load(a.voice)
    n = len(voice)
    total = n / SR
    cues = sorted((float(c[0]), c[1]) for c in json.load(open(a.cues, encoding="utf-8")))
    smap = json.load(open(os.path.join(a.sfx_dir, "sfx_map.json"), encoding="utf-8"))

    # 检查密度和重复
    bad = []
    names = [nm for _, nm in cues]
    for nm in sorted(set(names)):
        if nm not in smap:
            raise SystemExit(f"音效 {nm} 不在 sfx_map.json 里")
        if names.count(nm) > 3:
            bad.append(f"{nm} 用了 {names.count(nm)} 次（应 ≤3）")
    ts = [t for t, _ in cues]
    dens = max((sum(1 for y in ts if s / 2 <= y < s / 2 + 10) for s in range(int(total * 2) + 1)), default=0)
    if dens > 7:
        bad.append(f"任意 10 秒最多 {dens} 下（应 ≤7）")
    bad += [f"{t1:.2f}s 和 {t2:.2f}s 挨得太近" for t1, t2 in zip(ts, ts[1:]) if t2 - t1 < 0.25]

    vpk = np.percentile(np.abs(voice[np.abs(voice) > 1e-4]), 99.5)
    mix = voice.copy()
    cache = {}
    for t, nm in cues:
        if nm not in cache:
            m = smap[nm]
            x = load(os.path.join(a.sfx_dir, m["file"]))
            env = np.abs(x)
            on = int(np.argmax(env > env.max() * db(-36)))
            x = x[max(0, on - int(0.005 * SR)):][: int(m["max"] * SR)].copy()
            pk = int(np.argmax(np.abs(x))) if m.get("align") == "peak" else 0
            fo = min(len(x), int(0.12 * SR))
            x[-fo:] *= np.linspace(1, 0, fo)
            # 口播的音效比探盘再轻 2 dB：人一直在说话，音效只是点缀
            cache[nm] = (x / (np.abs(x).max() + 1e-9), pk / SR, m["gain"] - 2)
        x, pk, g = cache[nm]
        place(mix, x, max(0, t - pk), vpk * db(g))

    if a.music:   # 只有用户明确要配乐时才用：按平均响度对齐，说话处压到比人声低 22 dB
        mu = load(a.music, a.music_from, total + 1)[:n]
        mu = np.pad(mu, (0, n - len(mu)))
        e = np.sqrt(np.convolve(voice ** 2, np.ones(480) / 480, mode="same"))
        talk = (e > db(-40) * np.abs(voice).max()).astype(float)
        k = int(0.25 * SR)
        talk = np.convolve(talk, np.ones(k) / k, mode="same").clip(0, 1)
        nz = mu[np.abs(mu) > 1e-5]
        mu = mu / (np.sqrt((nz ** 2).mean()) + 1e-9) * speech_rms(voice) * (db(-8) * (1 - talk) + db(-22) * talk)
        tail = int(1.2 * SR)
        mu[-tail:] *= np.linspace(1, 0, tail)
        mix += mu

    tmp = a.out + ".raw.wav"
    y = np.clip(mix / (np.abs(mix).max() + 1e-9) * 0.9, -1, 1)
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([y, y], 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), a.out], check=True)
    os.remove(tmp)
    print(f"ok {total:.1f}s  音效 {len(cues)} 处，任意 10 秒最多 {dens} 下；配乐：{'有' if a.music else '无（用户自己加）'}")
    for b in bad:
        print("  !", b)


if __name__ == "__main__":
    main()
