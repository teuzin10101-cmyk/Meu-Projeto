# Mixa voz + efeitos sonoros + trilha de fundo sintetizada -> build/audio_final.wav
import json, subprocess, numpy as np
SR = 48000
rng = np.random.default_rng(7)
info = json.load(open("build/events.json"))
total = info["total"]
N = int(total * SR) + SR

voz = np.fromfile("build/voz.f32", dtype=np.float32)

def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)

def lowpass(x, alpha):
    y = np.empty_like(x); acc = 0.0
    al = np.broadcast_to(alpha, x.shape)
    for i in range(len(x)):
        acc += al[i] * (x[i] - acc); y[i] = acc
    return y

def noise(n): return rng.standard_normal(n).astype(np.float32)

def sfx(kind):
    if kind in ("whoosh", "whoosh2"):
        d = .32 if kind == "whoosh" else .6; n = int(d * SR); t = np.arange(n) / n
        a = .02 + .25 * np.sin(np.pi * t) ** 2
        x = lowpass(noise(n), a) * np.sin(np.pi * t) ** 2
        return x / np.abs(x).max() * (.22 if kind == "whoosh" else .3)
    if kind == "pop":
        n = int(.12 * SR); t = np.arange(n) / SR
        f = 500 + 900 * np.minimum(1, t / .03)
        return .35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .03)
    if kind == "stamp":
        n = int(.35 * SR); t = np.arange(n) / SR
        th = np.sin(2 * np.pi * (110 - 60 * t / .35) * t) * env(n, .001, .09)
        cl = lowpass(noise(n), .35) * env(n, .0005, .02)
        return .55 * th + .35 * cl
    if kind == "ding":
        n = int(1.0 * SR); t = np.arange(n) / SR
        return .16 * (np.sin(2 * np.pi * 1318.5 * t) + .6 * np.sin(2 * np.pi * 1760 * t) + .3 * np.sin(2 * np.pi * 2637 * t)) * env(n, .003, .35)
    if kind == "boom":
        n = int(1.0 * SR); t = np.arange(n) / SR
        return .6 * np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, .003, .3) + .25 * lowpass(noise(n), .05) * env(n, .002, .25)
    if kind == "rain":
        n = int(2.0 * SR); t = np.arange(n) / n
        return .1 * lowpass(noise(n), .5) * np.sin(np.pi * t)
    if kind == "fire":
        n = int(1.6 * SR); x = .06 * lowpass(noise(n), .08) * np.sin(np.pi * np.arange(n) / n)
        for _ in range(40):
            p = rng.integers(0, n - 800); x[p:p + 800] += .25 * noise(800) * env(800, .0002, .002)
        return x
    if kind == "click":
        n = int(.05 * SR); return .4 * lowpass(noise(n), .5) * env(n, .0002, .006)
    return np.zeros(1)

fx = np.zeros(N, np.float32)
for kind, t in info["events"]:
    s = sfx(kind).astype(np.float32); p = int(t * SR)
    if p < 0 or p >= N: continue
    e = min(N, p + len(s)); fx[p:e] += s[:e - p]

# trilha lo-fi 100 BPM: Am7 - Fmaj7 - Cmaj7 - G6
bpm = 100; beat = 60 / bpm; bar = 4 * beat
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
mus = np.zeros(N, np.float32); t_all = np.arange(N) / SR
nb = int(total / bar) + 2
for b in range(nb):
    s0 = int(b * bar * SR); n = int(bar * SR);
    if s0 >= N: break
    n = min(n, N - s0); t = np.arange(n) / SR
    pad = np.zeros(n)
    for m in chords[b % 4]:
        f = mtof(m); pad += np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.003 * t) + .2 * np.sin(2 * np.pi * 2 * f * t)
    a = np.minimum(1, t / .25) * np.minimum(1, (bar - t) / .25)
    mus[s0:s0 + n] += .018 * pad * a
    # baixo
    f = mtof(chords[b % 4][0] - 12)
    mus[s0:s0 + n] += .07 * np.sin(2 * np.pi * f * t) * np.exp(-((t % (2 * beat)) / .5))
    for k in range(4):  # bumbo, caixa leve, chimbal
        p = s0 + int(k * beat * SR)
        if p >= N: continue
        if k in (0, 2):
            kn = int(.25 * SR); kt = np.arange(kn) / SR
            kick = .32 * np.sin(2 * np.pi * (55 + 90 * np.exp(-kt / .03)) * kt) * env(kn, .001, .08)
            e = min(N, p + kn); mus[p:e] += kick[:e - p]
        else:
            sn = int(.18 * SR); snare = .07 * lowpass(noise(sn), .4) * env(sn, .001, .05)
            e = min(N, p + sn); mus[p:e] += snare[:e - p]
        for h in (0, .5):
            q = p + int(h * beat * SR); hn = int(.05 * SR)
            if q + hn < N: mus[q:q + hn] += .035 * (noise(hn) - lowpass(noise(hn), .3)) * env(hn, .0005, .012)

# ducking: abaixa a música quando há voz
vz = np.zeros(N, np.float32); vz[:min(N, len(voz))] = voz[:N]
lev = np.sqrt(np.convolve(vz ** 2, np.ones(2400) / 2400, mode="same"))
duck = lowpass(np.clip(lev / .03, 0, 1).astype(np.float32), .0004)
gain = 1 - .55 * duck
end = int((info["total"] - 3.4) * SR)
gain[end:] = np.minimum(1.6, gain[end:] * 1.6)  # música sobe na tela final
fade = np.ones(N); fl = int(1.2 * SR); fe = int(total * SR); fade[fe - fl:fe] = np.linspace(1, 0, fl); fade[fe:] = 0
mix = vz * 1.0 + fx * .8 + mus * gain * .55
mix *= fade
mix = mix[:int(total * SR)]
mix.astype(np.float32).tofile("build/mix.f32")
# masterização: passa-alta na voz geral, compressão leve e normalização de loudness
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "build/mix.f32",
                "-af", "highpass=f=70,acompressor=threshold=0.2:ratio=3:attack=10:release=150,loudnorm=I=-14:TP=-1.5:LRA=9",
                "-ar", str(SR), "-ac", "2", "build/audio_final.wav"], check=True)
print("ok", total)
