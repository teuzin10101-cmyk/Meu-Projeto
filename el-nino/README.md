# Vídeo El Niño (animação cartoon 9:16)

- `El_Nino_final.mp4` — vídeo final 1080x1920, 30 fps, ~97 s
- `audio_prep.py` — ajusta o ritmo da narração (pausas entre frases/partes) e gera `src/words.json`
- `src/draw.js`, `src/scenes.js` — personagens, cenas, legendas karaokê
- `render.js` — renderiza no Chromium e codifica com ffmpeg (`node render.js video 4`)
- `audio_mix.py` — voz + efeitos + trilha de fundo

Recriar: `npm i && python3 audio_prep.py voz.mp3 && node render.js video 4 && python3 audio_mix.py`
e juntar `build/video_mudo.mp4` + `build/audio_final.wav` com ffmpeg.
