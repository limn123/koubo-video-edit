# -*- coding: utf-8 -*-
"""成片声音：人声（多段拼接、各段响度对齐）+ 现场声 + 真实音效（+ 可选配乐）→ -16 LUFS。

python scripts/audio_mix.py <原素材目录> <输出目录> [--tl src/data/main.json] [--music] [--denoise] [--name 成片]

输出（都在 <输出目录>）：
  <name>_混音.wav            成片用的声音（默认不带配乐：用户习惯自己在剪映里加）
  <name>_分轨_人声和现场声.wav / <name>_分轨_音效.wav   同一增益，叠起来 = 混音
  <name>_人声16k.wav         只有人声，给 verbatim_check.py 查结巴重复用
  <name>_字幕.srt            跟画面里烧的字幕一致
  <name>_无人声时段.txt      超过 1.5 秒没人说话的地方（用户自己加配乐时要抬音量）

户外边走边说常有风声、车声：脚本会打印各段人声的底噪，差得多或者整体偏高（> -45 dB）就加 --denoise（用 skill 的 scripts/denoise.py，只压稳态底噪，不把环境声抠成真空）。

时间线里读：
  voice: [{file, ss, to, tempo, t}]     file 相对原素材目录；tempo = 提速倍率
  amb:   [{file, ss, to, t, gain}]      现场声（换场空镜原声、车流声），gain 是相对人声峰值的 dB
  sfx:   [{t, name}]                    name 在 public/sfx_real/sfx_map.json 里
  music_tracks / music_level            只有加 --music 才用：[{file, t0, t1, from, xf}]，文件放 public/music/
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "public")
SR = 48000


def db(v):
    return 10 ** (v / 20)


def load(src, ss=None, to=None, tempo=1.0):
    cmd = ["ffmpeg", "-v", "error"]
    if ss is not None:
        cmd += ["-ss", str(ss), "-to", str(to)]
    cmd += ["-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-af", f"atempo={tempo}" if tempo != 1 else "anull", "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def place(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    m = min(len(x), len(buf) - i)
    buf[i:i + m] += g * x[:m]


def speech_rms(x):
    """只算说话部分的响度（最响的 40% 的 20ms 帧），用来对齐不同场景录的人声。"""
    fr = x[: len(x) // 960 * 960].reshape(-1, 960)
    r = np.sqrt((fr ** 2).mean(1))
    return np.sqrt((r[r > np.percentile(r, 60)] ** 2).mean())


def fade(x, a, b):
    a, b = int(a * SR), int(b * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def noise_floor(x):
    """底噪：最安静 5% 的 50ms 帧的电平（dB）。"""
    fr = x[: len(x) // 2400 * 2400].reshape(-1, 2400)
    r = np.sqrt((fr ** 2).mean(1)) + 1e-9
    return 20 * np.log10(np.percentile(r, 5))


def denoise_file(src, denoiser):
    """整条原素材先降噪成临时 wav（按文件缓存），再从里面取片段。"""
    out = os.path.join(os.environ.get("TEMP", "."), "tanpan_dn_" + str(abs(hash(src))) + ".wav")
    if not os.path.exists(out):
        raw = out + ".in.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), raw], check=True)
        subprocess.run([sys.executable, denoiser, raw, out, "--over", "2.0", "--floor", "-20"], check=True, capture_output=True)
        os.remove(raw)
    return out


def build_voice(tl, root, n, denoiser=None):
    v = np.zeros(n)
    ref = None
    floors = {}
    for s in tl["voice"]:
        src = os.path.join(root, s["file"])
        if denoiser:
            src = denoise_file(src, denoiser)
        x = load(src, s["ss"], s["to"], s.get("tempo", 1))
        floors.setdefault(s["file"], []).append(noise_floor(x) - 20 * np.log10(speech_rms(x) + 1e-9))
        r = speech_rms(x)
        ref = ref or r
        place(v, fade(x * ref / r, 0.025, 0.025), s["t"])
    for f, fl in floors.items():
        m = float(np.median(fl))
        print(f"  底噪比人声低 {-m:.0f} dB：{f}" + ("   ← 偏吵，考虑 --denoise" if m > -28 and not denoiser else ""))
    return v


def build_amb(tl, root, n, vmax):
    a = np.zeros(n)
    for s in tl.get("amb", []):
        x = fade(load(os.path.join(root, s["file"]), s["ss"], s["to"]), 0.08, 0.08)
        place(a, x / (np.abs(x).max() + 1e-9) * vmax * db(s.get("gain", -6)), s["t"])
    return a * 0.55


def build_sfx(tl, n, vpk):
    """sfx_map.json：name → {file, max 最长秒, align on|peak, gain 相对人声峰值 dB}。
    on：去掉开头空白，从动作帧开始响；peak：最响那一下落在动作帧（嗖、重击）。"""
    d = os.path.join(PUB, "sfx_real")
    smap = json.load(open(os.path.join(d, "sfx_map.json"), encoding="utf-8"))
    out = np.zeros(n)
    cache = {}
    for c in tl.get("sfx", []):
        nm = c["name"]
        if nm not in smap:
            raise SystemExit(f"音效 {nm} 不在 sfx_map.json 里")
        if nm not in cache:
            m = smap[nm]
            x = load(os.path.join(d, m["file"]))
            a = np.abs(x)
            on = int(np.argmax(a > a.max() * db(-36)))
            x = x[max(0, on - int(0.005 * SR)):][: int(m["max"] * SR)].copy()
            pk = int(np.argmax(np.abs(x))) if m.get("align") == "peak" else 0
            fade(x, 0, min(len(x) / SR, 0.12))
            cache[nm] = (x / (np.abs(x).max() + 1e-9), pk / SR, m["gain"])
        x, pk, g = cache[nm]
        place(out, x, max(0, c["t"] - pk), vpk * db(g))
    return out


def build_music(tl, n, voice):
    """真实歌曲：段间交叉淡化以接缝为中心（节拍不偏）；按平均响度对齐人声，说话处自动压低。"""
    tracks = tl["music_tracks"]
    m = np.zeros(n)
    for i, tr in enumerate(tracks):
        xi = tr.get("xf", 0.25) if i else 0.0
        xo = tracks[i + 1].get("xf", 0.25) if i + 1 < len(tracks) else 0.0
        st = tr["from"] - xi / 2
        x = load(os.path.join(PUB, "music", tr["file"]), st, st + tr["t1"] - tr["t0"] + xi / 2 + xo / 2)
        fi, fo = int(max(xi, 0.02) * SR), int((1.2 if i == len(tracks) - 1 else max(xo, 0.02)) * SR)
        x[:fi] *= np.sqrt(np.linspace(0, 1, fi))
        x[-fo:] *= np.sqrt(np.linspace(1, 0, fo))
        place(m, x, max(0, tr["t0"] - xi / 2))
    e = np.sqrt(np.convolve(voice ** 2, np.ones(480) / 480, mode="same"))
    talk = (e > db(-40) * np.abs(voice).max()).astype(float)
    k = int(0.25 * SR)
    talk = np.convolve(talk, np.ones(k) / k, mode="same").clip(0, 1)
    lv = tl.get("music_level", {"free": -8, "talk": -22})
    nz = m[np.abs(m) > 1e-5]
    return m / (np.sqrt((nz ** 2).mean()) + 1e-9) * speech_rms(voice) * (db(lv["free"]) * (1 - talk) + db(lv["talk"]) * talk)


def write(path, y, sr=SR, ch=2):
    y = np.clip(y, -1, 1)
    data = np.stack([y] * ch, 1) if ch > 1 else y
    with wave.open(path, "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((data * 32767).astype(np.int16).tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("out")
    ap.add_argument("--tl", default=os.path.join(HERE, "..", "src", "data", "main.json"))
    ap.add_argument("--music", action="store_true")
    ap.add_argument("--denoise", action="store_true")
    ap.add_argument("--name", default="成片")
    a = ap.parse_args()
    tl = json.load(open(a.tl, encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    end = int(tl["total"] * SR)
    n = end + SR // 2
    dn = None
    if a.denoise:
        dn = next((c for c in [os.path.join(HERE, "denoise.py"), os.path.join(HERE, "..", "..", "scripts", "denoise.py"),
                                os.path.expanduser("~/.claude/skills/探盘剪辑/scripts/denoise.py"), os.path.expanduser("~/.claude/skills/探盘剪辑/scripts/denoise.py")] if os.path.exists(c)), None)
        if not dn:
            raise SystemExit("找不到 denoise.py：把 skill 的 scripts/denoise.py 复制到工程的 scripts/ 里")
    voice = build_voice(tl, a.root, n, dn)
    vpk = np.percentile(np.abs(voice[np.abs(voice) > 1e-4]), 99.5)
    vtrack = (voice + build_amb(tl, a.root, n, np.abs(voice).max()))[:end]
    sfx = build_sfx(tl, n, vpk)[:end]
    mix = vtrack + sfx
    music = None
    if a.music and tl.get("music_tracks"):
        music = build_music(tl, n, voice)[:end]
        mix = mix + music

    # 量响度，算一个固定增益到 -16 LUFS；所有轨用同一个增益，真峰不过约 -1 dBFS
    probe = os.path.join(a.out, "_probe.wav")
    write(probe, mix / (np.abs(mix).max() + 1e-9) * 0.5)
    r = subprocess.run(["ffmpeg", "-i", probe, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
    os.remove(probe)
    lufs = float([l for l in r.splitlines() if l.strip().startswith("I:")][-1].split()[1])
    gain = 0.5 / (np.abs(mix).max() + 1e-9) * db(-16 - lufs)
    gain *= min(1.0, 0.89 / (np.abs(mix * gain).max() + 1e-9))
    p = lambda s: os.path.join(a.out, f"{a.name}_{s}.wav")
    write(p("混音"), mix * gain)
    write(p("分轨_人声和现场声"), vtrack * gain)
    write(p("分轨_音效"), sfx * gain)
    if music is not None:
        write(p("分轨_配乐"), music * gain)
    v16 = voice[:end] / (np.abs(voice).max() + 1e-9) * 0.9
    tmp = p("人声48k")
    write(tmp, v16, ch=1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-ar", "16000", p("人声16k")], check=True)
    os.remove(tmp)

    def ts(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    subs = sorted(tl.get("subs", []), key=lambda u: u["t0"])
    NL = chr(10)
    with open(os.path.join(a.out, f"{a.name}_字幕.srt"), "w", encoding="utf-8") as fh:
        fh.write(NL.join(f"{i}{NL}{ts(u['t0'])} --> {ts(u['t1'])}{NL}{u['text']}{NL}" for i, u in enumerate(subs, 1)))
    gaps, prev = [], 0.0
    for u in subs + [{"t0": tl["total"], "t1": tl["total"]}]:
        if u["t0"] - prev > 1.5:
            gaps.append(f"{int(prev // 60)}:{prev % 60:04.1f} – {int(u['t0'] // 60)}:{u['t0'] % 60:04.1f}（{u['t0'] - prev:.0f} 秒）")
        prev = max(prev, u["t1"])
    with open(os.path.join(a.out, f"{a.name}_无人声时段.txt"), "w", encoding="utf-8") as fh:
        fh.write("没人说话超过 1.5 秒的时段（加配乐时这里要把音乐抬起来）：" + NL + NL.join(gaps) + NL)

    xs = [c["t"] for c in tl.get("sfx", [])]
    dens = max((sum(1 for y in xs if s <= y < s + 10) for s in np.arange(0, tl["total"], 0.5)), default=0)
    names = [c["name"] for c in tl.get("sfx", [])]
    over = sorted({k for k in names if names.count(k) > 3})
    print(f"ok {tl['total']:.1f}s  音效 {len(xs)} 处，任意 10 秒最多 {dens} 下（应 ≤7）", f"；用超过 3 次的：{over}" if over else "", f"；配乐：{'有' if music is not None else '无'}")


if __name__ == "__main__":
    main()
