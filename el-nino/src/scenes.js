// Cenas do vídeo "El Niño" — tempos em segundos do áudio ORIGINAL, convertidos por nt()
let DATA, CHUNKS, SCENES, EVENTS = [], DUR;
const END_CARD = 3.4;

function nt(t) { let a = t; for (const [p, add] of DATA.insertions) if (p <= t + .05) a += add; return a; }

// ---- corte do oceano Pacífico (visto de lado) ----
function oceanSection(p, t, o = {}) {
  const sea = 960, floor = 1640;
  let g = ctx.createLinearGradient(0, 0, 0, sea); g.addColorStop(0, '#3d9be9'); g.addColorStop(1, '#bfe6ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, sea);
  sunChar(900, 470, .55, t, 'happy');
  g = ctx.createLinearGradient(0, sea, 0, floor); g.addColorStop(0, '#1f86d6'); g.addColorStop(1, '#0a2a63');
  ctx.fillStyle = g; ctx.fillRect(0, sea - 40, W, floor - sea + 40);
  const surf = x => { const u = x / W; return sea - 30 * (1 - u) * (1 - p) + 12 * p * Math.exp(-Math.pow((u - .62) / .25, 2)) * -1 + Math.sin(x / 55 + t * 3) * 7; };
  const thick = x => { const u = x / W; const a = 30 + 230 * Math.pow(1 - u, 1.7); const b = 70 + 110 * Math.exp(-Math.pow((u - .62) / .33, 2)); return lerp(a, b, p); };
  // água quente
  ctx.beginPath(); ctx.moveTo(0, surf(0));
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, surf(x));
  for (let x = W; x >= 0; x -= 10) ctx.lineTo(x, surf(x) + thick(x) + Math.sin(x / 80 - t * 2) * 8);
  ctx.closePath();
  g = ctx.createLinearGradient(0, sea - 30, 0, sea + 250); g.addColorStop(0, '#ff6a2b'); g.addColorStop(1, 'rgba(255,170,60,.75)');
  ctx.fillStyle = g; ctx.fill();
  // superfície (linha)
  ctx.beginPath(); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, surf(x)); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  // ressurgência de água fria (só no normal)
  if (p < .9) {
    ctx.save(); ctx.globalAlpha = 1 - p;
    for (let i = 0; i < 3; i++) { const yy = 1480 - ((t * 120 + i * 140) % 420); bigArrow(800 + i * 25, yy, 120, .55, -Math.PI / 2, '#7fd3ff'); }
    ctx.restore();
  }
  // chão do mar
  ctx.beginPath(); ctx.moveTo(0, floor); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, floor - 20 * Math.sin(x / 130)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  fillStroke('#c9a66b', 7);
  // terra à esquerda (Ásia/Austrália) e à direita (América do Sul + Andes)
  ctx.beginPath(); ctx.moveTo(0, 860); ctx.lineTo(70, 870); ctx.quadraticCurveTo(120, 900, 135, 1000); ctx.lineTo(160, H); ctx.lineTo(0, H); ctx.closePath(); fillStroke(landGrad('#4caf50'), 8);
  ctx.beginPath(); ctx.moveTo(W, 700); ctx.lineTo(1030, 760); ctx.lineTo(990, 690); ctx.lineTo(955, 800); ctx.quadraticCurveTo(930, 900, 935, 1000); ctx.lineTo(910, H); ctx.lineTo(W, H); ctx.closePath(); fillStroke(landGrad('#7cb342'), 8);
  ctx.beginPath(); ctx.moveTo(990, 690); ctx.lineTo(1010, 728); ctx.lineTo(970, 742); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  T(() => text('ÁSIA', 0, 0, 46, { sw: 9 }), 70, 1100, 1, -Math.PI / 2);
  T(() => text('AMÉRICA DO SUL', 0, 0, 46, { sw: 9 }), 1000, 1250, 1, -Math.PI / 2);
  // termoclina
  ctx.setLineDash([24, 18]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); for (let x = 140; x <= 930; x += 10) ctx.lineTo(x, surf(x) + thick(x) + 40); ctx.stroke(); ctx.setLineDash([]);
  return { surf, thick };
}

function landGrad(c) { const g = ctx.createLinearGradient(0, 650, 0, H); g.addColorStop(0, c); g.addColorStop(.17, c); g.addColorStop(.2, '#8d6e63'); g.addColorStop(1, '#5d4037'); return g; }
// ---- mapa do Brasil ----
let BR_PROJ;
function brazilMap(t, south = 0, north = 0) {
  if (!BR_PROJ) BR_PROJ = d3.geoMercator().fitExtent([[150, 430], [960, 1560]], BRAZIL);
  const proj = BR_PROJ, path = d3.geoPath(proj, ctx);
  for (const f of COUNTRIES.features) {
    if (f.id === '076') continue; const c = d3.geoCentroid(f); if (c[0] < -90 || c[0] > -30 || c[1] > 15 || c[1] < -60) continue;
    ctx.beginPath(); path(f); ctx.fillStyle = '#e8dcb5'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#a89a72'; ctx.stroke();
  }
  ctx.save(); ctx.translate(10, 18); ctx.beginPath(); path(BRAZIL); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill(); ctx.restore();
  ctx.beginPath(); path(BRAZIL); ctx.fillStyle = radial(560, 900, 600, '#6fd37a', '#2c9a3e'); ctx.fill();
  ctx.save(); ctx.beginPath(); path(BRAZIL); ctx.clip();
  if (south > 0) {
    const y = proj([-50, -23])[1]; ctx.fillStyle = `rgba(40,110,230,${.75 * south})`; ctx.fillRect(0, y, W, H);
    ctx.strokeStyle = `rgba(200,230,255,${.8 * south})`; ctx.lineWidth = 6;
    for (let i = 0; i < 30; i++) { const px = hash(i) * W, pp = (t * 1.8 + hash(i + 1)) % 1, py = y - 60 + pp * 420; line(px, py, px - 10, py + 35); }
  }
  if (north > 0) {
    const y = proj([-50, -11])[1]; ctx.fillStyle = `rgba(214,120,40,${.8 * north})`; ctx.fillRect(0, 0, W, y);
    ctx.strokeStyle = `rgba(90,40,10,${.6 * north})`; ctx.lineWidth = 5; // rachaduras
    for (let i = 0; i < 26; i++) { const px = 150 + hash(i + 20) * 800, py = 450 + hash(i + 30) * (y - 450); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 25, py + 14); ctx.lineTo(px + 18, py + 40); ctx.moveTo(px + 25, py + 14); ctx.lineTo(px + 55, py + 6); ctx.stroke(); }
  }
  ctx.restore();
  ctx.beginPath(); path(BRAZIL); ctx.lineWidth = 9; ctx.strokeStyle = OUT; ctx.stroke();
  return proj;
}

function underwater(t, warm = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#2fb6e8', '#f0a040', warm * .6)); g.addColorStop(.5, mix('#1172b8', '#c9603a', warm * .35)); g.addColorStop(1, '#082a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) { const x = 100 + i * 220 + Math.sin(t + i) * 30; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 260, H); ctx.lineTo(x + 140, H); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(0, 1650); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 1650 - 30 * Math.sin(x / 150)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); fillStroke('#d8b980', 7);
  seaweed(90, 1660, 330, t); seaweed(160, 1670, 230, t, '#3fc45a'); seaweed(960, 1650, 380, t); seaweed(1020, 1660, 250, t, '#26a046');
  ball(330, 1650, 60, '#ff6f91', 7); ball(390, 1665, 45, '#ff9671', 7); ball(760, 1655, 55, '#c86bfa', 7);
  bubbles(t);
}
function heatCity(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 1500); g.addColorStop(0, '#ff7b2e'); g.addColorStop(1, '#ffd27a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(160,60,20,.35)';
  const B = [[0, 360, 140], [150, 470, 120], [280, 300, 160], [460, 520, 130], [600, 380, 150], [760, 480, 120], [890, 340, 190]];
  for (const [x, h, w] of B) { ctx.fillRect(x, 1500 - h, w, h); }
  ctx.fillStyle = 'rgba(255,240,200,.35)'; for (const [x, h, w] of B) for (let r = 0; r < h / 80 - 1; r++) for (let c = 0; c < 3; c++) ctx.fillRect(x + 18 + c * (w - 36) / 3, 1500 - h + 30 + r * 80, (w - 36) / 3 - 14, 40);
  let gg = ctx.createLinearGradient(0, 1500, 0, H); gg.addColorStop(0, '#8d6e63'); gg.addColorStop(1, '#4e342e'); ctx.fillStyle = gg; ctx.fillRect(0, 1500, W, H);
  // ondas de calor
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 6;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); const y0 = 900 + i * 100; for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + Math.sin(x / 50 + t * 4 + i) * 12); ctx.stroke(); }
}
function field(t, wilt) {
  bgSky('#ffb347', '#ffe2a8', '#a1887f', t, 1180);
  sunChar(820, 560, .9, t, 'angry', '#ffb000');
  ctx.fillStyle = '#8d6e63';
  for (let r = 0; r < 5; r++) {
    const y = 1260 + r * 130, s = .6 + r * .18;
    ctx.fillStyle = 'rgba(90,55,30,.5)'; ctx.fillRect(0, y + 20 * s, W, 16 * s);
    for (let i = 0; i < 6; i++) {
      const x = 90 + i * 180 + (r % 2) * 60, bend = wilt * (1.1 + hash(i + r * 7) * .5);
      T(() => {
        const col = mix('#2fb24a', '#a0782e', clamp(wilt * 1.2));
        ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0, -70, 60 * bend, -120 + 60 * bend); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.stroke();
        for (const sd of [-1, 1]) { ellipse(sd * 30 + 10 * bend, -70 + 20 * bend, 32, 14, sd * (.5 + bend)); fillStroke(col, 5); }
        if (r > 1) { ball(60 * bend, -125 + 60 * bend, 20, mix('#ffd21f', '#8a6a2a', wilt), 5); }
      }, x, y, s);
    }
  }
}
function forest(t, fire) {
  bgSky('#4a2c2a', '#ff7043', '#5d4037', t, 1300);
  ctx.fillStyle = 'rgba(80,80,80,.5)';
  for (let i = 0; i < 14; i++) { const p = (t * .15 + hash(i)) % 1; circle(hash(i + 3) * W + p * 120, 1250 - p * 1000, 60 + p * 160); ctx.fill(); }
  const trees = [[110, 1330, .9], [330, 1310, 1.1], [560, 1340, .95], [790, 1300, 1.2], [990, 1330, .9], [220, 1520, 1.2], [470, 1560, 1.35], [740, 1540, 1.25], [980, 1560, 1.1]];
  trees.forEach(([x, y, s], i) => {
    const b = clamp(fire * 1.6 - hash(i) * .6);
    tree(x, y, s, t, { burnt: b * .8 });
    if (b > .05) { flame(x - 40 * s, y - 230 * s, s * .9 * b, t, i); flame(x + 45 * s, y - 260 * s, s * .8 * b, t, i + 5); flame(x, y - 330 * s, s * 1.1 * b, t, i + 9); }
  });
  ctx.fillStyle = 'rgba(255,120,40,.12)'; ctx.fillRect(0, 0, W, H);
}

// ---- legenda superior / HUD / badge ----
function drawTitle(sc, gt) {
  if (!sc.title) return;
  const prev = SCENES[SCENES.indexOf(sc) - 1];
  let lt = gt - sc.start;
  if (prev && prev.title === sc.title) lt = 9;
  const size = fitSize(sc.title, 118, 980);
  T(() => text(sc.title, 0, 0, size, { fill: sc.tc || '#fff', sw: size * .19 }), W / 2, 250, popS(lt, .3));
}
const CHAPTERS = ['COMO COMEÇA', 'O CLIMA MUDA', 'OS ESTRAGOS', 'O MAIS INCRÍVEL'];
function chapterAt(gt) { let k = 0; DATA.chapters.slice(0, 4).forEach((c, i) => { if (gt >= c - .1) k = i + 1; }); return k; }
function drawHUD(gt) {
  const k = chapterAt(gt); if (!k || gt > DUR) return;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(40, 52, 200, 58, 29); ctx.fill();
  circle(72, 81, 10); ctx.fillStyle = '#3ddc5b'; ctx.fill();
  text('PARTE ' + k, 150, 83, 36, { sw: 0, shadow: false });
  for (let i = 0; i < 4; i++) { circle(275 + i * 34, 81, 11); ctx.fillStyle = i < k ? YEL : 'rgba(255,255,255,.35)'; ctx.fill(); }
}
function drawBadge(gt) {
  for (let i = 0; i < 4; i++) {
    const lt = gt - (DATA.chapters[i] - .1);
    if (lt < 0 || lt > 1.5) continue;
    const s = popS(lt, .3) * (lt > 1.3 ? 1 - (lt - 1.3) / .2 : 1);
    T(() => {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-200, -72 + 12, 400, 150, 26); ctx.fill();
      rr(-210, -82, 420, 150, 26); const g = ctx.createLinearGradient(0, -82, 0, 68); g.addColorStop(0, '#3ccf55'); g.addColorStop(1, '#1d8f35'); fillStroke(g, 9, '#0d3d18');
      text('PARTE ' + (i + 1), 0, -14, 96, { fill: YEL, sw: 14 });
      text(CHAPTERS[i], 0, 120, 54, { sw: 11 });
    }, W / 2, 250, s);
    return true;
  }
  return false;
}

// ---- definição das cenas ----
function S(t0, title, tc, draw, extra = {}) { return Object.assign({ t0, title, tc, draw }, extra); }
const at = (o) => nt(o); // atalho: tempo original -> novo

function defineScenes() {
  const L = [];
  // 1 — gancho
  L.push(S(0, 'OCEANO COM FEBRE?', YEL, (lt, gt) => {
    bgRays('#ff9a3d', '#b3261e', gt);
    const s = popS(lt, .45);
    T(() => { globe(0, 0, 330, 130 + gt * 10, { heat: .9, faceExpr: 'sick', t: gt }); thermometer(150, 210, .55, .9, { rot: -.9 }); sweat(-300, -150, 1.4, gt); sweat(290, -220, 1.2, gt + .5, 3); }, W / 2, 860, s);
  }));
  // 2 — parece impossível
  L.push(S(2.12, 'PARECE IMPOSSÍVEL', '#fff', (lt, gt) => {
    bgRays('#ff9a3d', '#b3261e', gt);
    T(() => { globe(0, 0, 330, 130 + gt * 10, { heat: .9, faceExpr: 'shock', t: gt }); }, W / 2, 900, 1 + .02 * Math.sin(gt * 20) * Math.max(0, 1 - lt));
    stamp('IMPOSSÍVEL?', W / 2, 520, -.12, RED, gt - at(2.4));
  }, { sfx: [['stamp', 2.4]] }));
  // 3 — existe um fenômeno
  L.push(S(3.5, 'UM FENÔMENO REAL', YEL, (lt, gt) => {
    bgRays('#2f6fd6', '#0d2a66', gt);
    const heat = eo((gt - at(5.2)) / 1.6);
    globe(W / 2, 880, 360, 150 - lt * 6, { heat: Math.max(.15, heat), t: gt });
    if (gt > at(5.34)) thermometer(900, 760, .7 * popS(gt - at(5.34)), .3 + .6 * heat);
    if (gt > at(6.34)) T(() => pill('PACÍFICO', 0, 0, 52, '#ff6a2b'), 330, 560, popS(gt - at(6.34)));
  }, { sfx: [['pop', 5.34], ['pop', 6.34]] }));
  // 4 — mudanças em vários continentes
  L.push(S(7.36, 'VÁRIOS CONTINENTES', '#fff', (lt, gt) => {
    bgRays('#1e8a7a', '#0b3b3a', gt);
    const proj = worldMap(40, 640, 1040, 1180, -10, { heat: .8 });
    const icons = [[8.4, -60, -10, 'rain'], [8.9, 20, 8, 'sun'], [9.54, 134, -25, 'fire'], [10.02, 100, 22, 'rain'], [10.36, -100, 38, 'sun']];
    for (const [ot, lon, lat, k] of icons) {
      const [x, y] = proj([lon, lat]), s = popS(gt - at(ot));
      if (k === 'rain') cloudChar(x, y - 40, .55 * s, { t: gt, rain: 1, expr: 'sad', col: '#cfd8e3' });
      if (k === 'sun') sunChar(x, y - 20, .42 * s, gt, 'hot');
      if (k === 'fire') flame(x, y + 20, .75 * s, gt, lon);
    }
  }, { sfx: [['pop', 8.4], ['pop', 8.9], ['pop', 9.54], ['pop', 10.02], ['pop', 10.36]] }));
  // 5 — ele se chama El Niño
  L.push(S(11.58, 'ELE SE CHAMA...', '#fff', (lt, gt) => {
    bgRays('#ff5a36', '#7a0f12', gt);
    const s = popS(gt - at(12.4), .4);
    T(() => {
      const g = ctx.createLinearGradient(0, -130, 0, 130); g.addColorStop(0, '#fff176'); g.addColorStop(1, '#ff9800');
      text('EL NIÑO', 0, 0, 330, { fill: g, sw: 52 });
    }, W / 2, 860, s, -.04);
    if (gt > at(12.4) + .25) T(() => pill('"O MENINO", EM ESPANHOL', 0, 0, 54, '#202432'), W / 2, 1080, popS(gt - at(12.4) - .25));
  }, { sfx: [['boom', 12.4]] }));

  // ===== PARTE 1 =====
  L.push(S(13.26, 'OCEANO PACÍFICO', '#fff', (lt, gt) => {
    const z = 1 + .05 * eio(lt / 2);
    T(() => { ctx.translate(-W / 2, -H / 2); oceanSection(0, gt); }, W / 2, H / 2, z);
    T(() => pill('O MAIOR OCEANO DO MUNDO', 0, 0, 44, '#1d4e89'), W / 2, 1460, popS(gt - at(14.16)));
  }, { sfx: [['ding', 13.26]] }));
  L.push(S(15.48, 'SITUAÇÃO NORMAL', '#7CFF8A', (lt, gt) => {
    oceanSection(0, gt);
    const s = popS(gt - at(16.5));
    cloudChar(820, 640, .8 * s, { blow: 1, t: gt, expr: 'normal' });
    cloudChar(470, 560, .65 * s, { blow: 1, t: gt + .3, expr: 'normal' });
    if (gt > at(16.84)) for (let i = 0; i < 2; i++) { const p = ((gt - at(16.84)) * .6 + i * .5) % 1; bigArrow(lerp(820, 230, p), 860 - i * 10, 200, .8, Math.PI, '#ffffff'); }
    if (gt > at(19.2)) T(() => pill('ÁGUA QUENTE NA ÁSIA', 0, 0, 46, '#ff6a2b'), 400, 1330, popS(gt - at(19.2)));
  }, { sfx: [['whoosh2', 16.5], ['pop', 19.2]] }));
  L.push(S(19.9, 'VENTOS FRACOS', '#ffb347', (lt, gt) => {
    oceanSection(.05 * eo(lt), gt);
    const w = 1 - .75 * eo((gt - at(21.5)) / .8);
    cloudChar(820, 640, .8, { blow: w, t: gt, expr: gt > at(21.5) ? 'tired' : 'normal', sweatOn: gt > at(21.5) });
    cloudChar(470, 560, .65, { blow: w, t: gt + .3, expr: gt > at(21.5) ? 'tired' : 'normal', sweatOn: gt > at(21.5) });
    bigArrow(lerp(700, 400, (gt * .4) % 1), 860, 200 * w + 60, .8 * w + .2, Math.PI, '#ffffff');
    stamp('ENFRAQUECEM!', W / 2, 1420, .08, RED, gt - at(21.5));
  }, { sfx: [['stamp', 21.5]] }));
  L.push(S(22.6, 'ÁGUA QUENTE VOLTA', '#ff8a3d', (lt, gt) => {
    const p = .05 + .95 * eio((gt - at(23.3)) / 3.2);
    oceanSection(p, gt);
    cloudChar(820, 640, .7, { blow: .2, t: gt, expr: 'tired' });
    cloudChar(470, 560, .55, { blow: .2, t: gt + .3, expr: 'tired' });
    if (gt > at(23.3)) bigArrow(lerp(300, 700, ((gt - at(23.3)) * .5) % 1), 1080, 260, .9, 0, '#ff8a3d');
    if (gt > at(25.02)) T(() => pill('CENTRAL', 0, 0, 46, '#202432'), 520, 1400, popS(gt - at(25.02)));
    if (gt > at(25.78)) T(() => pill('ORIENTAL', 0, 0, 46, '#202432'), 790, 1500, popS(gt - at(25.78)));
  }, { sfx: [['whoosh2', 23.3], ['pop', 25.02], ['pop', 25.78]] }));
  L.push(S(26.92, 'AÍ FICA INTERESSANTE', YEL, (lt, gt) => {
    bgRays('#5b3fd1', '#1d1050', gt);
    person(W / 2, 1720, 1.2, { shirt: '#3a86ff', coat: true, glasses: true, hairStyle: 'sides', hair: '#9e9e9e', expr: gt > at(28.82) ? 'shock' : 'normal', arms: gt > at(28.82) ? ['up', 'up'] : ['hips', 'point'], t: gt, skin: '#e0ac69' });
    if (gt > at(28.82)) lightbulb(W / 2 + 290, 640, .9 * popS(gt - at(28.82)), gt);
  }, { sfx: [['ding', 28.82]] }));

  // ===== PARTE 2 =====
  L.push(S(30.08, 'MUDA A ATMOSFERA', '#fff', (lt, gt) => {
    bgRays('#1b4b8f', '#071a3a', gt);
    const cx = W / 2, cy = 880;
    globe(cx, cy, 300, 120 + gt * 8, { heat: .9, t: gt });
    // circulação do ar (setas girando)
    const spin = gt * 1.6, sp = eo((gt - at(31.04)) / .6);
    ctx.save(); ctx.globalAlpha = sp;
    for (let i = 0; i < 3; i++) {
      const a0 = spin + i * Math.PI * 2 / 3;
      ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, 410, a0, a0 + 1.4); ctx.stroke();
      ctx.lineWidth = 12; ctx.strokeStyle = '#9be7ff'; ctx.beginPath(); ctx.arc(cx, cy, 410, a0, a0 + 1.4); ctx.stroke();
      const ax = cx + Math.cos(a0 + 1.4) * 410, ay = cy + Math.sin(a0 + 1.4) * 410;
      T(() => { ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-25, -32); ctx.lineTo(-25, 32); ctx.closePath(); fillStroke('#9be7ff', 7); }, ax, ay, 1, a0 + 1.4 + Math.PI / 2);
    }
    ctx.restore();
    cloudChar(cx - 330, cy - 380, .55 * popS(gt - at(32.58)), { t: gt, expr: 'shock' });
    cloudChar(cx + 330, cy + 380, .5 * popS(gt - at(32.58) - .1), { t: gt + 1, expr: 'worry', flip: true });
  }, { sfx: [['whoosh2', 31.04], ['pop', 32.58]] }));
  L.push(S(33.26, 'CHUVAS FORA DO LUGAR', '#9be7ff', (lt, gt) => {
    bgRays('#1b4b8f', '#071a3a', gt);
    const proj = worldMap(40, 650, 1040, 1190, -10, { heat: .8 });
    const moves = [[[-75, 5], [-50, -25]], [[110, 0], [150, -25]], [[20, 10], [35, -10]], [[-100, 30], [-90, 42]]];
    moves.forEach(([a, b], i) => {
      const p = eio((gt - at(33.68) - i * .2) / 1.4);
      const A = proj(a), B = proj(b);
      ctx.setLineDash([18, 14]); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.7)'; line(A[0], A[1], lerp(A[0], B[0], p), lerp(A[1], B[1], p)); ctx.setLineDash([]);
      cloudChar(lerp(A[0], B[0], p), lerp(A[1], B[1], p) - 40, .45 * popS(gt - at(33.26) - i * .1), { t: gt + i, rain: 1, expr: 'worry', col: '#dfe7ef' });
    });
  }, { sfx: [['whoosh2', 33.68]] }));
  L.push(S(36.62, 'BRASIL: SUL', YEL, (lt, gt) => {
    bgRays('#1565c0', '#0a2a5c', gt);
    const south = eo((gt - at(39.68)) / .6);
    const proj = brazilMap(gt, south, 0);
    const [x, y] = proj([-52, -27]);
    cloudChar(x + 60, y - 120, .8 * popS(gt - at(39.0)), { t: gt, rain: south, expr: 'angry', col: '#9fb2c8' });
    stamp('CHUVA INTENSA', W / 2, 1650, -.08, '#1565c0', gt - at(40.14));
  }, { sfx: [['rain', 39.68], ['stamp', 40.14]] }));
  L.push(S(41.44, 'NORTE E NORDESTE', '#ffb347', (lt, gt) => {
    bgRays('#1565c0', '#0a2a5c', gt);
    const north = eo((gt - at(42.92)) / .6);
    const proj = brazilMap(gt, 1, north);
    const [x, y] = proj([-50, -3]);
    sunChar(x + 30, y - 60, .75 * popS(gt - at(42.46)), gt, 'angry', '#ffb000');
    stamp('SECA', 300, 1650, -.12, RED, gt - at(42.92));
  }, { sfx: [['pop', 42.46], ['stamp', 42.92]] }));

  // ===== PARTE 3 =====
  L.push(S(45.4, 'ONDAS DE CALOR', '#ff3b30', (lt, gt) => {
    heatCity(gt);
    sunChar(W / 2, 560, 1.05 * popS(lt, .4), gt, 'angry', '#ffb000');
    person(400, 1800, 1.3, { shirt: '#e63946', expr: 'hot', arms: ['face', 'down'], sweat: true, t: gt, skin: '#c68642', hairStyle: 'curly', hair: '#1b1b1b' });
    thermometer(870, 1420, 1.0 * popS(gt - at(48.34)), .4 + .55 * eo((gt - at(48.34)) / 1));
  }, { sfx: [['pop', 48.34]] }));
  L.push(S(49.4, 'PLANTAÇÕES', '#ffd21f', (lt, gt) => {
    field(gt, eo((gt - at(49.4)) / 1.2));
    person(250, 1790, 1.2, { shirt: '#6d4c41', hat: true, expr: 'sad', arms: ['face', 'down'], t: gt, skin: '#e0ac69', hairStyle: 'none' });
  }));
  L.push(S(50.64, 'INCÊNDIOS FLORESTAIS', '#ff3b30', (lt, gt) => {
    forest(gt, eo((gt - at(51.38)) / 1.4));
    stamp('PERIGO!', W / 2, 560, -.1, RED, gt - at(52.54));
  }, { sfx: [['fire', 51.38], ['stamp', 52.54]] }));
  L.push(S(53.72, 'NÃO SÓ NÓS...', '#fff', (lt, gt) => {
    bgRays('#127a8a', '#063840', gt);
    const s = popS(lt - .1, .35), sw = gt > at(56.32);
    person(215, 1660, 1.0 * s, { shirt: '#ff5fa2', expr: sw ? 'sad' : 'worry', arms: 'down', t: gt, skin: '#f2c39b', hairStyle: 'long', hair: '#5a3825', sweat: sw, seed: 1 });
    person(540, 1700, 1.1 * s, { shirt: '#ffd21f', expr: sw ? 'sad' : 'worry', arms: 'down', t: gt, skin: '#8d5524', hairStyle: 'short', hair: '#111', sweat: sw, seed: 2 });
    person(865, 1660, 1.0 * s, { shirt: '#3a86ff', expr: sw ? 'sad' : 'worry', arms: 'down', t: gt, skin: '#e0ac69', hairStyle: 'bald', sweat: sw, seed: 3 });
    if (gt > at(56.76)) { const p = popS(gt - at(56.76)); fish(W / 2 + 40, 640, .9 * p, gt, { col: '#ff8c42', expr: 'sad', sweatOn: true }); text('?', W / 2 + 230, 520, 140 * p, { fill: YEL }); }
  }, { sfx: [['pop', 54.0], ['pop', 56.76]] }));
  L.push(S(57.54, 'VIDA MARINHA', '#7fd3ff', (lt, gt) => {
    const warm = eo((gt - at(57.7)) / 2);
    underwater(gt, warm);
    fish(560 + Math.sin(gt) * 40, 950, 1.3, gt, { col: '#ff8c42', expr: gt > at(59.56) ? 'sick' : 'normal', sweatOn: gt > at(59.56) });
    fish(260 + Math.sin(gt + 2) * 30, 1420, .7, gt, { col: '#ffd166', expr: 'sad', flip: true, seed: 2 });
    fish(860, 1400, .6, gt, { col: '#06d6a0', expr: 'sad', seed: 4, sweatOn: true });
    thermometer(930, 760, .8 * popS(gt - at(57.7)), .3 + .6 * warm);
  }, { sfx: [['pop', 57.7]] }));
  L.push(S(61.4, 'MENOS NUTRIENTES', '#ffd21f', (lt, gt) => {
    underwater(gt, .8);
    const fade = eo((gt - at(62.02)) / 1.6);
    for (let i = 0; i < 46; i++) {
      const a = (1 - fade) * (hash(i) > fade * .4 ? 1 : 0); if (a <= 0) continue;
      const x = hash(i + 60) * W + Math.sin(gt + i) * 20, y = 500 + hash(i + 70) * 1050 + Math.cos(gt * .8 + i) * 20;
      ctx.globalAlpha = a; ball(x, y, 12 + hash(i) * 10, '#9cff57', 4); ctx.globalAlpha = 1;
    }
    fish(540, 1050, 1.1, gt, { col: '#ff8c42', expr: 'sad' });
    counterBox('NUTRIENTES ▼', 'COMIDA DOS PEIXES', W / 2, 1500, gt - at(63.22), RED);
  }, { sfx: [['pop', 63.22]] }));
  L.push(S(63.82, 'ESPÉCIES EM RISCO', '#ff3b30', (lt, gt) => {
    underwater(gt, .9);
    const p = eio((gt - at(64.28)) / 2.6);
    for (let i = 0; i < 5; i++) fish(lerp(200 + i * 160, 1300 + i * 120, p), 700 + i * 170 + Math.sin(gt * 2 + i) * 20, .6, gt, { col: '#4cc9f0', expr: 'worry', flip: true, seed: i });
    T(() => pill('PRECISAM DE ÁGUA FRIA', 0, 0, 46, '#1565c0'), W / 2, 600, popS(gt - at(66.32)));
    stamp('EM RISCO', W / 2, 1520, -.08, RED, gt - at(64.78));
  }, { sfx: [['whoosh2', 64.28], ['stamp', 64.78], ['pop', 66.32]] }));

  // ===== PARTE 4 =====
  L.push(S(67.88, 'O MAIS IMPRESSIONANTE', YEL, (lt, gt) => {
    bgRays('#6a2fd1', '#1c0a45', gt);
    person(W / 2, 1720, 1.2, { shirt: '#3a86ff', coat: true, glasses: true, hairStyle: 'sides', hair: '#9e9e9e', expr: 'shock', arms: ['up', 'up'], t: gt, skin: '#e0ac69' });
    if (gt > at(68.58)) T(() => text('?!', 0, 0, 220, { fill: YEL, sw: 34 }), W / 2 + 300, 650, popS(gt - at(68.58)), .15);
  }, { sfx: [['ding', 67.88], ['pop', 68.58]] }));
  L.push(S(70.32, 'NÃO É O PLANETA TODO', '#fff', (lt, gt) => {
    bgRays('#2f6fd6', '#0d2a66', gt);
    globe(W / 2, 900, 360, 118, { heat: .55 + .08 * Math.sin(gt * 6), heatR: 18, t: gt });
    if (gt > at(71.68)) T(() => { ctx.strokeStyle = RED; ctx.lineWidth = 30; ctx.lineCap = 'round'; line(-120, -120, 120, 120); line(120, -120, -120, 120); }, 860, 560, popS(gt - at(71.68)) * .8);
    if (gt > at(72.8)) { T(() => pill('SÓ AQUI!', 0, 0, 56, RED), 300, 1520, popS(gt - at(72.8))); }
  }, { sfx: [['stamp', 71.68], ['pop', 72.8]] }));
  L.push(S(74.52, 'SÓ UMA REGIÃO', '#ff8a3d', (lt, gt) => {
    bgRays('#2f6fd6', '#0d2a66', gt);
    const z = 1 + .6 * eio(lt / 1.5);
    T(() => globe(0, 0, 360, 118, { heat: .6 + .08 * Math.sin(gt * 6), heatR: 18, t: gt }), W / 2, 900 + 120 * eio(lt / 1.5), z);
    magnifier(W / 2 + 20 + Math.sin(gt * 2) * 20, 880, 1.1 * popS(gt - at(75.7)), -.5);
    stamp('JÁ É SUFICIENTE', W / 2, 1520, -.06, '#1d8f35', gt - at(77.72));
  }, { sfx: [['pop', 75.7], ['stamp', 77.72]] }));
  L.push(S(78.4, 'MILHARES DE KM', YEL, (lt, gt) => {
    bgRays('#1e8a7a', '#0b3b3a', gt);
    const proj = worldMap(30, 640, 1050, 1190, 160, { heat: .8 });
    const src = [-118, 0], targets = [[-50, -12], [25, -20], [134, -25], [78, 22], [-98, 38], [20, 12]];
    targets.forEach((tg, i) => {
      const p = eio((gt - at(78.78) - i * .18) / 1.1); if (p <= 0) return;
      const ip = d3.geoInterpolate(src, tg);
      ctx.beginPath(); for (let k = 0; k <= 40 * p; k++) { const pt = proj(ip(k / 40)); ctx.lineTo(pt[0], pt[1]); }
      ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = YEL; ctx.stroke();
      if (p >= 1) { const [x, y] = proj(tg); const ps = popS(gt - at(78.78) - i * .18 - 1.1); circle(x, y, 18 * ps); fillStroke(RED, 6); }
    });
    const km = Math.round(clamp((gt - at(80.18)) / 1.8) * 15000);
    if (gt > at(80.18)) counterBox(km.toLocaleString('pt-BR') + ' KM', 'DE DISTÂNCIA', W / 2, 1470, gt - at(80.18));
  }, { sfx: [['whoosh2', 78.78], ['pop', 80.18]] }));
  L.push(S(83.12, 'O PLANETA COM FEBRE', '#ff8a3d', (lt, gt) => {
    bgRays('#ff9a3d', '#b3261e', gt);
    const shake = Math.sin(gt * 40) * 4 * clamp((gt - at(86.38)) / .3);
    T(() => {
      globe(0, 0, 330, 130 + gt * 10, { heat: 1, faceExpr: 'sick', t: gt });
      thermometer(150, 210, .55, .95, { rot: -.9 });
      sweat(-300, -150, 1.4, gt); sweat(290, -220, 1.2, gt + .5, 3);
    }, W / 2 + shake, 880, popS(lt, .45));
    const orb = [['rain', 0], ['sun', 1], ['fire', 2], ['fish', 3]];
    orb.forEach(([k, i]) => {
      const a = gt * .9 + i * Math.PI / 2, x = W / 2 + Math.cos(a) * 450, y = 880 + Math.sin(a) * 470, s = popS(gt - at(87.76) - i * .08);
      if (k === 'rain') cloudChar(x, y, .4 * s, { t: gt, rain: 1, expr: 'sad', col: '#dfe7ef' });
      if (k === 'sun') sunChar(x, y, .32 * s, gt, 'hot');
      if (k === 'fire') flame(x, y + 40, .6 * s, gt, 3);
      if (k === 'fish') fish(x, y, .45 * s, gt, { col: '#ff8c42', expr: 'sick' });
    });
  }, { sfx: [['pop', 87.76]] }));
  // tela final
  L.push(S(null, 'E VOCÊ?', YEL, (lt, gt) => {
    bgRays('#6a2fd1', '#1c0a45', gt);
    person(W / 2, 1640, 1.15, { shirt: '#2f9e44', expr: 'happy', arms: ['down', 'wave'], t: gt, skin: '#8d5524', hairStyle: 'short', hair: '#111' });
    T(() => pill('CHUVA', 0, 0, 60, '#1e88e5'), 260, 520, popS(lt - .3));
    T(() => pill('SECA', 0, 0, 60, '#f4511e'), 820, 520, popS(lt - .45));
    text('JÁ SENTIU O EL NIÑO AÍ?', W / 2, 1290, fitSize('JÁ SENTIU O EL NIÑO AÍ?', 92, 960), { alpha: clamp(lt / .2) });
    const tap = lt - 1.4, on = tap > 0;
    T(() => {
      rr(-210, -62, 420, 124, 62); fillStroke(on ? '#3a3a3a' : '#ff2d55', 0); ctx.fillStyle = on ? '#3a3a3a' : '#ff2d55'; ctx.fill();
      text(on ? 'SEGUINDO' : 'SEGUIR', 0, 4, 64, { sw: 0, shadow: false });
    }, W / 2, 1480, popS(lt - .8) * (on && tap < .15 ? .92 : 1));
    // mão tocando
    const hx = W / 2 + 150 + lerp(260, 0, eio((lt - .9) / .5)), hy = 1580 + lerp(300, 0, eio((lt - .9) / .5));
    if (lt > .9) T(() => { rr(-34, -40, 68, 330, 34); fillStroke('#f2c39b', 8); ellipse(-5, -40, 28, 22); fillStroke('#ffd9c2', 5); }, hx, hy, on && tap < .15 ? .95 : 1, -.5);
  }, { sfx: [['ding', -1], ['click', -2]] }));
  return L;
}

function init(data, topo) {
  DATA = data;
  LAND = topojson.feature(topo, topo.objects.land);
  COUNTRIES = topojson.feature(topo, topo.objects.countries);
  BRAZIL = COUNTRIES.features.find(f => f.id === '076');
  CHUNKS = buildChunks(DATA.words);
  DUR = DATA.duration;
  SCENES = defineScenes();
  SCENES.forEach((s, i) => { s.start = s.t0 === null ? DUR + .1 : (i === 0 ? 0 : nt(s.t0) - .08); });
  SCENES.forEach((s, i) => { s.end = SCENES[i + 1] ? SCENES[i + 1].start : DUR + .1 + END_CARD; });
  EVENTS = [];
  SCENES.forEach((s, i) => {
    if (i > 0) EVENTS.push(['whoosh', s.start]);
    for (const [k, ot] of (s.sfx || [])) {
      if (ot === -1) EVENTS.push([k, s.start + .3]); else if (ot === -2) EVENTS.push([k, s.start + 1.4]);
      else EVENTS.push([k, nt(ot)]);
    }
  });
  return { total: DUR + .1 + END_CARD, events: EVENTS, scenes: SCENES.map(s => [s.title, +s.start.toFixed(2)]) };
}

function render(gt) {
  const sc = SCENES.find(s => gt >= s.start && gt < s.end) || SCENES[SCENES.length - 1];
  const lt = gt - sc.start;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
  ctx.clearRect(0, 0, W, H);
  sc.draw(lt, gt);
  ctx.restore();
  // vinheta
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!drawBadge(gt)) drawTitle(sc, gt);
  drawHUD(gt);
  drawSubtitle(CHUNKS, gt);
  // flash curto em cada corte
  if (lt < .08 && sc !== SCENES[0]) { ctx.fillStyle = `rgba(255,255,255,${.35 * (1 - lt / .08)})`; ctx.fillRect(0, 0, W, H); }
}
window.init = init; window.render = render;
