"""按 edl.json 逐段裁切（片段多且前后穿插时，一次 filter_complex 会把 4K HEVC 帧全缓存在内存里导致 OOM）。
每段按整帧数裁：视频 -frames:v n，音频 atrim 到 n/30 秒，两端 12ms 淡变；拼接后可选补尾（tpad/apad）。
python cut_segments.py <源视频> <edl.json> <out.mp4> [--width 2160] [--pad 2.0]
"""
import argparse, json, os, subprocess, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("edl"); ap.add_argument("out")
ap.add_argument("--width", type=int, default=2160); ap.add_argument("--pad", type=float, default=0.0)
a = ap.parse_args()
keep = json.load(open(a.edl, encoding="utf-8"))["keep"]
tmp = tempfile.mkdtemp(prefix="cutseg_")
FPS = 30
vlist, alist = [], []
for i, k in enumerate(keep):
    s, e = k["s"], k["e"]
    n = round((e - s) * FPS)
    d = n / FPS
    v = os.path.join(tmp, f"v{i:02d}.mp4"); w = os.path.join(tmp, f"a{i:02d}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-i", a.src, "-an",
                    "-vf", f"fps={FPS},scale={a.width}:-2:flags=lanczos,format=yuv420p", "-frames:v", str(n),
                    "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "14", "-b:v", "50M", "-maxrate", "90M",
                    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", v], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-i", a.src, "-vn",
                    "-af", f"atrim=0:{d:.6f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d - 0.012:.6f}:d=0.012",
                    "-ar", "48000", "-ac", "2", w], check=True)
    vlist.append(v); alist.append(w)
    print(f"seg {i}: {s:.2f}-{e:.2f} -> {n} frames")
lv = os.path.join(tmp, "v.txt"); la = os.path.join(tmp, "a.txt")
open(lv, "w").write("".join(f"file '{p}'\n" for p in vlist))
open(la, "w").write("".join(f"file '{p}'\n" for p in alist))
cv = os.path.join(tmp, "cv.mp4"); ca = os.path.join(tmp, "ca.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lv, "-c", "copy", cv], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", la, "-c", "copy", ca], check=True)
vf = f"tpad=stop_mode=clone:stop_duration={a.pad}" if a.pad > 0 else "null"
af = f"apad=pad_dur={a.pad}" if a.pad > 0 else "anull"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", cv, "-i", ca, "-vf", vf, "-af", af,
                "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "14", "-b:v", "50M", "-maxrate", "90M",
                "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", a.out], check=True)
r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,nb_frames,duration", "-of", "compact", a.out], capture_output=True, text=True)
print(r.stdout.strip())
