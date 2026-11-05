# Ajusta o ritmo da narração: insere pausas curtas entre frases coladas
# e pausas maiores nas viradas de capítulo. Gera build/voz.wav e src/words.json
import json, subprocess, sys, numpy as np
SR = 48000
src = sys.argv[1]
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
a = np.frombuffer(raw, dtype=np.float32).copy()
W = json.load(open("src/words_raw.json"))
# correções de transcrição
fixed = []
i = 0
while i < len(W):
    w, s, e = W[i]
    if w == "Eau" and i+1 < len(W) and W[i+1][0].startswith("New"):
        fixed.append(["El Niño" + W[i+1][0][3:], s, W[i+1][2]]); i += 2; continue
    if w == "ásia.": fixed += [["à", s, s+0.08], ["Ásia.", s+0.08, e]]; i += 1; continue
    if w == "é" and i+1 < len(W) and W[i+1][0] == "milhares": w = "a"
    if w == "Mas,": w = "Mas"
    fixed.append([w, s, e]); i += 1
W = fixed
CHAPTER_STARTS = {"Tudo", "Esse", "Em", "Mas"}  # 1ª palavra de cada parte (checado por tempo abaixo)
chapter_times = [13.26, 30.08, 45.40, 67.88, 83.12]
env = np.abs(a)
ins = []  # (amostra, segundos)
for k in range(len(W)-1):
    w, s, e = W[k]; ns = W[k+1][1]
    if not w.endswith((".", ",", "?", "!")): continue
    sentence = w.endswith((".", "?", "!"))
    target = 0.0
    if sentence: target = 0.55
    elif w.endswith(","): target = 0.0
    if any(abs(ns - c) < 0.05 for c in chapter_times): target = 0.85
    if k == 0: continue
    gap = ns - e
    add = target - max(gap, 0)
    if add <= 0.05: continue
    # ponto de menor energia entre o fim da palavra e o início da próxima
    lo = int(max(e - 0.12, s) * SR); hi = int((ns + 0.03) * SR)
    if hi - lo < 200: lo, hi = int((ns-0.1)*SR), int((ns+0.02)*SR)
    win = 480
    best = min(range(lo, hi - win, 120), key=lambda p: env[p:p+win].mean())
    ins.append((best + win // 2, round(add, 3)))
# monta áudio novo
parts, last = [], 0
for p, add in ins:
    parts.append(a[last:p]); parts.append(np.zeros(int(add*SR), np.float32)); last = p
parts.append(a[last:])
b = np.concatenate(parts)
# remapeia tempos
def nt(t):
    return t + sum(add for p, add in ins if p / SR <= t + 1e-6)
out = [[w, round(nt(s), 3), round(nt(e), 3)] for w, s, e in W]
json.dump({"words": out, "chapters": [round(nt(c), 3) for c in chapter_times],
           "insertions": [[round(p/SR, 3), add] for p, add in ins],
           "duration": round(len(b)/SR, 3)}, open("src/words.json", "w"), ensure_ascii=False, indent=0)
b.astype(np.float32).tofile("build/voz.f32")
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","build/voz.f32","build/voz.wav"])
print("pausas:", ins and [(round(p/SR,2), add) for p, add in ins])
print("duração nova:", len(b)/SR)
