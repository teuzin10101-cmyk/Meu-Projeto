// Renderiza o vídeo quadro a quadro no Chromium (Playwright) e codifica com ffmpeg.
// Uso: node render.js preview 1.0 5.2 ...   -> build/preview_<t>.png
//      node render.js video [workers]       -> build/video_mudo.mp4 + build/events.json
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const ROOT = __dirname, FPS = 30;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, () => res(srv));
  });
}
async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html`);
  await page.waitForFunction(() => window.ready); await page.evaluate(() => Promise.all([document.fonts.load('700 100px Fredoka'), document.fonts.load('600 100px Fredoka')]));
  const info = await page.evaluate(async () => {
    const d = await (await fetch('words.json')).json();

    return init(d);
  });
  return { page, info };
}
const grab = (page, t) => page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', .93).split(',')[1]; }, t);

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const srv = await serve(), port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
  if (mode === 'preview') {
    const { page, info } = await openPage(browser, port);
    if (!args.length) console.log(JSON.stringify(info.shots));
    for (const a of args) {
      await page.evaluate(t => render(t), +a);
      await page.locator('canvas').screenshot({ path: path.join(ROOT, `build/preview_${a}.png`) });
    }
  } else if (mode === 'range') {
    const { page } = await openPage(browser, port);
    const [a, b] = [Math.round(+args[0] * FPS), Math.round(+args[1] * FPS)];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(ROOT, 'build/patch.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) { const buf = Buffer.from(await grab(page, f / FPS), 'base64'); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  } else {
    const workers = +(args[0] || 4);
    const first = await openPage(browser, port);
    const total = first.info.total, N = Math.ceil(total * FPS);
    fs.writeFileSync(path.join(ROOT, 'build/events.json'), JSON.stringify(first.info));
    console.log('quadros:', N, 'duração:', total.toFixed(2));
    const pages = [first.page]; for (let i = 1; i < workers; i++) pages.push((await openPage(browser, port)).page);
    const per = Math.ceil(N / workers), t0 = Date.now();
    await Promise.all(pages.map(async (page, w) => {
      const a = w * per, b = Math.min(N, a + per);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(ROOT, `build/part${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = a; f < b; f++) {
        const buf = Buffer.from(await grab(page, f / FPS), 'base64');
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (w === 0 && (f - a) % 150 === 0) console.log(`~${Math.round(100 * (f - a) / (b - a))}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end(); await new Promise(r => ff.on('close', r));
    }));
    fs.writeFileSync(path.join(ROOT, 'build/parts.txt'), pages.map((_, w) => `file 'part${w}.mp4'`).join('\n'));
    await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(ROOT, 'build/parts.txt'), '-c', 'copy', path.join(ROOT, 'build/video_mudo.mp4')], { stdio: 'inherit' }).on('close', r));
    console.log('pronto em', ((Date.now() - t0) / 1000).toFixed(0), 's');
  }
  await browser.close(); srv.close();
})();
