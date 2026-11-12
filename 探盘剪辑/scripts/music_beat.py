import sys, subprocess, numpy as np
SR = 22050
def load(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
for f in sys.argv[1:]:
    x = load(f); hop = 512; n = 2048
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1))
    S = np.log1p(S * 10)
    flux = np.maximum(0, np.diff(S, axis=0)).sum(1)
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    fps = SR / hop
    ac = np.correlate(flux, flux, mode="full")[len(flux)-1:]
    lags = np.arange(len(ac)) / fps
    bpms = 60 / lags[1:]
    m = (bpms > 70) & (bpms < 160)
    i = np.argmax(ac[1:][m]); bpm = bpms[m][i]
    # 细化
    cand = np.linspace(bpm * 0.97, bpm * 1.03, 61)
    def score(b, ph):
        per = 60 / b * fps; idx = (ph + np.arange(0, len(flux) / per) * per).astype(int); idx = idx[idx < len(flux)]
        return flux[idx].mean()
    best = max(((score(b, ph), b, ph) for b in cand for ph in np.linspace(0, 60 / b * fps, 40, endpoint=False)))
    _, bpm, ph = best
    beat = 60 / bpm; t0 = ph / fps
    # 每 4 秒能量
    rms = [20*np.log10(np.sqrt((x[int(s*SR):int((s+4)*SR)]**2).mean())+1e-9) for s in range(0, int(len(x)/SR), 4)]
    # 小节重拍：在 4 种相位里找重音最强的
    bi = (t0 + np.arange(0, len(x)/SR/beat) * beat)
    acc = [np.mean([flux[int(b*fps)] for b in bi[k::4] if int(b*fps) < len(flux)]) for k in range(4)]
    k = int(np.argmax(acc))
    print(f"{f}: dur {len(x)/SR:.1f}s bpm {bpm:.2f} beat {beat:.4f} first_beat {t0:.3f} downbeat_phase {k} first_downbeat {bi[k]:.3f}")
    print("  energy/4s:", " ".join(f"{int(r)}" for r in rms))
