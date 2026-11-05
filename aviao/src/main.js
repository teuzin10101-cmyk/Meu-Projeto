// "Como um avião consegue voar?" — animação 3D low-poly (three.js) + legendas
import * as THREE from '../node_modules/three/build/three.module.js';

const W = 1080, H = 1920;
const out = document.getElementById('c'); out.width = W; out.height = H;
const ctx = out.getContext('2d');
const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
const R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(42, W / H, .1, 3000);
scene.add(new THREE.HemisphereLight(0xe3f1ff, 0x6b8f4e, 1.35));
const sun = new THREE.DirectionalLight(0xfff6e8, 2.7);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 160 });
sun.shadow.bias = -0.0006; scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog(0xcfe8ff, 80, 520);

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eob = t => { t = clamp(t); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const popS = (lt, d = .3) => lt < 0 ? 0 : eob(lt / d);
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .8, metalness: 0 }, o));
function mesh(geo, mat, cast = true, recv = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
function at(m, x, y, z) { m.position.set(x, y, z); return m; }

// ---------- avião ----------
const MAT = { white: M('#f5f7fa', { roughness: .5 }), blue: M('#1e6fd9'), dark: M('#263238', { roughness: .3 }), gray: M('#9aa7b1'), lgray: M('#cfd8dc'), red: M('#e53935'), yellow: M('#ffc928') };
function planform(pts, sign, thick) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y * sign) : s.moveTo(x, y * sign));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); return g;
}
const plane = new THREE.Group(); scene.add(plane);
const P = {}; // partes nomeadas
{
  const fus = mesh(new THREE.CylinderGeometry(.6, .6, 5.2, 18), MAT.white); fus.rotation.z = Math.PI / 2; plane.add(fus);
  const nose = mesh(new THREE.SphereGeometry(.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.white); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 1.7, 1); at(nose, 2.6, 0, 0); plane.add(nose);
  const tail = mesh(new THREE.CylinderGeometry(.18, .6, 2.0, 18), MAT.white); tail.rotation.z = Math.PI / 2; at(tail, -3.6, .12, 0); tail.rotation.y = 0; plane.add(tail);
  const tailTip = mesh(new THREE.SphereGeometry(.18, 10, 8), MAT.white); at(tailTip, -4.6, .2, 0); plane.add(tailTip);
  // faixa azul + janelas
  for (const z of [-1, 1]) {
    const st = mesh(new THREE.BoxGeometry(5.6, .1, .02), MAT.blue); at(st, -.2, -.12, z * .6); plane.add(st);
    for (let x = -2.2; x <= 2.0; x += .34) { const w = mesh(new THREE.BoxGeometry(.15, .17, .03), MAT.dark, false); at(w, x, .14, z * .597); plane.add(w); }
    const cw = mesh(new THREE.BoxGeometry(.5, .16, .05), MAT.dark, false); at(cw, 3.25, .22, z * .3); cw.rotation.y = z * -.6; cw.rotation.z = -.35; plane.add(cw);
  }
  // asas
  const wingPts = [[.95, 0], [-1.15, 4.0], [-1.75, 4.0], [-.95, 0]];
  P.wings = [];
  for (const s of [1, -1]) {
    const w = mesh(planform(wingPts, s, .13), MAT.lgray); at(w, 0, -.33, 0); w.rotation.x = s * -.06; plane.add(w); P.wings.push(w);
    const wl = mesh(new THREE.BoxGeometry(.5, .6, .05), MAT.blue); at(wl, -1.5, .0, -s * 4.0); wl.rotation.z = .3; plane.add(wl);
    // estabilizador horizontal
    const hs = mesh(planform([[-3.7, 0], [-4.5, 1.6], [-4.85, 1.6], [-4.6, 0]], s, .08), MAT.lgray); at(hs, 0, .15, 0); plane.add(hs);
  }
  // deriva (vertical)
  const fs = new THREE.Shape(); [[-3.4, .3], [-4.4, 2.1], [-4.95, 2.1], [-4.75, .3]].forEach(([x, y], i) => i ? fs.lineTo(x, y) : fs.moveTo(x, y));
  const fg = new THREE.ExtrudeGeometry(fs, { depth: .1, bevelEnabled: false }); fg.translate(0, 0, -.05);
  plane.add(mesh(fg, MAT.blue));
  // motores
  P.fans = []; P.engines = [];
  for (const s of [1, -1]) {
    const z = -s * 1.55;
    const eng = new THREE.Group(); at(eng, .55, -.72, z); plane.add(eng); P.engines.push(eng);
    const nac = mesh(new THREE.CylinderGeometry(.33, .28, 1.2, 16, 1, true), MAT.gray); nac.rotation.z = Math.PI / 2; nac.material.side = THREE.DoubleSide; eng.add(nac);
    const lip = mesh(new THREE.TorusGeometry(.32, .05, 8, 18), MAT.lgray); lip.rotation.y = Math.PI / 2; at(lip, .6, 0, 0); eng.add(lip);
    const core = mesh(new THREE.ConeGeometry(.18, .5, 12), MAT.dark); core.rotation.z = -Math.PI / 2; at(core, -.7, 0, 0); eng.add(core);
    const fan = new THREE.Group(); at(fan, .45, 0, 0); eng.add(fan); P.fans.push(fan);
    fan.add(mesh(new THREE.SphereGeometry(.1, 10, 8), MAT.lgray));
    for (let i = 0; i < 12; i++) { const b = mesh(new THREE.BoxGeometry(.03, .27, .07), MAT.dark, false); b.position.y = .15; const h = new THREE.Group(); h.add(b); h.rotation.x = i / 12 * Math.PI * 2; b.rotation.y = .5; fan.add(h); }
    const back = mesh(new THREE.CircleGeometry(.3, 16), MAT.dark, false); back.rotation.y = Math.PI / 2; at(back, .2, 0, 0); eng.add(back);
    const py = mesh(new THREE.BoxGeometry(.7, .35, .08), MAT.lgray); at(py, .1, .25, 0); eng.add(py);
  }
  // trem de pouso
  P.gear = new THREE.Group(); plane.add(P.gear);
  for (const [x, z] of [[2.3, 0], [-.3, .7], [-.3, -.7]]) {
    const leg = mesh(new THREE.CylinderGeometry(.04, .04, .4), MAT.gray); at(leg, x, -.68, z); P.gear.add(leg);
    const wh = mesh(new THREE.CylinderGeometry(.16, .16, .14, 12), MAT.dark); wh.rotation.x = Math.PI / 2; at(wh, x, -.87, z); P.gear.add(wh);
  }
}
plane.traverse(o => { if (o.isMesh) o.castShadow = true; });
const GEAR_Y = 1.03;

function arrow(color, len = 3, r = .18) {
  const g = new THREE.Group(), m = M(color, { emissive: color, emissiveIntensity: .25 });
  const sh = mesh(new THREE.CylinderGeometry(r, r, len - .9, 12), m); sh.position.y = (len - .9) / 2; g.add(sh);
  const hd = mesh(new THREE.ConeGeometry(r * 2.4, .9, 14), m); hd.position.y = len - .45; g.add(hd);
  return g;
}
// setas das forças (presas ao avião)
const F = {
  lift: arrow('#2f8cff', 3.6, .2), weight: arrow('#ff3b30', 3.6, .2), thrust: arrow('#ff9f1c', 3.2, .18), drag: arrow('#b0bec5', 3.0, .18)
};
at(F.lift, -.2, .7, 0); at(F.weight, -.2, -.9, 0); F.weight.rotation.z = Math.PI;
at(F.thrust, 3.9, 0, 0); F.thrust.rotation.z = -Math.PI / 2; at(F.drag, -4.9, .2, 0); F.drag.rotation.z = Math.PI / 2;
Object.values(F).forEach(a => plane.add(a));
// setas de peso (várias, como na referência)
const weightArrows = []; for (let i = 0; i < 7; i++) { const a = arrow('#ff3b30', 1.6, .09); a.rotation.z = Math.PI; plane.add(a); weightArrows.push(a); }
// partículas de exaustão
const exhaust = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 6, 4), M('#d8f1ff', { transparent: true, opacity: .75, emissive: '#ffffff', emissiveIntensity: .3 }), 120);
exhaust.castShadow = false; plane.add(exhaust);
const engThrust = arrow('#ff9f1c', 2.6, .13); plane.add(engThrust);

// ---------- boneco ----------
function makeBoneco() {
  const g = new THREE.Group(), skin = M('#f2c39b'), shirt = M('#ffcc22'), pants = M('#2b4c9b'), hair = M('#222'), blk = M('#111');
  for (const x of [-.11, .11]) { g.add(at(mesh(new THREE.CylinderGeometry(.09, .09, .55, 8), pants), x, .28, 0)); g.add(at(mesh(new THREE.BoxGeometry(.16, .08, .26), blk), x, .03, .04)); }
  g.add(at(mesh(new THREE.CylinderGeometry(.24, .27, .62, 10), shirt), 0, .85, 0));
  const head = at(mesh(new THREE.SphereGeometry(.28, 14, 10), skin), 0, 1.42, 0); g.add(head);
  const hr = mesh(new THREE.SphereGeometry(.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), hair); at(hr, 0, 1.45, -.02); g.add(hr);
  for (const x of [-.1, .1]) { g.add(at(mesh(new THREE.SphereGeometry(.05, 8, 6), M('#fff')), x, 1.45, .24)); g.add(at(mesh(new THREE.SphereGeometry(.028, 6, 4), blk), x, 1.45, .285)); }
  const arms = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); at(pv, s * .3, 1.08, 0); g.add(pv);
    const a = at(mesh(new THREE.CylinderGeometry(.07, .07, .5, 8), shirt), 0, -.22, 0); pv.add(a);
    pv.add(at(mesh(new THREE.SphereGeometry(.08, 8, 6), skin), 0, -.5, 0)); arms.push(pv);
  }
  return { g, arms };
}
const boneco = makeBoneco(); scene.add(boneco.g);

// ---------- aeroporto ----------
const airport = new THREE.Group(); scene.add(airport);
{
  const gr = mesh(new THREE.PlaneGeometry(2000, 2000), M('#7cc35a', { flatShading: false }), false, true); gr.rotation.x = -Math.PI / 2; airport.add(gr);
  airport.add(at(mesh(new THREE.BoxGeometry(900, .04, 9), M('#5b6168'), false, true), 0, .02, 0));
  for (let x = -450; x < 450; x += 9) airport.add(at(mesh(new THREE.BoxGeometry(4.5, .05, .35), M('#ffffff'), false, true), x, .03, 0));
  for (const z of [-4.2, 4.2]) airport.add(at(mesh(new THREE.BoxGeometry(900, .05, .25), M('#ffffff'), false, true), 0, .03, z));
  airport.add(at(mesh(new THREE.BoxGeometry(900, .03, 14), M('#a9b0a0'), false, true), 0, .015, -16));
  const treeMats = ['#3fa34d', '#4cb85a', '#2e8b3e', '#5cc46a'].map(c => M(c));
  for (let i = 0; i < 220; i++) {
    const x = rnd() * 700 - 350, z = (rnd() < .5 ? -1 : 1) * (14 + rnd() * 160);
    if (z < 0 && z > -40 && x > -40 && x < 60) continue;
    const s = .9 + rnd() * 1.1, t = new THREE.Group();
    t.add(at(mesh(new THREE.CylinderGeometry(.15, .2, 1.2, 6), M('#8b5a2b')), 0, .6, 0));
    t.add(at(mesh(new THREE.IcosahedronGeometry(1.1, 0), treeMats[i % 4]), 0, 1.9, 0));
    t.scale.setScalar(s); at(t, x, 0, z); t.rotation.y = rnd() * 6; airport.add(t);
  }
  // torre de controle
  const tw = new THREE.Group(); at(tw, 25, 0, -30); airport.add(tw);
  tw.add(at(mesh(new THREE.CylinderGeometry(1, 1.4, 12, 10), MAT.white), 0, 6, 0));
  tw.add(at(mesh(new THREE.CylinderGeometry(2.2, 1.6, 2, 10), M('#2f6f8f', { roughness: .2 })), 0, 13, 0));
  tw.add(at(mesh(new THREE.CylinderGeometry(2.5, 2.5, .4, 10), MAT.lgray), 0, 14.2, 0));
  // terminal e hangar
  airport.add(at(mesh(new THREE.BoxGeometry(40, 6, 12), M('#e6ebef')), 0, 3, -36));
  for (let x = -18; x <= 18; x += 3) airport.add(at(mesh(new THREE.BoxGeometry(2.2, 3, .1), M('#3a7ca5', { roughness: .2 }), false), x, 3.5, -29.95));
  const hg = mesh(new THREE.CylinderGeometry(9, 9, 20, 14, 1, false, 0, Math.PI), M('#b0bec5')); hg.rotation.x = Math.PI / 2; hg.rotation.z = Math.PI / 2; at(hg, -40, 0, -34); airport.add(hg);
  // colinas
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 420 + rnd() * 120; const h = mesh(new THREE.IcosahedronGeometry(60 + rnd() * 50, 0), M(rnd() < .5 ? '#5fae55' : '#4f9a48'), false, false); h.scale.y = .35 + rnd() * .2; at(h, Math.cos(a) * r, 0, Math.sin(a) * r); airport.add(h); }
}

// ---------- céu ----------
const sky = new THREE.Group(); scene.add(sky);
const clouds = [];
{
  const cm = M('#ffffff', { roughness: 1 });
  const ground = mesh(new THREE.PlaneGeometry(6000, 6000), M('#6aa65a', { flatShading: false }), false, false); ground.rotation.x = -Math.PI / 2; ground.position.y = -260; sky.add(ground);
  for (let i = 0; i < 18; i++) { const f = mesh(new THREE.PlaneGeometry(80 + rnd() * 120, 80 + rnd() * 120), M(['#8cbf5a', '#c9b27a', '#5d9e4a'][i % 3], { flatShading: false }), false, false); f.rotation.x = -Math.PI / 2; at(f, rnd() * 1200 - 600, -259.5, rnd() * 1200 - 600); sky.add(f); }
  for (let i = 0; i < 70; i++) {
    const g = new THREE.Group(); const n = 4 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) { const b = mesh(new THREE.IcosahedronGeometry(2 + rnd() * 2.5, 1), cm, false, false); at(b, k * 2.6 - n * 1.3, rnd() * 1.2, rnd() * 3 - 1.5); g.add(b); }
    const lay = rnd();
    const y = lay < .6 ? -20 - rnd() * 22 : (6 + rnd() * 10);
    let z = rnd() * 300 - 150; if (y > -16 && Math.abs(z) < 55) z = Math.sign(z || 1) * (90 + rnd() * 80);
    g.userData = { x0: rnd() * 600 - 300, y, z, s: 1 + rnd() * 1.5 };
    g.scale.setScalar(g.userData.s); sky.add(g); clouds.push(g);
  }
}
const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, .035, .035), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .7 }), 90);
sky.add(streaks); const streakData = Array.from({ length: 90 }, () => [rnd() * 40 - 20, rnd() * 10 - 4, rnd() * 18 - 9]);

// ---------- corte da asa (perfil aerodinâmico) ----------
const foilW = new THREE.Group(); scene.add(foilW);
const foil = new THREE.Group(); foilW.add(foil);
const C = 6, FOIL = { U: [], L: [] };
{
  const m = .02, p = .4, th = .12, N = 50, up = [], lo = [];
  for (let i = 0; i <= N; i++) {
    const x = (1 - Math.cos(i / N * Math.PI)) / 2;
    const yt = 5 * th * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1015 * x ** 4);
    const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x);
    const dyc = x < p ? 2 * m / (p * p) * (p - x) : 2 * m / ((1 - p) ** 2) * (p - x); const a = Math.atan(dyc);
    up.push([(x - yt * Math.sin(a)) * C - C / 2, (yc + yt * Math.cos(a)) * C]);
    lo.push([(x + yt * Math.sin(a)) * C - C / 2, (yc - yt * Math.cos(a)) * C]);
  }
  FOIL.up0 = up; FOIL.lo0 = lo;
  const s = new THREE.Shape(); up.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); for (let i = lo.length - 2; i > 0; i--) s.lineTo(lo[i][0], lo[i][1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 5, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -2.5);
  const fm = mesh(g, [M('#ff9f43', { flatShading: false }), M('#e9eef3', { flatShading: false, roughness: .4 })]); foil.add(fm);
}
const foilLift = arrow('#2f8cff', 4.2, .28); foilW.add(foilLift);
const ROWS = [.32, .7, 1.1, 1.55, 2.05, 2.6, 3.2, 3.9]; const PPR = 26;
const parts = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .07, .07), new THREE.MeshBasicMaterial({ color: '#ffffff' }), ROWS.length * 2 * PPR);
foilW.add(parts); const partZ = Array.from({ length: ROWS.length * 2 * PPR }, () => rnd() * 4.6 - 2.3);
const partPh = Array.from({ length: ROWS.length * 2 * PPR }, (_, i) => (i % PPR) / PPR + rnd() * .02);
const foilBack = mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: '#163a6b' }), false, false); foilBack.position.z = -12; foilW.add(foilBack);
for (let i = -12; i <= 12; i++) { foilW.add(at(mesh(new THREE.BoxGeometry(60, .03, .03), new THREE.MeshBasicMaterial({ color: '#2a5591' }), false, false), 0, i * 1.5, -11.9)); foilW.add(at(mesh(new THREE.BoxGeometry(.03, 60, .03), new THREE.MeshBasicMaterial({ color: '#2a5591' }), false, false), i * 1.5, 0, -11.9)); }

function foilState(alpha) {
  foil.rotation.z = -alpha;
  const ca = Math.cos(-alpha), sa = Math.sin(-alpha), rot = ([x, y]) => [x * ca - y * sa, x * sa + y * ca];
  FOIL.U = FOIL.up0.map(rot); FOIL.L = FOIL.lo0.map(rot);
  FOIL.le = FOIL.U[0]; FOIL.te = FOIL.U[FOIL.U.length - 1];
  FOIL.dw = .25 + 7 * Math.sin(alpha);
}
function interp(arr, x) { if (x <= arr[0][0]) return arr[0][1]; for (let i = 1; i < arr.length; i++) if (x <= arr[i][0]) { const [x0, y0] = arr[i - 1], [x1, y1] = arr[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1); } return arr[arr.length - 1][1]; }
function flowY(x, y0) {
  const upper = y0 > 0, arr = upper ? FOIL.U : FOIL.L, [lx, ly] = FOIL.le, [tx, ty] = FOIL.te;
  let f;
  if (x < lx) f = ly * Math.exp(-Math.pow((lx - x) / 1.6, 2));
  else if (x <= tx) f = interp(arr, x);
  else f = ty - FOIL.dw * (1 - Math.exp(-(x - tx) / 2.5));
  const k = Math.exp(-Math.abs(y0) / 2.4);
  return y0 + f * k + (upper ? .06 * k : -.06 * k);
}
function updateParticles(t, show, alpha) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let i = 0;
  for (const sg of [1, -1]) for (const r of ROWS) {
    const y0 = sg * r, spd = .2 * (1 + (sg > 0 ? (.35 + 4 * alpha) * Math.exp(-r / 1.3) : -.15 * Math.exp(-r / 1.3)));
    for (let k = 0; k < PPR; k++, i++) {
      const u = (partPh[i] + t * spd) % 1, x = -10 + u * 20;
      const y = flowY(x, y0), dy = flowY(x + .05, y0) - y;
      q.setFromAxisAngle(V(0, 0, 1), Math.atan2(dy, .05));
      const fade = Math.min(1, u * 6, (1 - u) * 6) * show;
      s.set(fade, fade, fade); p.set(x, y, partZ[i]); m.compose(p, q, s); parts.setMatrixAt(i, m);
    }
  }
  parts.instanceMatrix.needsUpdate = true;
}

// ---------- cabine (corte) ----------
const cabin = new THREE.Group(); scene.add(cabin);
{
  const hull = mesh(new THREE.CylinderGeometry(3, 3, 34, 28, 1, true, Math.PI, Math.PI), M('#eef2f5', { side: THREE.DoubleSide, flatShading: false }));
  hull.rotation.z = Math.PI / 2; cabin.add(hull);
  cabin.add(at(mesh(new THREE.BoxGeometry(34, .2, 5.4), M('#5f6f86')), 0, -1.6, 0));
  cabin.add(at(mesh(new THREE.BoxGeometry(34, .21, .9), M('#c44d4d')), 0, -1.59, 0));
  const seatGeo = new THREE.BoxGeometry(.6, .5, .55), backGeo = new THREE.BoxGeometry(.18, 1.0, .55);
  const zs = [-2.15, -1.55, -.95, .95, 1.55, 2.15], xs = []; for (let x = -15; x <= 15; x += 1.25) xs.push(x);
  const n = zs.length * xs.length;
  const seats = new THREE.InstancedMesh(seatGeo, M('#2e5fae'), n), backs = new THREE.InstancedMesh(backGeo, M('#2e5fae'), n);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.24, 10, 8), M('#ffffff'), n), bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(.2, .24, .6, 8), M('#ffffff'), n);
  const hairs = new THREE.InstancedMesh(new THREE.SphereGeometry(.255, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), M('#ffffff'), n);
  const skins = ['#f2c39b', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'], shirts = ['#ffcc22', '#e53935', '#43a047', '#8e24aa', '#fb8c00', '#00acc1', '#ffffff'], hc = ['#222', '#5a3825', '#c9a227', '#111', '#8d6e63'];
  const m = new THREE.Matrix4(); let i = 0;
  for (const x of xs) for (const z of zs) {
    m.makeTranslation(x, -1.25, z); seats.setMatrixAt(i, m); m.makeTranslation(x - .32, -.95, z); backs.setMatrixAt(i, m);
    const fill = rnd() < .88 ? 1 : 0;
    m.makeScale(fill, fill, fill).setPosition(x + .02, -.7, z); bodies.setMatrixAt(i, m);
    m.makeScale(fill, fill, fill).setPosition(x + .02, -.18, z); heads.setMatrixAt(i, m);
    m.makeScale(fill, fill, fill).setPosition(x + .0, -.15, z); hairs.setMatrixAt(i, m);
    heads.setColorAt(i, new THREE.Color(skins[Math.floor(rnd() * 5)])); bodies.setColorAt(i, new THREE.Color(shirts[Math.floor(rnd() * 7)])); hairs.setColorAt(i, new THREE.Color(hc[Math.floor(rnd() * 5)]));
    i++;
  }
  [seats, backs, heads, bodies, hairs].forEach(o => { o.castShadow = o.receiveShadow = true; cabin.add(o); });
  for (let x = -15; x <= 15; x += 2.5) for (const z of [-1, 1]) cabin.add(at(mesh(new THREE.BoxGeometry(.5, .6, .05), M('#9ad0ff', { emissive: '#9ad0ff', emissiveIntensity: .4 }), false), x, .2, z * 2.98));
}

// ---------- tempo / dados ----------
let DATA, DUR, WORDS;
const nt = t => { let a = t; for (const [p, add] of DATA.insertions) if (p <= t + .05) a += add; return a; };
const END = 3.6;

// ---------- estado de cena ----------
function showWorld(w) {
  airport.visible = w === 'airport'; sky.visible = w === 'sky'; foilW.visible = w === 'foil'; cabin.visible = w === 'cabin';
  plane.visible = w === 'airport' || w === 'sky'; boneco.g.visible = w === 'airport';
  scene.fog.color.set(w === 'foil' ? '#163a6b' : '#cfe8ff');
  scene.fog.near = w === 'sky' ? 120 : 80; scene.fog.far = w === 'sky' ? 900 : 520;
  if (w === 'foil' || w === 'cabin') { scene.fog.near = 500; scene.fog.far = 2000; }
}
function resetPlane() {
  plane.position.set(0, 0, 0); plane.rotation.set(0, 0, 0);
  Object.values(F).forEach(a => a.scale.setScalar(0)); weightArrows.forEach(a => a.scale.setScalar(0)); engThrust.scale.setScalar(0);
  P.gear.visible = false; P.wings.forEach(w => { w.material = MAT.lgray; }); exhaust.visible = false;
}
const hiWing = M('#ffd21f', { emissive: '#ffb300', emissiveIntensity: .5 });
function setCam(pos, look, fov = 42) { cam.position.copy(pos); cam.lookAt(look); cam.fov = fov; cam.updateProjectionMatrix(); }
function lerpV(a, b, k) { return a.clone().lerp(b, k); }
function skyMotion(t, speed = 45) {
  for (const c of clouds) { const d = c.userData; c.position.set(((d.x0 - t * speed) % 600 + 900) % 600 - 300, d.y, d.z); }
  const m = new THREE.Matrix4();
  streakData.forEach(([x, y, z], i) => { const xx = ((x - t * 70) % 40 + 60) % 40 - 20; m.makeTranslation(xx, y, z); streaks.setMatrixAt(i, m); });
  streaks.instanceMatrix.needsUpdate = true;
}
function engineExhaust(t, k) {
  exhaust.visible = k > 0; if (!k) return;
  const m = new THREE.Matrix4();
  for (let i = 0; i < 120; i++) {
    const e = i % 2 ? 1 : -1, u = ((i * .137 + t * 1.8) % 1), sp = u * 3.6;
    const ang = i * 2.39, r = .05 + u * .25;
    m.makeScale(k * (1 - u * .6), k * (1 - u * .6), k * (1 - u * .6)).setPosition(-.2 - sp, -.72 + Math.sin(ang) * r, e * 1.55 + Math.cos(ang) * r);
    exhaust.setMatrixAt(i, m);
  }
  exhaust.instanceMatrix.needsUpdate = true;
}
function bonecoPose(x, z, ry, mode, t) {
  boneco.g.position.set(x, 0, z); boneco.g.rotation.y = ry;
  const [l, r] = boneco.arms;
  if (mode === 'up') { l.rotation.z = -2.6 + Math.sin(t * 8) * .15; r.rotation.z = 2.6 - Math.sin(t * 8 + 1) * .15; }
  else if (mode === 'point') { l.rotation.z = -.2; r.rotation.z = 2.2; r.rotation.x = -.4; }
  else { l.rotation.z = -.15; r.rotation.z = .15; r.rotation.x = 0; }
  boneco.g.position.y = mode === 'up' ? Math.abs(Math.sin(t * 6)) * .15 : 0;
}
function sunAt(target, off = V(18, 30, 14)) { sun.target.position.copy(target); sun.position.copy(target).add(off); }
function takeoff(lt, x0, a, tl) { // posição ao longo da pista
  const x = x0 + .5 * a * lt * lt, v = a * lt; let y = GEAR_Y, pitch = 0;
  if (lt > tl) { const u = lt - tl; pitch = Math.min(.22, u * .25); y += u * u * 1.2 + u * .3; }
  return { x, y, pitch, v };
}

// ---------- tomadas (tempos do áudio ORIGINAL) ----------
// cada tomada: t0, mundo, fn(lt, gt) -> overlays {labels, pills}
const SH = [];
const sh = (t0, world, fn) => SH.push({ t0, world, fn });
const L = (txt, ot, pos, o = {}) => Object.assign({ kind: 'label', txt, t: nt(ot), pos }, o);
const Pl = (txt, ot, pos, o = {}) => Object.assign({ kind: 'pill', txt, t: nt(ot), pos }, o);
const wp = (obj, v) => obj.localToWorld(v.clone());

sh(0, 'airport', (lt, gt) => { // "Você já parou para pensar..."
  resetPlane(); P.gear.visible = true; plane.position.set(4, GEAR_Y, 0);
  bonecoPose(-1.5, 7.5, Math.PI * .85, 'normal', gt);
  boneco.g.lookAt(plane.position.x, 0, plane.position.z);
  const k = eio(lt / 2.4);
  setCam(lerpV(V(-4.2, 1.6, 12.5), V(-3.2, 1.9, 11.2), k), V(2.5, 1.3, 0));
  sunAt(V(0, 0, 0));
  return {};
});
sh(2.14, 'airport', (lt, gt) => { // "máquina que pesa ... toneladas"
  resetPlane(); P.gear.visible = true; plane.position.set(4, GEAR_Y, 0);
  bonecoPose(-1.5, 7.5, 0, 'normal', gt); boneco.g.lookAt(4, 0, 0);
  const tA = gt - nt(4.3);
  weightArrows.forEach((a, i) => { const s = popS(tA - i * .05); a.scale.setScalar(s); a.position.set(-3.6 + i * 1.15, 3.3 + Math.sin(gt * 6 + i) * .15, 0); });
  setCam(lerpV(V(-2, 2.5, 10.5), V(1, 3.2, 12.5), eio(lt / 3.4)), V(3.5, 1.5, 0));
  sunAt(V(4, 0, 0));
  return { items: [Pl('CENTENAS DE TONELADAS', 5.04, wp(plane, V(0, 4.6, 0)), { dot: '#ff3b30' })] };
});
sh(5.56, 'airport', (lt, gt) => { // "consegue sair do chão e voar pelos céus?"
  resetPlane();
  const s = takeoff(lt, -6, 7, 1.55);
  plane.position.set(s.x, s.y, 0); plane.rotation.z = s.pitch; P.gear.visible = s.y < GEAR_Y + 2;
  P.fans.forEach(f => f.rotation.x = gt * 40);
  bonecoPose(-1.5, 7.5, 0, lt > 1.6 ? 'up' : 'normal', gt); boneco.g.lookAt(s.x, 0, 0);
  const look = V(s.x + 1.5, s.y + .5, 0);
  setCam(V(s.x - 9 + lt * .5, 1.8 + s.y * .55, 10.5 - lt * .4), look, 44);
  sunAt(V(s.x, 0, 0));
  return {};
});
sh(9.70, 'sky', (lt, gt) => { // "A resposta... aerodinâmica"
  resetPlane(); skyMotion(gt);
  plane.rotation.x = Math.sin(gt * .8) * .03; plane.position.y = Math.sin(gt * 1.1) * .15;
  P.fans.forEach(f => f.rotation.x = gt * 40);
  const a = lerp(.35, 1.25, eio(lt / 5.5));
  setCam(V(Math.cos(a) * 14, 3 + lt * .15, Math.sin(a) * 14), V(0, 0, 0));
  sunAt(V(0, 0, 0));
  return { items: [L('AERODINÂMICA', 14.2, V(0, 3.2, 0))] };
});
sh(15.42, 'sky', (lt, gt) => { // "Tudo começa com as asas do avião"
  resetPlane(); skyMotion(gt);
  P.fans.forEach(f => f.rotation.x = gt * 40);
  if (gt > nt(16.64)) P.wings.forEach(w => w.material = (Math.floor((gt - nt(16.64)) * 4) % 2 === 0) ? hiWing : MAT.lgray);
  const k = eio(lt / 2.2);
  setCam(lerpV(V(8, 5, 10), V(1.5, 7.5, 6.5), k), lerpV(V(0, 0, 0), V(-.6, -.3, 2.3), k));
  sunAt(V(0, 0, 0));
  return { items: [L('ASAS', 16.64, V(-.7, .6, 2.6))] };
});
sh(17.84, 'foil', (lt, gt) => { // "formato especial, perfil aerodinâmico"
  foilState(.02); updateParticles(gt, 0, .02); foilLift.scale.setScalar(0);
  foil.scale.setScalar(popS(lt, .45));
  const a = lerp(-.9, -.35, eio(lt / 4));
  setCam(V(Math.sin(a) * 19, 3.2, Math.cos(a) * 19), V(0, .2, 0), 40);
  sunAt(V(0, 0, 0), V(10, 25, 20));
  return { items: [L('PERFIL AERODINÂMICO', 20.7, V(0, 2.6, 0))] };
});
sh(22.30, 'foil', (lt, gt) => { // "controlar o movimento do ar ao redor delas"
  foil.scale.setScalar(1); foilState(.03); updateParticles(gt, eo(lt / .6), .03); foilLift.scale.setScalar(0);
  const a = lerp(-.35, -.15, eio(lt / 3));
  setCam(V(Math.sin(a) * 19, 2.4, Math.cos(a) * 19), V(0, 0, 0), 40);
  sunAt(V(0, 0, 0), V(10, 25, 20));
  return { items: [Pl('AR EM MOVIMENTO', 23.48, V(-5.5, 3.3, 2), { dot: '#2f8cff' })] };
});
sh(25.70, 'airport', (lt, gt) => { // "ganha velocidade na pista"
  resetPlane(); P.gear.visible = true;
  const s = takeoff(lt, -40, 5.4, 99);
  plane.position.set(s.x, GEAR_Y, 0); P.fans.forEach(f => f.rotation.x = gt * 40);
  bonecoPose(-60, 30, 0, 'normal', gt);
  setCam(V(s.x - 2.5, 1.4, 11), V(s.x + 1, 1.1, 0), 46);
  sunAt(V(s.x, 0, 0));
  const kmh = Math.round(s.v * 11);
  return { items: [Pl(`${kmh} KM/H`, 26.82, [W / 2, 520], { dot: '#2f8cff', size: 58 }), Pl('VENTO NAS ASAS', 28.48, wp(plane, V(-1, 1.4, 3.2)), { dot: '#2f8cff' })], wind: gt > nt(28.48) ? s.v : 0 };
});
sh(30.56, 'foil', (lt, gt) => { // "inclinação ... sustentação"
  foil.scale.setScalar(1);
  const alpha = .03 + .15 * eio((gt - nt(32.48)) / 1);
  foilState(alpha); updateParticles(gt, 1, alpha);
  foilLift.position.set(-.4, .7, 0); foilLift.scale.setScalar(popS(gt - nt(35.4), .4) * (1 + .05 * Math.sin(gt * 8)));
  const a = lerp(-.15, -.45, eio(lt / 5));
  setCam(V(Math.sin(a) * 20, 3, Math.cos(a) * 20), V(0, 1.2, 0), 42);
  sunAt(V(0, 0, 0), V(10, 25, 20));
  return { items: [Pl('INCLINAÇÃO', 32.48, V(-4.2, 1.6, 2), { dot: '#ff9f1c' }), L('SUSTENTAÇÃO', 35.4, V(-.4, 5.6, 0))] };
});
sh(36.46, 'airport', (lt, gt) => { // "empurra o avião para cima"
  resetPlane();
  const s = takeoff(lt + 1.2, -18, 6, 1.2);
  plane.position.set(s.x, s.y, 0); plane.rotation.z = s.pitch; P.gear.visible = true; P.fans.forEach(f => f.rotation.x = gt * 40);
  F.lift.scale.setScalar(popS(lt, .3) * (1 + .06 * Math.sin(gt * 10)));
  bonecoPose(-60, 30, 0, 'normal', gt);
  setCam(V(s.x + 11, .8, 8.5), V(s.x, s.y + 1.2, 0), 46);
  sunAt(V(s.x, 0, 0));
  return { items: [Pl('PRA CIMA!', 37.56, wp(plane, V(0, 4.9, 0)), { dot: '#2f8cff' })] };
});
sh(38.54, 'sky', (lt, gt) => { // "Mas não é só isso."
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  const k = eio(lt / 1.4);
  setCam(lerpV(V(-6, 4, 12), V(5.5, -.2, 6.5), k), lerpV(V(0, 0, 0), V(.5, -.6, 1.5), k));
  sunAt(V(0, 0, 0));
  return {};
});
sh(40.06, 'sky', (lt, gt) => { // "Os motores ... papel fundamental"
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 30);
  const k = eio(lt / 2.5);
  setCam(lerpV(V(5.5, -.2, 6.5), V(3.4, -.35, 3.4), k), V(.6, -.7, 1.55));
  sunAt(V(0, 0, 0));
  return { items: [L('MOTORES', 40.24, wp(plane, V(.6, .15, 1.55)))] };
});
sh(42.88, 'sky', (lt, gt) => { // "empuxo, para frente"
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  engineExhaust(gt, eo(lt / .4));
  engThrust.position.set(1.25, -.72, 1.55); engThrust.rotation.set(0, 0, -Math.PI / 2); engThrust.scale.setScalar(popS(gt - nt(43.68), .35));
  setCam(lerpV(V(.3, .4, 8.5), V(-.8, .6, 9.3), eio(lt / 3.4)), V(-.3, -.6, 1.55));
  sunAt(V(0, 0, 0));
  return { items: [L('EMPUXO', 43.68, wp(plane, V(2.6, .2, 1.55))), Pl('PRA FRENTE', 45.94, wp(plane, V(3.4, -1.4, 1.55)), { dot: '#ff9f1c' })] };
});
sh(46.32, 'sky', (lt, gt) => { // "velocidade necessária para continuar voando"
  resetPlane(); skyMotion(gt, 80); P.fans.forEach(f => f.rotation.x = gt * 40); engineExhaust(gt, 1);
  plane.rotation.x = Math.sin(gt) * .04;
  setCam(lerpV(V(-11, 2.4, 7.5), V(-9, 1.6, 9.5), eio(lt / 4.5)), V(1, 0, 0), 46);
  sunAt(V(0, 0, 0));
  const v = Math.round(lerp(400, 900, eo((gt - nt(48.3)) / 1.6)));
  return { items: [Pl(`${v} KM/H`, 48.3, [W / 2, 520], { dot: '#ff9f1c', size: 58 })] };
});
const forceCam = (lt, a0, a1, dur, r = 34) => { const a = lerp(a0, a1, eio(lt / dur)); setCam(V(Math.sin(a) * r, 2.5, Math.cos(a) * r), V(-.2, 0, 0), 40); };
sh(51.24, 'sky', (lt, gt) => { // "outras forças entram em ação"
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  F.lift.scale.setScalar(.6); F.thrust.scale.setScalar(.6);
  forceCam(lt, -.5, -.1, 3.6);
  sunAt(V(0, 0, 0));
  return { items: [Pl('OUTRAS FORÇAS', 53.38, V(-.2, 5.3, 0), { dot: '#ff3b30' })] };
});
sh(55.06, 'sky', (lt, gt) => { // gravidade
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  F.lift.scale.setScalar(.6); F.thrust.scale.setScalar(.6);
  F.weight.scale.setScalar(popS(gt - nt(55.18), .35) * (1 + .05 * Math.sin(gt * 9)));
  forceCam(lt, -.1, .05, 2.3);
  sunAt(V(0, 0, 0));
  return { items: [L('GRAVIDADE', 55.18, V(5.5, -1.6, 0))] };
});
sh(57.30, 'sky', (lt, gt) => { // resistência do ar
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  F.lift.scale.setScalar(.6); F.thrust.scale.setScalar(.6); F.weight.scale.setScalar(.6);
  F.drag.scale.setScalar(popS(gt - nt(58.0), .35) * (1 + .05 * Math.sin(gt * 9)));
  forceCam(lt, .05, .2, 3.2);
  sunAt(V(0, 0, 0));
  return { items: [L('RESISTÊNCIA DO AR', 58.0, V(-7.2, 1.9, 0))] };
});
sh(60.98, 'sky', (lt, gt) => { // equilíbrio
  resetPlane(); skyMotion(gt); P.fans.forEach(f => f.rotation.x = gt * 40);
  const pulse = 1 + .04 * Math.sin(gt * 6);
  Object.values(F).forEach(a => a.scale.setScalar(pulse));
  forceCam(lt, .2, .75, 3.2, 36);
  sunAt(V(0, 0, 0));
  const o = { dot: '#2f8cff', size: 36 };
  return {
    items: [Pl('SUSTENTAÇÃO', 61.0, wp(plane, V(-.2, 4.9, 0)), o), Pl('GRAVIDADE', 61.1, wp(plane, V(-.2, -5.0, 0)), { ...o, dot: '#ff3b30' }),
    Pl('EMPUXO', 61.2, wp(plane, V(7.6, .9, 0)), { ...o, dot: '#ff9f1c' }), Pl('ARRASTO', 61.3, wp(plane, V(-8.4, 1.1, 0)), { ...o, dot: '#90a4ae' }),
    L('EQUILÍBRIO', 62.1, [W / 2, 400])]
  };
});
sh(64.18, 'cabin', (lt, gt) => { // "máquina gigantesca consegue transportar centenas de pessoas"
  const k = eio(lt / 4.6);
  setCam(V(lerp(-13, -2, k), 7.5, 7.5), V(lerp(-9, 2, k), -1, 0), 44);
  sunAt(V(0, 0, 0), V(6, 30, 12));
  return { items: [Pl('CENTENAS DE PESSOAS', 67.6, [W / 2, 560], { dot: '#2f8cff', size: 50 })] };
});
sh(68.70, 'sky', (lt, gt) => { // "a milhares de metros de altura"
  resetPlane(); skyMotion(gt, 30); P.fans.forEach(f => f.rotation.x = gt * 40);
  const k = eio(lt / 2.2);
  setCam(lerpV(V(-10, 8, 16), V(-20, 26, 34), k), V(0, -6, 0), 50);
  sunAt(V(0, 0, 0));
  return { alt: true, items: [Pl('10.000 METROS', 68.98, [W / 2, 1560], { dot: '#2f8cff', size: 52 })] };
});
sh(71.00, 'airport', (lt, gt) => { // "Incrível, não é?" + tela final
  resetPlane();
  const px = -60 + lt * 22, py = 22 + lt * 1.5;
  plane.position.set(px, py, -10); plane.rotation.z = .1; P.fans.forEach(f => f.rotation.x = gt * 40);
  bonecoPose(0, 0, 0, 'up', gt); boneco.g.rotation.y = -.2;
  setCam(V(-1.3, 1.6, 5.6), V(-.8, 2.6, 0), 50);
  sunAt(V(0, 0, 0));
  return { end: gt - (DUR + .1) };
});

// ---------- 2D: fundo, rótulos, legendas ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function proj(v) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; }
function skyBg(world) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (world === 'foil') { g.addColorStop(0, '#1e4f8f'); g.addColorStop(1, '#0c2347'); }
  else if (world === 'cabin') { g.addColorStop(0, '#dfe7ee'); g.addColorStop(1, '#b8c6d3'); }
  else { g.addColorStop(0, '#3f8fe3'); g.addColorStop(.55, '#9fd2ff'); g.addColorStop(1, '#d6eeff'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function label3D(txt, x, y, lt) {
  const s = popS(lt, .35); if (s <= 0) return;
  const size = 104;
  ctx.save(); ctx.translate(x, y);
  ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  let w = ctx.measureText(txt).width, sz = size; if (w > 960) { sz = size * 960 / w; ctx.font = `700 ${sz}px Fredoka`; w = 960; }
  ctx.translate(clamp(x, w / 2 + 40, W - w / 2 - 40) - x, 0); ctx.rotate(-.07); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillText(txt, 6, sz * .2);
  for (let d = 9; d >= 1; d--) { ctx.fillStyle = '#b07400'; ctx.fillText(txt, 0, d * sz / 90); }
  ctx.lineWidth = sz * .05; ctx.strokeStyle = '#8a5a00'; ctx.strokeText(txt, 0, 0);
  const g = ctx.createLinearGradient(0, -sz / 2, 0, sz / 2); g.addColorStop(0, '#fff07a'); g.addColorStop(1, '#ffc400');
  ctx.fillStyle = g; ctx.fillText(txt, 0, 0); ctx.restore();
}
function pill(txt, x, y, lt, o = {}) {
  const s = popS(lt, .28); if (s <= 0) return;
  const size = o.size || 42; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.font = `600 ${size}px Fredoka`; const w = ctx.measureText(txt).width + size * 1.9, h = size * 1.55;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(-w / 2 + 4, -h / 2 + 7, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; rr(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#1b1b1b'; ctx.stroke();
  ctx.fillStyle = o.dot || '#ff3b30'; ctx.beginPath(); ctx.arc(-w / 2 + size * .75, 0, size * .25, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, -w / 2 + size * 1.2, size * .05);
  ctx.restore();
}
const KEY = new Set(['toneladas', 'céus', 'aerodinâmica', 'asas', 'perfil', 'aerodinâmico', 'velocidade', 'pista', 'inclinação', 'sustentação', 'cima', 'motores', 'empuxo', 'frente', 'forças', 'gravidade', 'baixo', 'resistência', 'equilíbrio', 'pessoas', 'altura', 'incrível', 'física', 'voar', 'voando']);
function subtitle(t) {
  let cur = null;
  for (let i = 0; i < WORDS.length; i++) {
    const [w, s, e] = WORDS[i], nx = WORDS[i + 1];
    const end = nx ? Math.min(nx[1] - .02, e + .45) : e + .5;
    if (t >= s - .04 && t < end) { cur = [w, s]; break; }
  }
  if (!cur) return;
  const raw = cur[0].replace(/[.,!?;:]/g, ''), txt = raw.charAt(0).toUpperCase() + raw.slice(1);
  const key = KEY.has(raw.toLowerCase()), s = .86 + .14 * eob((t - cur[1] + .04) / .12);
  ctx.save(); ctx.translate(W / 2, 1310); ctx.scale(s, s);
  ctx.font = '700 104px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(20,20,20,.85)'; ctx.strokeText(txt, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = key ? '#ffd21f' : '#ffffff'; ctx.fillText(txt, 0, 0);
  ctx.restore();
}
function endCard(lt) {
  if (lt < 0) return;
  const lines = [['JÁ SABIA? COMENTE', 0, 50, '#fff'], ['"PILOTO"', .25, 104, '#ffd21f'], ['NÃO SABIA? COMENTE', .9, 50, '#fff'], ['"PASSAGEIRO"', 1.15, 104, '#5ec8ff']];
  let y = 330;
  for (const [txt, d, size, col] of lines) {
    const s = popS(lt - d, .3);
    if (s > 0) {
      ctx.save(); ctx.translate(W / 2, y); ctx.rotate(-.04); ctx.scale(s, s);
      ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (size > 60) for (let k = 8; k >= 1; k--) { ctx.fillStyle = col === '#ffd21f' ? '#b07400' : '#1d5f99'; ctx.fillText(txt, 0, k * 1.2); }
      ctx.lineWidth = size * .14; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText(txt, 0, 0); ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore();
    }
    y += size * 1.35;
  }
}
function windLines(v, t) {
  if (!v) return; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineCap = 'round'; ctx.lineWidth = 6;
  for (let i = 0; i < 14; i++) { const y = 700 + ((i * 97) % 600), x = ((i * 233 - t * 900 * (.6 + (i % 3) * .2)) % (W + 400) + W + 400) % (W + 400) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 140, y); ctx.stroke(); }
}

// ---------- render ----------
let shots;
window.init = (data) => {
  DATA = data; DUR = data.duration; WORDS = data.words;
  shots = SH.map((s, i) => ({ ...s, start: i ? nt(s.t0) - .06 : 0 }));
  shots.forEach((s, i) => s.end = shots[i + 1] ? shots[i + 1].start : DUR + .1 + END);
  const events = [];
  shots.forEach((s, i) => { if (i) events.push(['whoosh', s.start]); });
  events.push(['engine', nt(5.56)], ['engine', nt(25.7)], ['engine2', nt(36.46)], ['ding', DUR + .1], ['pop', DUR + .35], ['pop', DUR + 1.25]);
  return { total: DUR + .1 + END, events, shots: shots.map(s => [s.t0, +s.start.toFixed(2)]) };
};
window.render = (t) => {
  const i = shots.findIndex(s => t >= s.start && t < s.end), s = shots[i < 0 ? shots.length - 1 : i];
  showWorld(s.world);
  const o = s.fn(t - s.start, t) || {};
  R.render(scene, cam);
  skyBg(s.world);
  ctx.drawImage(glc, 0, 0);
  windLines(o.wind, t);
  if (o.alt) { // linha de altitude
    const a = proj(plane.position), b = [a[0], 1500];
    ctx.setLineDash([22, 16]); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 40); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
  }
  const items = (o.items || []).filter(it => t >= it.t && it.t >= s.start - .5).map(it => {
    const xy = Array.isArray(it.pos) ? it.pos : proj(it.pos); return { ...it, xy };
  });
  for (const it of items) {
    // pills/labels presos fora da tela ficam dentro da margem
    const x = clamp(it.xy[0], 230, W - 230), y = clamp(it.xy[1], 380, H - 300);
    if (it.kind === 'label') label3D(it.txt, x, y, t - it.t); else pill(it.txt, x, y, t - it.t, it);
  }
  if (o.end !== undefined) endCard(o.end);
  subtitle(t);
  const lt = t - s.start;
  if (lt < .07 && i > 0) { ctx.fillStyle = `rgba(255,255,255,${.3 * (1 - lt / .07)})`; ctx.fillRect(0, 0, W, H); }
};
window.ready = true;
