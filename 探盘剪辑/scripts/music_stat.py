import sys, subprocess, numpy as np
SR = 22050
def load(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
print("id    dur   BPM  起伏(dB)  人声频段占比  亮度Hz  拍点密度  能量最大跳变")
for f in sys.argv[1:]:
    x = load(f); hop = 512; n = 2048
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(fr, axis=1)); fq = np.fft.rfftfreq(n, 1/SR)
    P = S**2
    voice = P[:, (fq > 300) & (fq < 3500)].sum() / P.sum()
    cent = (P * fq).sum(1) / (P.sum(1) + 1e-9)
    Sl = np.log1p(S * 10); flux = np.maximum(0, np.diff(Sl, axis=0)).sum(1); fz = (flux - flux.mean()) / flux.std()
    fps = SR / hop
    ac = np.correlate(fz, fz, "full")[len(fz)-1:]; lags = np.arange(len(ac)) / fps
    bpms = 60 / lags[1:]; m = (bpms > 60) & (bpms < 150); bpm = bpms[m][np.argmax(ac[1:][m])]
    onsets = ((fz[1:-1] > fz[:-2]) & (fz[1:-1] > fz[2:]) & (fz[1:-1] > 1.0)).sum() / (len(x) / SR)
    sec = [20*np.log10(np.sqrt((x[i:i+SR*2]**2).mean())+1e-9) for i in range(0, len(x)-SR*2, SR*2)]
    sec = np.array(sec); core = sec[3:-3]
    jump = np.max(np.abs(np.diff(core))) if len(core) > 2 else 0
    name = f.split("mk_")[1].split(".")[0]
    print(f"{name:5s} {len(x)/SR:5.0f} {bpm:5.0f}  {core.max()-np.percentile(core,10):6.1f}   {voice*100:6.0f}%      {np.median(cent):6.0f}   {onsets:5.1f}/s   {jump:5.1f}")
