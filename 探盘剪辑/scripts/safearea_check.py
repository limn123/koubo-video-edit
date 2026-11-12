# -*- coding: utf-8 -*-
"""抖音安全区叠图检查：按固定间隔抽帧，把抖音手机端的界面遮挡区画成半透明遮罩叠上去，拼成带时间标签的联系表。
看图标准（用户 2026-11-04 定的“宽松版”，不用太严格）：
  - 绿框 = 宽松安全区 x 33–975、y 112–1600，主信息放在框里；卡片边、印章角伸进红区一点点没关系；
  - 不能盖住的是：右侧按钮图标本身（白圈）、底部作者名 / 文案条（白框）里的文字，以及顶栏。

遮挡区（1080×1920 设计坐标，按 references/抖音安全区参考.png 实测）：
  顶栏 y<112；右侧按钮列 x≥935 且 y 815–1785（头像/点赞/评论/收藏/分享/唱片）；底部信息区 y≥1480（作者名/文案/导航）；左边距 x<33
严格安全区 = x 33–935，y 112–1480（只作参考）；宽松安全区 = x 33–975，y 112–1600（按这个排）。

python safearea_check.py 草稿或成片.mp4 输出目录 [--step 1.0] [--start 0] [--end 999] [--cols 6] [--rows 3]
"""
import argparse
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
TOP, LEFT, RIGHT_X, RIGHT_Y0, RIGHT_Y1, BOTTOM = 112, 33, 935, 815, 1785, 1480
SAFE_X1, SAFE_Y1 = 975, 1600  # 宽松安全区（用户认可：压一点点没关系）
TW = 300  # 每格宽度（像素）


def overlay(im):
    """在缩略图上画遮挡区：半透明红 + 按钮列里画出图标位置（圆点），安全区画绿色细框"""
    k = im.width / W
    base = im.convert("RGBA")
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    red = (230, 40, 40, 55)
    d.rectangle([0, 0, im.width, TOP * k], fill=red)
    d.rectangle([0, BOTTOM * k, im.width, im.height], fill=red)
    d.rectangle([RIGHT_X * k, RIGHT_Y0 * k, im.width, RIGHT_Y1 * k], fill=red)
    d.rectangle([0, TOP * k, LEFT * k, BOTTOM * k], fill=(230, 40, 40, 30))
    # 按钮列的图标位置（头像、点赞、评论、收藏、分享、唱片）
    cx = 1010 * k
    for y in (875, 1060, 1215, 1370, 1540, 1720):
        r = 48 * k
        d.ellipse([cx - r, y * k - r, cx + r, y * k + r], outline=(255, 255, 255, 200), width=2)
    # 底部作者名 / 文案条
    d.rectangle([LEFT * k, 1607 * k, 397 * k, 1653 * k], outline=(255, 255, 255, 200), width=2)
    d.rectangle([LEFT * k, 1674 * k, 840 * k, 1792 * k], outline=(255, 255, 255, 200), width=2)
    # 宽松安全区边框（绿）
    d.rectangle([LEFT * k, TOP * k, SAFE_X1 * k, SAFE_Y1 * k], outline=(40, 200, 90, 230), width=2)
    return Image.alpha_composite(base, lay).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--step", type=float, default=1.0)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=999)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--rows", type=int, default=3)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    tmp = tempfile.mkdtemp()
    th = int(TW * H / W)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a.start), "-to", str(a.end), "-i", a.video,
                    "-vf", f"fps=1/{a.step},scale={TW}:{th}", os.path.join(tmp, "f_%05d.png")], check=True)
    fs = sorted(os.listdir(tmp))
    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 18)
    per = a.cols * a.rows
    outs = []
    for k in range(0, len(fs), per):
        chunk = fs[k:k + per]
        sheet = Image.new("RGB", (a.cols * TW, a.rows * (th + 24)), "white")
        d = ImageDraw.Draw(sheet)
        for i, f in enumerate(chunk):
            t = a.start + (k + i) * a.step
            x, y = (i % a.cols) * TW, (i // a.cols) * (th + 24)
            sheet.paste(overlay(Image.open(os.path.join(tmp, f))), (x, y + 24))
            d.text((x + 4, y + 1), f"{t:.1f}s", fill="black", font=font)
        p = os.path.join(a.out, f"safe_{k // per + 1:02d}.jpg")
        sheet.save(p, quality=85)
        outs.append(p)
    print(f"{len(fs)} 帧，{len(outs)} 张联系表 -> {a.out}\n绿框 = 宽松安全区 x 33–975 / y 112–1600，主信息放框里；红区压一点没关系，但别盖住白圈按钮和底部作者名/文案条")


if __name__ == "__main__":
    main()
