# -*- coding: utf-8 -*-
"""粗剪 + 整体调速 + 缩到 1440 宽（一步完成，替代 rough_cut.py 的竖版 4K 流程）：
按 edl.json 的 keep 片段裁切拼接（每段两端 12ms 淡入淡出防爆音），画面 setpts、声音 atempo 同倍率提速（音调不变），
缩放到 1440×2560（竖版）或 2560×1440（横版）给 Remotion 用，BT.709 标准范围，高码率中间文件。
edl.json 里写 "speed": 1.1（不写则 1.0）。

python rough_speed.py 原片.mov 工作素材/edl.json 工作素材/rough.mp4 [--width 1440] [--fps 30]
"""
import argparse
import json
import subprocess


def has_nvenc():
    r = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True)
    return "h264_nvenc" in r.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("edl")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--fps", default="30")
    a = ap.parse_args()
    edl = json.load(open(a.edl, encoding="utf-8"))
    keep = edl["keep"]
    speed = float(edl.get("speed", 1.0))
    parts, labels = [], []
    for i, k in enumerate(keep):
        s, e = k["s"], k["e"]
        parts.append(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}]")
        parts.append(f"[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,areverse,afade=t=in:d=0.012,areverse[a{i}]")
        labels.append(f"[v{i}][a{i}]")
    parts.append(f"{''.join(labels)}concat=n={len(keep)}:v=1:a=1[vc][ac]")
    parts.append(f"[vc]setpts=PTS/{speed},fps={a.fps},scale={a.width}:-2:flags=lanczos,format=yuv420p[v]")
    parts.append(f"[ac]atempo={speed}[a]" if speed != 1.0 else "[ac]anull[a]")
    enc = ["-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "15", "-b:v", "45M", "-maxrate", "80M"] if has_nvenc() else ["-c:v", "libx264", "-preset", "slow", "-crf", "12"]
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.source, "-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]", *enc,
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", a.out]
    subprocess.run(cmd, check=True)
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,nb_frames,duration", "-of", "compact", a.out], capture_output=True, text=True)
    print(f"speed={speed}  片段={len(keep)}\n{r.stdout.strip()}")


if __name__ == "__main__":
    main()
