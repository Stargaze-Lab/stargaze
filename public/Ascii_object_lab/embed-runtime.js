// ASCII / OBJECT LAB — embedded viewer runtime.
// This script is copied INLINE into the export. Model data is embedded as Base64 GLB.
// Only the MIT-licensed Three.js modules are loaded from a public CDN.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = 1000, H = 760, SAMPLE_W = 640, SAMPLE_H = 486;
const settings = EMBED_CONFIG.params;
const out = document.querySelector('#ascii');
const ctx = out.getContext('2d', { alpha: false });
const sample = document.createElement('canvas');
sample.width = SAMPLE_W;
sample.height = SAMPLE_H;
const sctx = sample.getContext('2d', { willReadFrequently: true });
const layer = document.querySelector('#interaction');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(1);
renderer.setSize(SAMPLE_W, SAMPLE_H, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const camera = new THREE.PerspectiveCamera(36, W / H, .1, 100);
camera.position.fromArray(EMBED_CONFIG.camera);
const controls = new OrbitControls(camera, layer);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.enablePan = false;
controls.minDistance = 3.1;
controls.maxDistance = 13;
controls.target.fromArray(EMBED_CONFIG.target);
controls.update();
const root = new THREE.Group();
root.rotation.fromArray(EMBED_CONFIG.rotation);
scene.add(root);
const ambient = new THREE.AmbientLight(0xffffff, Number(settings.ambient));
const key = new THREE.DirectionalLight(0xffffff, Number(settings.keyLight));
key.position.set(Number(settings.lightX), Number(settings.lightY), 6);
const fill = new THREE.DirectionalLight(0x9e98ff, .32);
fill.position.set(3, -3, -5);
scene.add(ambient, key, fill);
let rebuild = settings.rebuildEnabled ? 0 : 1;
let playing = true;
let dirty = true;
let lastTime = 0;
const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
const blend = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => toHex(v + (B[i] - v) * t)).join('');
};
const glyphColor = v => v < .56
  ? blend(settings.shadowColor, settings.midColor, clamp(v / .56))
  : blend(settings.midColor, settings.highColor, clamp((v - .56) / .44));
function cellHash(x, y) {
  let n = (Math.imul(x + 311, 374761393) + Math.imul(y + 197, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
let seed = 61213;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const stars = Array.from({ length: 96 }, () => ({
  x: random() * W, y: random() * H,
  type: random() > .85 ? 'cross' : 'dot', size: .6 + random() * .6, opacity: .16 + random() * .37
}));
function backdrop() {
  ctx.globalAlpha = 1;
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, W, H);
  if (!settings.guides) return;
  const accent = rgb(settings.midColor);
  ctx.save();
  ctx.strokeStyle = `rgba(${accent.join(',')},.44)`;
  ctx.lineWidth = 1.3;
  ctx.setLineDash([3, 10]);
  ctx.beginPath();ctx.moveTo(-35, 200);ctx.bezierCurveTo(290, 121, 620, 155, 1035, 59);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-35, 651);ctx.bezierCurveTo(297, 568, 729, 602, 1036, 505);ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(${accent.join(',')},.5)`;
  ctx.beginPath();ctx.moveTo(805, 520);ctx.bezierCurveTo(900, 430, 947, 340, 1030, 266);ctx.stroke();
  for (const s of stars) {
    ctx.globalAlpha = s.opacity;
    if (s.type === 'dot') { ctx.fillStyle = settings.midColor; ctx.fillRect(s.x, s.y, s.size, s.size); }
    else {
      ctx.beginPath();ctx.moveTo(s.x - 4, s.y);ctx.lineTo(s.x + 4, s.y);
      ctx.moveTo(s.x, s.y - 4);ctx.lineTo(s.x, s.y + 4);ctx.stroke();
    }
  }
  ctx.restore();
}
function sampleCell(image, fx, fy, dx, dy) {
  const d = image.data;
  let alpha = 0, lum = 0;
  for (const [ox, oy] of [[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]]) {
    const x = clamp(Math.floor((fx + ox * dx) * SAMPLE_W / W), 0, SAMPLE_W - 1);
    const y = clamp(Math.floor((fy + oy * dy) * SAMPLE_H / H), 0, SAMPLE_H - 1);
    const i = (y * SAMPLE_W + x) * 4;
    const a = d[i + 3] / 255;
    alpha += a;
    lum += (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) * a;
  }
  return alpha < .4 ? { coverage: 0, lum: 0 } : { coverage: alpha / 4, lum: lum / (alpha * 255) };
}
function tone(v, x, y) {
  let t = Math.pow(clamp((v - .5) * Number(settings.contrast) + .5 + Number(settings.exposure)), 1 / Number(settings.gamma));
  t = clamp(t + (bayer[y % 4][x % 4] - 7.5) / 16 * Number(settings.dither) / 100 * .33);
  return settings.invert ? 1 - t : t;
}
function render() {
  renderer.render(scene, camera);
  sctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H);
  sctx.drawImage(renderer.domElement, 0, 0, SAMPLE_W, SAMPLE_H);
  const pixels = sctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
  backdrop();
  const h = Number(settings.cellSize), w = h * .65;
  const cols = Math.floor(W / w), rows = Math.floor(H / h);
  const dx = W / cols, dy = H / rows;
  const chars = Array.from(settings.charsetInput || ' .,:;i1rXSGMH');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(h * .95)}px ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace`;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const px = (x + .5) * dx, py = (y + .5) * dy;
    const p = sampleCell(pixels, px, py, dx, dy);
    if (p.coverage < .2) continue;
    const t = tone(p.lum, x, y);
    const index = Math.min(chars.length - 1, Math.floor(t * chars.length));
    let char = chars[index] || ' ', gx = px, gy = py, a = 1;
    if (rebuild < 1) {
      const threshold = .72 * (.55 * y / rows + .45 * cellHash(x, y));
      const local = clamp((rebuild - threshold) / .24);
      if (local <= 0) continue;
      if (local < .98) {
        const jitter = 1 - local, wobble = Math.floor(rebuild * 90);
        gx += (cellHash(x + wobble, y) - .5) * h * 7 * jitter;
        gy += (cellHash(x, y + wobble) - .5) * h * 7 * jitter;
        const alt = Math.floor(cellHash(x + wobble, y + 73) * chars.length);
        if (cellHash(x + 91, y + wobble) > (.3 + .7 * local)) char = chars[alt] || char;
        a = .20 + .8 * local;
      }
    }
    if (char === ' ') continue;
    ctx.fillStyle = glyphColor(t);
    ctx.globalAlpha = clamp(p.coverage * 1.5, .3, 1) * a;
    ctx.fillText(char, gx, gy);
  }
  ctx.globalAlpha = 1;
}
function frame(now) {
  requestAnimationFrame(frame);
  if (!playing || now - lastTime < 48) return;
  const dt = Math.min((now - lastTime) / 1000, .1); lastTime = now;
  if (settings.autoRotate) { root.rotation.y += dt * Number(settings.speed) * .42; dirty = true; }
  if (rebuild < 1) { rebuild = Math.min(1, rebuild + dt / Number(settings.rebuildTime)); dirty = true; }
  controls.update();
  if (dirty) { render(); dirty = false; }
}
controls.addEventListener('change', () => { dirty = true; });
document.addEventListener('visibilitychange', () => { playing = !document.hidden; lastTime = performance.now(); });
document.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') { rebuild = 0; dirty = true; }
});
try {
  const bin = atob(EMBED_GLB_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const gltf = await new Promise((resolve, reject) =>
    new GLTFLoader().parse(bytes.buffer, '', resolve, reject));
  root.add(gltf.scene);
  dirty = true;
  requestAnimationFrame(frame);
} catch (error) {
  console.error('ASCII embed failed:', error);
  document.querySelector('#error').textContent = 'Unable to render this embedded 3D model.';
  document.querySelector('#error').hidden = false;
}
