# -*- coding: utf-8 -*-
"""把原素材转成 Remotion 用的代理：竖版 1080×1920（预览）或 2160×3840（出 4K）。
python make_proxies.py <清单.json> <工程 public 目录> [--4k] [--fps 30]

清单.json：[{"src": "D:/…/在小区里拍的口播.mov", "name": "a_yard", "ss": 0.7, "to": 37.35, "speed": 1.25}, {"src": "…/沙盘.jpg", "name": "sp1"}]
- name 用英文（Remotion 的 staticFile 不认中文名）；ss/to/speed 可省，省了就是整段原速。
- 提速只动画面（setpts），声音由 audio_mix.py 从原素材另取。
- 1080 放 public/clips，4K 放 public/clips4k；照片直接转存 jpg。-g 30 让跳着取帧也快。
- 手机横着存的竖拍（带旋转标记）ffmpeg 会自动转正；真正的横拍素材会被居中裁成竖版。
"""
import argparse
import json
import os
import subprocess

ap = argparse.ArgumentParser()
ap.add_argument("manifest")
ap.add_argument("public")
ap.add_argument("--4k", dest="k4", action="store_true")
ap.add_argument("--fps", type=int, default=None)
a = ap.parse_args()
W, H = (2160, 3840) if a.k4 else (1080, 1920)
out = os.path.join(a.public, "clips4k" if a.k4 else "clips")
os.makedirs(out, exist_ok=True)
enc = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True, errors="ignore").stdout
venc = ["-c:v", "h264_nvenc", "-cq", "17" if a.k4 else "19", "-preset", "p5"] if "h264_nvenc" in enc else ["-c:v", "libx264", "-crf", "16" if a.k4 else "18", "-preset", "fast"]
for it in json.load(open(a.manifest, encoding="utf-8")):
    src, name = it["src"], it["name"]
    if src.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-q:v", "2", os.path.join(out, name + ".jpg")], check=True)
        print(name + ".jpg")
        continue
    sp = it.get("speed", 1)
    fps = a.fps or it.get("fps") or (60 if a.k4 and it.get("fps60") else 30)
    vf = (f"setpts=(PTS-STARTPTS)/{sp}," if sp != 1 else "") + f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},fps={fps}"
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if "ss" in it:
        cmd += ["-ss", str(it["ss"]), "-to", str(it["to"])]
    cmd += ["-i", src, "-an", "-vf", vf, *venc, "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", os.path.join(out, name + ".mp4")]
    subprocess.run(cmd, check=True)
    print(name + ".mp4", f"{W}x{H}", fps, "fps")
