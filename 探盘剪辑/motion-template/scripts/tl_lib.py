# -*- coding: utf-8 -*-
"""时间线小工具：把"原素材里的第几秒"换算成"成片里的第几秒"，并攒出 Remotion 和 audio_mix.py 共用的 main.json。

只管机械的事（换算时间、拆长字幕、数音效密度）。片子怎么分段、插什么画面、加什么包装，
由每条片子的分镜决定，写在 build_main.py 里——这里不预设任何结构。

约定：代理素材都是"整段、原速"的（make_proxies.py 不传 ss/speed），提速由 rate 控制，
这样原素材时间 = 代理时间，剪点直接用转写/能量表里的原片秒数。
"""
import json
import os

MAXC = 11  # 字幕一行最多 11 个字（76 号字、1080 宽）


def split_line(a, b, s, maxc=MAXC):
    """长句拆两段：'|' 手动指定断点；否则优先逗号，再不行从中间断。时间按字数分。"""
    if "|" in s:
        k = s.find("|")
        p1, p2 = s[:k], s[k + 1:]
    elif len(s.replace("，", "")) <= maxc:
        return [(a, b, s)]
    else:
        k = s.find("，")
        if k < 0 or k > maxc or len(s) - k - 1 > maxc:
            k = len(s) // 2
            p1, p2 = s[:k], s[k:]
        else:
            p1, p2 = s[:k], s[k + 1:]
    m = a + (b - a) * len(p1) / (len(p1) + len(p2))
    return [(a, m, p1), (m, b, p2)]


class Timeline:
    def __init__(self, fps=None, clipdir=None, colors=None, fonts=None, sub_y=1470):
        self.fps = fps or int(os.environ.get("VLOG_FPS", "30"))            # 预览 30；出 4K60 时 VLOG_FPS=60
        self.clipdir = clipdir or os.environ.get("VLOG_CLIPDIR", "clips")  # 出 4K 时 VLOG_CLIPDIR=clips4k
        self.colors, self.fonts, self.sub_y = colors or {}, fonts, sub_y
        self.base, self.ins, self.ov, self.subs, self.sfx, self.voice, self.amb = [], [], [], [], [], [], []
        self.music_tracks = None
        self.t = 0.0
        self._segs = []   # (源文件, ss, to, 成片起点, rate)

    # ---- 主线：一段一段往后接 ----
    def play(self, clip, ss, to, rate=1.0, source=None, lines=(), sound=True):
        """接一段底层画面。clip=代理文件名；source=原素材文件名（相对素材目录），给了且 sound=True 就取它的原声。
        lines=[(原片起, 原片止, 字幕, [关键词])]。返回这段在成片里的起点。"""
        t0, dur = self.t, (to - ss) / rate
        self.base.append({"src": clip, "t0": round(t0, 3), "t1": round(t0 + dur, 3), "from": ss, "rate": rate})
        if source:
            self._segs.append((source, ss, to, t0, rate))
            if sound:
                self.voice.append({"file": source, "ss": ss, "to": to, "tempo": rate, "t": round(t0, 3)})
        for a, b, s, h in lines:
            for a2, b2, s2 in split_line(a, b, s):
                self.subs.append({"t0": round(t0 + (a2 - ss) / rate, 3), "t1": round(t0 + (b2 - ss) / rate, 3), "text": s2, "hl": h})
        self.t = t0 + dur
        return t0

    def hold(self, sec):
        """结尾（或任何地方）把上一段最后一帧定住 sec 秒，让最后的文字看清。"""
        b = self.base[-1]
        last = b["from"] + (b["t1"] - b["t0"]) * b.get("rate", 1) - 1 / 30
        self.base.append({"src": b["src"], "t0": round(self.t, 3), "t1": round(self.t + sec, 3), "from": round(last, 3), "rate": 1, "freeze": 1})
        self.t += sec

    def at(self, source, s):
        """原素材 source 的第 s 秒 → 成片时间。落在被剪掉的地方就取下一段保留段的开头。"""
        segs = sorted((x for x in self._segs if x[0] == source), key=lambda x: x[1])
        for _, ss, to, o, rate in segs:
            if s < ss:
                return round(o, 3)
            if s <= to:
                return round(o + (s - ss) / rate, 3)
        if not segs:
            raise ValueError(f"{source} 还没有 play 过")
        _, ss, to, o, rate = segs[-1]
        return round(o + (to - ss) / rate, 3)

    # ---- 盖在主线上的东西（时间都是成片时间；用 at() 换算） ----
    def insert(self, kind, t0, t1, **kw):
        """实拍插入，盖住底层画面、声音不断：video / img / split / flash / table（见 references/时间线格式.md）。"""
        self.ins.append({"kind": kind, "t0": round(t0, 3), "t1": round(t1, 3), **kw})

    def overlay(self, kind, t0, t1, **kw):
        """叠加包装：标签、章节号、大字、推近……"""
        self.ov.append({"kind": kind, "t0": round(t0, 3), "t1": round(t1, 3), **kw})

    def cue(self, t, name):
        """音效：name 在 public/sfx_real/sfx_map.json 里。"""
        self.sfx.append({"t": round(max(0, t), 3), "name": name})

    def ambient(self, source, ss, to, t, gain=-6):
        """现场声（空镜原声、车流、鸟叫），gain 是相对人声峰值的 dB。"""
        self.amb.append({"file": source, "ss": ss, "to": to, "t": round(t, 3), "gain": gain})

    def sub(self, t0, t1, text, hl=()):
        for a, b, s in split_line(t0, t1, text):
            self.subs.append({"t0": round(a, 3), "t1": round(b, 3), "text": s, "hl": list(hl)})

    # ---- 输出 ----
    def save(self, path=None):
        total = self.t
        self.subs.sort(key=lambda s: s["t0"])
        for i in range(len(self.subs) - 1):   # 句间空隙小于 0.45s 就接上，免得字幕一闪一闪
            if 0 < self.subs[i + 1]["t0"] - self.subs[i]["t1"] < 0.45:
                self.subs[i]["t1"] = self.subs[i + 1]["t0"]
        self.sfx.sort(key=lambda s: s["t"])
        tl = {"fps": self.fps, "clipdir": self.clipdir, "total": round(total, 3), "frames": int(round(total * self.fps)),
              "colors": self.colors, "sub_y": self.sub_y, "base": self.base, "ins": self.ins, "ov": self.ov,
              "subs": self.subs, "sfx": self.sfx, "voice": self.voice, "amb": self.amb}
        if self.fonts:
            tl["fonts"] = self.fonts
        if self.music_tracks:
            tl["music_tracks"] = self.music_tracks
        path = path or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "main.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(tl, f, ensure_ascii=False, indent=1)
        self.report(tl)
        return tl

    def report(self, tl):
        T = tl["total"]
        xs = [c["t"] for c in self.sfx]
        dens = max((sum(1 for y in xs if s / 2 <= y < s / 2 + 10) for s in range(int(T * 2) + 1)), default=0)
        names = [c["name"] for c in self.sfx]
        over = sorted({k for k in names if names.count(k) > 3})
        long = [s["text"] for s in self.subs if len(s["text"].replace("，", "")) > MAXC]
        # 只有人脸、没被实拍盖住的最长一段（探盘里超过 10 秒就闷了）
        faces = set(getattr(self, "face_clips", []))
        run = best = 0.0
        if faces:
            x = 0.0
            while x < T:
                on = any(b["t0"] <= x < b["t1"] and b["src"] in faces for b in self.base) and not any(i["t0"] <= x < i["t1"] for i in self.ins)
                run = run + 0.1 if on else 0.0
                best = max(best, run)
                x += 0.1
        print(f"成片 {T:.1f}s，{tl['frames']} 帧 @{self.fps}；字幕 {len(self.subs)} 条；音效 {len(xs)} 处、任意 10 秒最多 {dens} 下")
        if dens > 7:
            print("  ! 音效太密（10 秒超过 7 下）")
        if over:
            print("  ! 同一个音效用了超过 3 次：", over)
        if long:
            print("  ! 字幕超过 11 个字会出画，用 '|' 或逗号拆开：", long)
        if best > 10:
            print(f"  ! 有一段连续 {best:.0f} 秒只有人脸，找实拍盖一下")
