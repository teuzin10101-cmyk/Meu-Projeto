// Primitivas de desenho — estilo cartoon com sombreamento "3D"
const W = 1080, H = 1920;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const OUT = '#141414';
const YEL = '#ffd21f', RED = '#ff3b30', GRN = '#2fb24a';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eob = t => { t = clamp(t); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const popS = (lt, d = .35) => lt < 0 ? 0 : eob(lt / d);

function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function shade(h, f) { // f>0 clareia, f<0 escurece
  const [r, g, b] = hexToRgb(h);
  const m = c => Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function mix(h1, h2, t) { const a = hexToRgb(h1), b = hexToRgb(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); }

function T(fn, x, y, s = 1, r = 0, a = 1) {
  if (s <= 0.001 || a <= 0.001) return;
  ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); ctx.scale(s, s); if (a < 1) ctx.globalAlpha *= a; fn(); ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ellipse(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function fillStroke(fill, lw = 8, stroke = OUT) { ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
function radial(x, y, r, c1, c2, ox = -.35, oy = -.4) {
  const g = ctx.createRadialGradient(x + r * ox, y + r * oy, r * .05, x, y, r * 1.05);
  g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
}
function ball(x, y, r, col, lw = 8) { circle(x, y, r); fillStroke(radial(x, y, r, shade(col, .35), shade(col, -.25)), lw); }

// ---------- texto ----------
function fitSize(str, size, maxW, font = 'Anton') {
  ctx.font = `${size}px ${font}`; const w = ctx.measureText(str).width;
  return w > maxW ? size * maxW / w : size;
}
function text(str, x, y, size, o = {}) {
  const { fill = '#fff', stroke = OUT, sw = size * .17, align = 'center', shadow = true, font = 'Anton', alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = sw; ctx.strokeText(str, x + size * .04, y + size * .08); ctx.fillText(str, x + size * .04, y + size * .08); }
  if (sw) { ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y); ctx.restore();
}
function pill(str, x, y, size, bg, fg = '#fff', o = {}) {
  ctx.font = `${size}px Anton`; const w = ctx.measureText(str).width + size * 1.1, h = size * 1.45;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(x - w / 2 + 6, y - h / 2 + 10, w, h, h / 2); ctx.fill();
  rr(x - w / 2, y - h / 2, w, h, o.r ?? h / 2);
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, shade(bg, .2)); g.addColorStop(1, shade(bg, -.15));
  fillStroke(g, o.lw ?? 7, o.border ?? OUT); ctx.restore();
  text(str, x, y + size * .04, size, { fill: fg, sw: o.sw ?? 0, shadow: false });
  return w;
}
// carimbo vermelho inclinado
function stamp(str, x, y, rot, col, lt) {
  if (lt < 0) return;
  const k = eo(lt / .16), s = lerp(2.4, 1, k) * (1 + .06 * Math.sin(clamp(lt / .35) * Math.PI));
  T(() => {
    const size = 92; ctx.font = `${size}px Anton`;
    const w = ctx.measureText(str).width + 70, h = size * 1.5;
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(-w / 2, -h / 2, w, h, 18); ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = col; rr(-w / 2, -h / 2, w, h, 18); ctx.stroke();
    ctx.lineWidth = 4; rr(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 10); ctx.stroke();
    text(str, 0, 6, size, { fill: col, sw: 0, shadow: false });
  }, x, y, s, rot, k);
}
function counterBox(big, small, x, y, lt, col = YEL) {
  if (lt < 0) return; const s = popS(lt);
  T(() => {
    const bs = fitSize(big, 130, 760); ctx.font = `${bs}px Anton`;
    const w = Math.max(ctx.measureText(big).width, 300) + 90, h = small ? 230 : 180;
    ctx.fillStyle = 'rgba(15,18,28,.82)'; rr(-w / 2, -h / 2, w, h, 30); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.stroke();
    text(big, 0, small ? -22 : 4, bs, { fill: col, sw: 0 });
    if (small) text(small, 0, 72, 44, { fill: '#fff', sw: 0, shadow: false });
  }, x, y, s);
}

// ---------- fundos ----------
function sparkles(t, n = 22, col = '255,255,255') {
  for (let i = 0; i < n; i++) {
    const x = ((hash(i) * W + t * 25 * (hash(i + 9) - .5)) % W + W) % W;
    const y = ((hash(i + 3) * H - t * 40 * (.3 + hash(i + 5))) % H + H) % H;
    const a = .25 + .3 * Math.sin(t * 2.5 + i * 1.7), s = 9 + hash(i + 7) * 14;
    ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    line(x - s, y, x + s, y); line(x, y - s, x, y + s);
  }
  for (let i = 0; i < 8; i++) { // riscos diagonais
    const x = ((hash(i + 40) * W * 1.4 + t * 120) % (W * 1.4)) - W * .2, y = hash(i + 50) * H;
    ctx.strokeStyle = `rgba(${col},.12)`; ctx.lineWidth = 3; line(x, y, x + 60, y - 40);
  }
}
function bgRays(c1, c2, t, cx = W / 2, cy = H * .45) {
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, H * .75); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .07); ctx.fillStyle = 'rgba(255,255,255,.055)';
  for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI * 2 / 16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-110, -H * 1.3); ctx.lineTo(110, -H * 1.3); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 8; circle(cx, cy, 380); ctx.stroke(); circle(cx, cy, 250); ctx.stroke();
  // textura leve
  ctx.fillStyle = 'rgba(0,0,0,.035)';
  for (let i = 0; i < 260; i++) ctx.fillRect(hash(i + 900) * W, hash(i + 1300) * H, 6, 6);
  sparkles(t);
}
function bgSky(top, bottom, ground, t, groundY = 1500) {
  let g = ctx.createLinearGradient(0, 0, 0, groundY); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, groundY);
  g = ctx.createLinearGradient(0, groundY, 0, H); g.addColorStop(0, ground); g.addColorStop(1, shade(ground, -.35));
  ctx.fillStyle = g; ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, groundY, W, 10);
}

// ---------- rosto genérico ----------
// expr: normal, happy, shock, sad, tired, hot, sick, worry, angry
function face(x, y, R, expr, t, o = {}) {
  const lid = o.lid || '#f2c39b', look = o.look || [0, 0], k = R / 120;
  const blink = (Math.sin(t * 1.3 + (o.seed || 0)) > .985);
  const ex = R * .36, ey = y - R * .12;
  let er = R * .25; if (expr === 'shock') er *= 1.15;
  for (const s of [-1, 1]) {
    const cx = x + s * ex;
    ellipse(cx, ey, er, er * 1.08); fillStroke('#fff', 6 * k);
    const pr = expr === 'shock' ? er * .32 : er * .45;
    circle(cx + look[0] * er * .35, ey + look[1] * er * .35 + (expr === 'sad' ? er * .2 : 0), pr); ctx.fillStyle = OUT; ctx.fill();
    circle(cx + look[0] * er * .35 - pr * .35, ey - pr * .4, pr * .3); ctx.fillStyle = '#fff'; ctx.fill();
    let lidAmt = 0;
    if (['tired', 'hot', 'sick'].includes(expr)) lidAmt = .5; if (expr === 'angry') lidAmt = .35; if (blink) lidAmt = 1;
    if (lidAmt > 0) {
      ctx.save(); ellipse(cx, ey, er, er * 1.08); ctx.clip();
      ctx.fillStyle = lid; ctx.fillRect(cx - er - 2, ey - er * 1.1 - 2, er * 2 + 4, er * 2.16 * lidAmt + 2);
      ctx.restore(); ctx.lineWidth = 6 * k; ctx.strokeStyle = OUT;
      line(cx - er, ey - er * 1.08 + er * 2.16 * lidAmt, cx + er, ey - er * 1.08 + er * 2.16 * lidAmt);
      ellipse(cx, ey, er, er * 1.08); ctx.stroke();
    }
    // sobrancelhas
    ctx.lineWidth = 9 * k; ctx.lineCap = 'round'; ctx.strokeStyle = OUT;
    const by = ey - er * 1.45;
    if (expr === 'sad' || expr === 'worry' || expr === 'sick') line(cx - s * er * .9, by + er * .05, cx + s * er * .5, by - er * .35);
    else if (expr === 'angry') line(cx - s * er * .9, by - er * .3, cx + s * er * .6, by + er * .2);
    else if (expr === 'shock') line(cx - er * .7, by - er * .35, cx + er * .7, by - er * .35);
  }
  // bochechas
  if (['hot', 'sick', 'happy'].includes(expr)) {
    ctx.fillStyle = expr === 'happy' ? 'rgba(255,110,120,.35)' : 'rgba(255,60,60,.5)';
    for (const s of [-1, 1]) { ellipse(x + s * R * .58, y + R * .18, R * .16, R * .1); ctx.fill(); }
  }
  // boca
  const my = y + R * .32; ctx.lineWidth = 8 * k; ctx.strokeStyle = OUT; ctx.lineCap = 'round';
  if (expr === 'happy') {
    ctx.beginPath(); ctx.moveTo(x - R * .32, my - R * .06); ctx.quadraticCurveTo(x, my + R * .5, x + R * .32, my - R * .06); ctx.closePath();
    fillStroke('#7a1c1c', 7 * k); ctx.save(); ctx.clip(); ellipse(x, my + R * .3, R * .18, R * .12); ctx.fillStyle = '#ff6b6b'; ctx.fill(); ctx.restore();
  } else if (expr === 'shock') {
    ellipse(x, my + R * .05, R * .13, R * .19); fillStroke('#7a1c1c', 7 * k);
  } else if (expr === 'sad' || expr === 'angry') {
    ctx.beginPath(); ctx.arc(x, my + R * .3, R * .25, -Math.PI * .8, -Math.PI * .2); ctx.stroke();
  } else if (expr === 'worry' || expr === 'sick' || expr === 'tired') {
    ctx.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(x - R * .25 + u * R * .5, my + Math.sin(u * Math.PI * 3 + t * 4) * R * .04); } ctx.stroke();
  } else if (expr === 'hot') {
    ctx.beginPath(); ctx.moveTo(x - R * .25, my); ctx.quadraticCurveTo(x, my + R * .25, x + R * .25, my); ctx.closePath(); fillStroke('#7a1c1c', 7 * k);
    ctx.beginPath(); ctx.ellipse(x + R * .05, my + R * .17 + Math.sin(t * 8) * 3, R * .1, R * .14, 0, 0, Math.PI); fillStroke('#ff6b6b', 5 * k);
  } else { ctx.beginPath(); ctx.arc(x, my - R * .12, R * .25, Math.PI * .2, Math.PI * .8); ctx.stroke(); }
}
function sweat(x, y, s, t, seed = 0) {
  const p = ((t * .9 + hash(seed)) % 1);
  T(() => {
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.bezierCurveTo(14, -2, 16, 10, 0, 16); ctx.bezierCurveTo(-16, 10, -14, -2, 0, -22);
    fillStroke('#7fd3ff', 4); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-4, 4, 4); ctx.fill();
  }, x, y + p * 60, s, 0, 1 - p * p);
}

// ---------- personagem ----------
function person(x, y, s, o = {}) {
  o = Object.assign({ skin: '#f2c39b', shirt: '#2f9e44', pants: '#2b3a55', hair: '#2a1a10', hairStyle: 'short', expr: 'normal', arms: 'down', t: 0, seed: 0 }, o);
  const t = o.t, bob = Math.sin(t * 5 + o.seed) * 5;
  T(() => {
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(0, 0, 120, 22); ctx.fill();
    // pernas
    ctx.lineCap = 'round';
    for (const sx of [-32, 32]) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 54; line(sx, -230, sx * 1.05, -30);
      ctx.strokeStyle = o.pants; ctx.lineWidth = 40; line(sx, -230, sx * 1.05, -30);
      ellipse(sx * 1.1 + (sx > 0 ? 10 : -10), -14, 44, 20); fillStroke('#1d1d1d', 6);
    }
    ctx.save(); ctx.translate(0, bob * .4);
    // braços (atrás)
    const arm = (side, pose) => {
      const sx = side * 72, sy = -405; let ex, ey, hx, hy;
      const wave = Math.sin(t * 9 + side) * 18;
      if (pose === 'up') { ex = side * 140; ey = -500; hx = side * 165 + wave * .5; hy = -620 + wave * .3; }
      else if (pose === 'shrug') { ex = side * 150; ey = -350; hx = side * 185; hy = -440; }
      else if (pose === 'hips') { ex = side * 150; ey = -340; hx = side * 92; hy = -265; }
      else if (pose === 'face') { ex = side * 135; ey = -330; hx = side * 75; hy = -470; }
      else if (pose === 'wave') { ex = side * 140; ey = -470; hx = side * 170 + wave; hy = -600; }
      else if (pose === 'point') { ex = side * 150; ey = -420; hx = side * 235; hy = -470; }
      else { ex = side * 100; ey = -320; hx = side * 108; hy = -235; }
      for (const [c, w] of [[OUT, 46], [o.shirt, 32]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      }
      ball(hx, hy, 27, o.skin, 6);
    };
    const arms = Array.isArray(o.arms) ? o.arms : [o.arms, o.arms];
    arm(-1, arms[0]); arm(1, arms[1]);
    // corpo
    rr(-82, -450, 164, 240, 46);
    let g = ctx.createLinearGradient(-82, 0, 82, 0); g.addColorStop(0, shade(o.shirt, .25)); g.addColorStop(.6, o.shirt); g.addColorStop(1, shade(o.shirt, -.3));
    fillStroke(g, 8);
    if (o.coat) { // jaleco
      rr(-86, -452, 172, 250, 46); fillStroke(radial(0, -330, 150, '#ffffff', '#cfd6dd'), 8);
      ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.moveTo(-26, -450); ctx.lineTo(26, -450); ctx.lineTo(0, -330); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; line(0, -330, 0, -210);
    }
    if (o.tie) { ctx.beginPath(); ctx.moveTo(-12, -440); ctx.lineTo(12, -440); ctx.lineTo(18, -320); ctx.lineTo(0, -300); ctx.lineTo(-18, -320); ctx.closePath(); fillStroke('#d62828', 5); }
    // cabeça
    const hy = -575 + bob * .6;
    ctx.fillStyle = o.skin; ctx.strokeStyle = OUT; ctx.lineWidth = 7;
    for (const sx of [-1, 1]) { ball(sx * 118, hy + 10, 26, o.skin, 6); }
    ball(0, hy, 125, o.skin, 8);
    // cabelo
    ctx.save(); circle(0, hy, 121); ctx.clip();
    if (o.hairStyle === 'short') { ellipse(0, hy - 95, 150, 75); ctx.fillStyle = o.hair; ctx.fill(); ellipse(-60, hy - 55, 70, 30, -.4); ctx.fill(); }
    if (o.hairStyle === 'curly') { ctx.fillStyle = o.hair; for (let i = 0; i < 9; i++) { circle(-110 + i * 27, hy - 100 + Math.sin(i * 2) * 10, 36); ctx.fill(); } }
    if (o.hairStyle === 'sides') { ctx.fillStyle = o.hair; ellipse(-120, hy - 10, 30, 70); ctx.fill(); ellipse(120, hy - 10, 30, 70); ctx.fill(); }
    ctx.restore();
    if (o.hairStyle === 'short' || o.hairStyle === 'curly') { ctx.lineWidth = 8; ctx.strokeStyle = OUT; circle(0, hy, 125); ctx.stroke(); }
    if (o.hairStyle === 'long') {
      ctx.fillStyle = o.hair; ctx.beginPath(); ctx.ellipse(0, hy - 20, 140, 150, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    }
    face(0, hy + 10, 125, o.expr, t, { lid: shade(o.skin, -.1), look: o.look, seed: o.seed });
    if (o.glasses) { ctx.lineWidth = 7; ctx.strokeStyle = OUT; for (const sx of [-1, 1]) { circle(sx * 45, hy - 5, 42); ctx.stroke(); } line(-5, hy - 8, 5, hy - 8); }
    if (o.hat) { // chapéu de palha
      ellipse(0, hy - 90, 190, 38); fillStroke('#e9c46a', 7);
      rr(-95, hy - 175, 190, 95, 40); fillStroke(radial(0, hy - 140, 110, '#f4d58d', '#c9a227'), 7);
      ctx.fillStyle = '#b5651d'; ctx.fillRect(-93, hy - 112, 186, 20);
    }
    if (o.sweat) { sweat(-150, hy - 40, 1.2, t, o.seed); sweat(150, hy - 70, 1, t + .5, o.seed + 3); sweat(110, hy + 40, .8, t + .2, o.seed + 5); }
    ctx.restore();
  }, x, y, s);
}

// ---------- objetos ----------
function cloudShape(col, lw = 14) {
  const P = [[-95, 15, 68], [-35, -38, 85], [50, -25, 75], [105, 18, 58], [0, 28, 78]];
  ctx.fillStyle = OUT; for (const [x, y, r] of P) { circle(x, y, r + lw / 2); ctx.fill(); }
  for (const [x, y, r] of P) { circle(x, y, r); ctx.fillStyle = radial(x, y, r, shade(col, .4), shade(col, -.18)); ctx.fill(); }
}
function cloudChar(x, y, s, o = {}) {
  const { col = '#ffffff', expr = 'normal', blow = 0, t = 0, rain = 0, sweatOn = false, flip = false } = o;
  T(() => {
    if (flip) ctx.scale(-1, 1);
    if (rain > 0) {
      ctx.strokeStyle = 'rgba(90,170,255,.9)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let i = 0; i < 14 * rain; i++) { const px = -110 + hash(i) * 220, p = (t * 2.2 + hash(i + 3)) % 1; const py = 60 + p * 360; line(px, py, px - 12, py + 40); }
    }
    cloudShape(col);
    face(-5, 5, 60, expr, t, { lid: shade(col, -.1), look: blow ? [-1, 0] : [0, 0] });
    if (blow > 0) { // bochechas cheias + sopro
      ctx.fillStyle = 'rgba(255,140,150,.4)'; ellipse(-62, 30, 20, 13); ctx.fill(); ellipse(52, 30, 20, 13); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 11 * blow; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const yy = 10 + (i - 1) * 38, len = 220 * blow, off = ((t * 520) % 120);
        ctx.setLineDash([60 * blow, 40]); ctx.lineDashOffset = off;
        ctx.beginPath(); ctx.moveTo(-130, yy); ctx.quadraticCurveTo(-130 - len / 2, yy + (i - 1) * 25, -130 - len, yy + Math.sin(t * 5 + i) * 12); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (sweatOn) { sweat(85, -45, .9, t, 2); sweat(-110, -30, .8, t + .4, 4); }
  }, x, y, s);
}
function sunChar(x, y, s, t, expr = 'happy', col = '#ffc21a') {
  T(() => {
    ctx.save(); ctx.rotate(t * .5);
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-26, -125); ctx.lineTo(0, -185 - 10 * Math.sin(t * 6 + i)); ctx.lineTo(26, -125); ctx.closePath(); fillStroke('#ff9f1c', 7); }
    ctx.restore();
    ball(0, 0, 125, col, 8);
    face(0, 5, 100, expr, t, { lid: '#f5a300' });
  }, x, y, s);
}
function thermometer(x, y, s, level, o = {}) {
  T(() => {
    rr(-34, -300, 68, 330, 34); fillStroke('#ffffff', 8);
    const h = 270 * clamp(level);
    const g = ctx.createLinearGradient(0, 0, 0, -300); g.addColorStop(0, '#ff3b30'); g.addColorStop(1, '#ff9f1c');
    ctx.fillStyle = g; rr(-17, 10 - h, 34, h + 10, 17); ctx.fill();
    ball(0, 55, 62, '#ff3b30', 8);
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; for (let i = 0; i < 6; i++) line(14, -240 + i * 45, 32, -240 + i * 45);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(-24, -280, 10, 220, 5); ctx.fill();
  }, x, y, s, o.rot || 0);
}
function flame(x, y, s, t, seed = 0) {
  const f = 1 + .12 * Math.sin(t * 17 + seed * 3) + .08 * Math.sin(t * 29 + seed);
  T(() => {
    const drawF = (sc, c) => { ctx.beginPath(); ctx.moveTo(0, -150 * sc * f); ctx.bezierCurveTo(60 * sc, -70 * sc, 70 * sc, 0, 0, 30 * sc); ctx.bezierCurveTo(-70 * sc, 0, -60 * sc, -70 * sc, 0, -150 * sc * f); ctx.fillStyle = c; ctx.fill(); };
    ctx.save(); ctx.lineWidth = 14; ctx.strokeStyle = OUT; drawF(1, OUT); ctx.restore();
    drawF(.92, '#ff5a1f'); drawF(.62, '#ffb627'); drawF(.32, '#fff3b0');
  }, x, y, s, Math.sin(t * 7 + seed) * .06);
}
function tree(x, y, s, t, o = {}) {
  const { burnt = 0, col = '#3aa54a' } = o;
  T(() => {
    rr(-22, -170, 44, 175, 10); fillStroke(mix('#8b5a2b', '#2b2b2b', burnt), 7);
    const c = mix(col, '#5b4a2a', burnt);
    const P = [[0, -300, 95], [-70, -230, 75], [70, -230, 75], [0, -200, 80]];
    ctx.fillStyle = OUT; for (const [px, py, r] of P) { circle(px, py, r + 7); ctx.fill(); }
    for (const [px, py, r] of P) { circle(px, py, r); ctx.fillStyle = radial(px, py, r, shade(c, .3), shade(c, -.25)); ctx.fill(); }
  }, x, y, s, Math.sin(t * 2 + x) * .02);
}
function fish(x, y, s, t, o = {}) {
  const { col = '#ff8c42', flip = false, expr = 'normal', sweatOn = false, seed = 0 } = o;
  T(() => {
    if (flip) ctx.scale(-1, 1);
    const wag = Math.sin(t * 10 + seed) * .25;
    ctx.save(); ctx.translate(95, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(80, -60); ctx.lineTo(70, 0); ctx.lineTo(80, 60); ctx.closePath(); fillStroke(shade(col, -.1), 8); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-10, -60); ctx.quadraticCurveTo(30, -120, 70, -55); fillStroke(shade(col, -.15), 7);
    ellipse(0, 0, 115, 75); fillStroke(radial(0, 0, 115, shade(col, .35), shade(col, -.25)), 8);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(20 + i * 25, 0, 45, -.8, .8); ctx.stroke(); }
    ctx.save(); ctx.translate(-55, -5);
    ellipse(0, -8, 26, 28); fillStroke('#fff', 6); circle(-6, -6, 12); ctx.fillStyle = OUT; ctx.fill();
    if (expr === 'tired' || expr === 'sick') { ctx.fillStyle = shade(col, -.1); ctx.fillRect(-27, -38, 54, 30); ctx.lineWidth = 6; ctx.strokeStyle = OUT; line(-26, -8, 26, -8); }
    ctx.restore();
    ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.lineCap = 'round';
    if (expr === 'sad' || expr === 'sick' || expr === 'tired') { ctx.beginPath(); ctx.arc(-80, 45, 18, -Math.PI * .85, -Math.PI * .15); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-85, 18, 18, Math.PI * .1, Math.PI * .8); ctx.stroke(); }
    if (sweatOn) sweat(-20, -90, .8, t, seed);
  }, x, y, s);
}
function bubbles(t, n = 18) {
  for (let i = 0; i < n; i++) {
    const p = (t * .25 * (.5 + hash(i)) + hash(i + 2)) % 1, x = hash(i + 4) * W + Math.sin(t * 2 + i) * 15, y = H - p * H * 1.1;
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; circle(x, y, 8 + hash(i + 6) * 16); ctx.stroke();
  }
}
function seaweed(x, y, h, t, col = '#2fb24a') {
  ctx.lineCap = 'round';
  for (const [c, w] of [[OUT, 34], [col, 22]]) {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 1; i <= 10; i++) { const u = i / 10; ctx.lineTo(x + Math.sin(t * 2 + u * 5 + x) * 25 * u, y - h * u); }
    ctx.stroke();
  }
}
function magnifier(x, y, s, rot = -.5) {
  T(() => {
    ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 54; line(0, 150, 0, 330); ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 38; line(0, 160, 0, 320);
    ctx.lineWidth = 34; ctx.strokeStyle = OUT; circle(0, 0, 150); ctx.stroke(); ctx.lineWidth = 20; ctx.strokeStyle = '#ffd21f'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; circle(0, 0, 135); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(-60, -60, 40, 18, -.8); ctx.fill();
  }, x, y, s, rot);
}
function bigArrow(x, y, len, s, rot, col = '#fff') {
  T(() => {
    ctx.beginPath(); ctx.moveTo(-len / 2, -28); ctx.lineTo(len / 2 - 70, -28); ctx.lineTo(len / 2 - 70, -70); ctx.lineTo(len / 2, 0); ctx.lineTo(len / 2 - 70, 70); ctx.lineTo(len / 2 - 70, 28); ctx.lineTo(-len / 2, 28); ctx.closePath();
    ctx.lineJoin = 'round'; fillStroke(col, 9);
  }, x, y, s, rot);
}
function lightbulb(x, y, s, t) {
  T(() => {
    ctx.strokeStyle = 'rgba(255,230,80,.9)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * .4; const r1 = 150 + 10 * Math.sin(t * 8 + i); line(Math.cos(a) * 125, Math.sin(a) * 125, Math.cos(a) * r1, Math.sin(a) * r1); }
    ball(0, 0, 100, '#ffe066', 8); rr(-45, 85, 90, 70, 14); fillStroke('#9aa5b1', 7);
  }, x, y, s);
}

// ---------- mapas / globo ----------
let LAND, COUNTRIES, BRAZIL;
function globe(cx, cy, r, rot, o = {}) {
  const { heat = 0, heatLon = -118, heatR = 26, faceExpr = null, t = 0, tilt = -12, shadowOn = true, landCol = '#53c25f' } = o;
  const proj = d3.geoOrthographic().scale(r).translate([cx, cy]).rotate([rot, tilt]).clipAngle(90);
  const path = d3.geoPath(proj, ctx);
  if (shadowOn) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(cx, cy + r + 50, r * .75, 34); ctx.fill(); }
  // halo atmosfera
  ctx.fillStyle = 'rgba(140,210,255,.18)'; circle(cx, cy, r * 1.07); ctx.fill();
  ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = radial(cx, cy, r, '#6fd0ff', '#1657b0'); ctx.fill();
  if (heat > 0) {
    ctx.save(); ctx.beginPath(); path({ type: 'Sphere' }); ctx.clip();
    for (let i = 6; i >= 1; i--) {
      const c = d3.geoCircle().center([heatLon, 0]).radius(heatR * heat * i / 6 + 2)();
      ctx.beginPath(); path(c); ctx.fillStyle = `rgba(255,${60 + i * 22},${30 + i * 5},${.25 + .1 * (6 - i)})`; ctx.fill();
    }
    ctx.restore();
  }
  ctx.beginPath(); path(LAND); ctx.fillStyle = landCol; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b7d36'; ctx.stroke();
  // sombreamento 3D
  ctx.beginPath(); path({ type: 'Sphere' });
  const g = ctx.createRadialGradient(cx - r * .4, cy - r * .45, r * .05, cx, cy, r * 1.02);
  g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(.3, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(0,10,50,.12)'); g.addColorStop(1, 'rgba(0,10,50,.55)');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = OUT; ctx.stroke();
  if (faceExpr) face(cx, cy + r * .12, r * .62, faceExpr, t, { lid: '#3b8fe0' });
  return proj;
}
function worldMap(x0, y0, x1, y1, rot = 0, o = {}) {
  const proj = d3.geoNaturalEarth1().rotate([rot, 0]).fitExtent([[x0, y0], [x1, y1]], { type: 'Sphere' });
  const path = d3.geoPath(proj, ctx);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.save(); ctx.translate(8, 14); ctx.beginPath(); path({ type: 'Sphere' }); ctx.fill(); ctx.restore();
  ctx.beginPath(); path({ type: 'Sphere' }); const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#4fb3f0'); g.addColorStop(1, '#1d6cc0'); ctx.fillStyle = g; ctx.fill();
  if (o.heat) {
    ctx.save(); ctx.beginPath(); path({ type: 'Sphere' }); ctx.clip();
    for (let i = 6; i >= 1; i--) { const c = d3.geoCircle().center([-118, 0]).radius(24 * o.heat * i / 6 + 1)(); ctx.beginPath(); path(c); ctx.fillStyle = `rgba(255,${60 + i * 22},40,${.25 + .1 * (6 - i)})`; ctx.fill(); }
    ctx.restore();
  }
  ctx.beginPath(); path(LAND); ctx.fillStyle = '#5cc468'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2b7d36'; ctx.stroke();
  ctx.beginPath(); path({ type: 'Sphere' }); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
  return proj;
}

// ---------- legendas karaokê ----------
const KEY_Y = new Set(['febre', 'impossível', 'fenômeno', 'aquecer', 'planeta', 'continentes', 'el niño', 'pacífico', 'ventos', 'quentes', 'ásia', 'enfraquecem', 'quente', 'acumular', 'central', 'oriental', 'interessantes', 'atmosfera', 'chuvas', 'brasil', 'sul', 'norte', 'nordeste', 'plantações', 'humanos', 'marinha', 'nutrientes', 'espécies', 'frias', 'impressionante', 'inteiro', 'suficiente', 'milhares', 'quilômetros', 'distância', 'efeitos', 'intensas', 'mundo', 'água', 'clima']);
const KEY_R = new Set(['secas', 'calor', 'incêndios', 'florestais', 'não', 'sofrem', 'risco', 'prejudicar']);
function norm(w) { return w.toLowerCase().replace(/[.,!?;:]/g, ''); }
function buildChunks(words) {
  const chunks = []; let cur = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i]; cur.push(w);
    const len = cur.map(x => x[0]).join(' ').length;
    const punct = /[.,!?]$/.test(w[0]);
    const next = words[i + 1];
    const gap = next ? next[1] - w[2] : 9;
    if (punct || cur.length >= 3 || len >= 15 || gap > .35) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  // evita chunk de 1 palavra curta pendurada (junta com o próximo)
  return chunks.map((c, i) => ({ words: c, start: c[0][1] - .06, end: Math.min(c[c.length - 1][2] + .35, chunks[i + 1] ? chunks[i + 1][0][1] - .06 : 999) }));
}
function drawSubtitle(chunks, t, y = 1290) {
  const c = chunks.find(c => t >= c.start && t < c.end); if (!c) return;
  const size = 96, lt = t - c.start, s = lerp(.82, 1, eob(lt / .14));
  ctx.font = `${size}px Anton`;
  const toks = c.words.map(w => ({ txt: w[0].toUpperCase().replace(/[,;]$/, ''), w, k: norm(w[0]) }));
  const sp = size * .4; toks.forEach(o => o.wd = ctx.measureText(o.txt).width);
  let total = toks.reduce((a, o) => a + o.wd, 0) + sp * (toks.length - 1);
  const fs = total > 960 ? size * 960 / total : size; const sc = fs / size; total *= sc;
  T(() => {
    let x = -total / 2;
    for (const o of toks) {
      const spoken = t >= o.w[1] - .03;
      let col = KEY_R.has(o.k) ? RED : KEY_Y.has(o.k) ? YEL : '#ffffff';
      if (!spoken) col = 'rgba(235,235,235,.55)';
      const ws = spoken ? 1 + .08 * Math.max(0, 1 - (t - o.w[1]) / .12) : 1;
      T(() => text(o.txt, 0, 0, fs, { fill: col, sw: fs * .2, shadow: true }), x + o.wd * sc / 2, 0, ws);
      x += o.wd * sc + sp * sc;
    }
  }, W / 2, y, s);
}
