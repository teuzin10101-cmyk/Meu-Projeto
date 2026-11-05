# Vídeo "Como um avião consegue voar?" (animação 3D low-poly, 9:16)

- `Aviao_final.mp4` — vídeo final 1080x1920, 30 fps, ~80 s
- `audio_prep.py` — ajusta pausas da narração e gera `src/words.json`
- `src/main.js` — cenas 3D (three.js): aeroporto, céu, corte da asa, forças, cabine + legendas
- `render.js` — renderiza no Chromium (WebGL/SwiftShader) e codifica com ffmpeg
- `audio_mix.py` — voz + efeitos (whoosh, turbina) + trilha de fundo

Recriar: `npm i && python3 audio_prep.py voz.mp3 && node render.js video 4 && python3 audio_mix.py`
