import sys, subprocess, numpy as np
def load(f, ss, to):
    raw = subprocess.run(["ffmpeg","-v","error","-ss",str(ss),"-to",str(to),"-i",f,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
f = sys.argv[1]
for a in sys.argv[2:]:
    ss, to = map(float, a.split(":"))
    x = load(f, ss, to); hop = 320
    db = [20*np.log10(np.sqrt((x[i:i+hop]**2).mean())+1e-9) for i in range(0, len(x)-hop, hop)]
    print(f"== {ss}-{to}")
    print(" ".join(f"{ss+i*0.02:.2f}:{int(d)}" for i, d in enumerate(db)))
