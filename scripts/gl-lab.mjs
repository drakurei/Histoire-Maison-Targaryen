// Banc d'essai des shaders de la matière (src/shared/gl/shaders).
// Écrit design/prototypes/gl-lab.html : une page autonome qui rend chaque shader à plusieurs
// instants figés, avec le GLSL recopié depuis les modules (chargés tels quels : Node efface les types).
// Usage : node scripts/gl-lab.mjs
// Puis :  node scripts/serial.mjs node scripts/render.mjs design/prototypes/gl-lab.html design/prototypes/gl-lab.png 1600 1200 --wait=1500
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const mod = await import(pathToFileURL(path.join(root, 'src/shared/gl/shaders/index.ts')).href);
const { VERTEX, BASALT, BASALT_DEFAULTS, EMBERS, EMBERS_DEFAULTS, BURN, BURN_DEFAULTS } = mod;

const frac = (n) => String(n).replace('.', ',');
function burnTile(caption, u) {
  return { w: 496, h: 170, caption, folio: true, layers: [{ s: 'burn', u }] };
}

/** Planches : chaque tuile nomme ses couches (de la plus basse à la plus haute) et leurs uniformes. */
const rows = [
  {
    title: 'Basalte',
    tiles: [
      { w: 496, h: 270, caption: 'froid, chaleur 0', layers: [{ s: 'basalt', u: { u_heat: 0, u_time: 0 } }] },
      { w: 1016, h: 270, caption: 'chaleur 0,8, t 5 s : le feu affleure par poches', layers: [{ s: 'basalt', u: { u_heat: 0.8, u_time: 5 } }] },
    ],
  },
  {
    title: 'Braises et cendres',
    tiles: [
      { w: 496, h: 270, caption: 'densité 0,35 sur obsidienne, t 4 s', bg: '#110d0d', layers: [{ s: 'embers', u: { u_time: 4 } }] },
      {
        w: 496,
        h: 270,
        caption: 'densité 0,6 sur basalte, t 9 s',
        layers: [
          { s: 'basalt', u: { u_heat: 0.3, u_time: 9, u_seed: 5 } },
          { s: 'embers', u: { u_time: 9, u_density: 0.6 } },
        ],
      },
      { w: 496, h: 270, caption: 'densité 1, t 17 s', bg: '#110d0d', layers: [{ s: 'embers', u: { u_time: 17, u_density: 1 } }] },
    ],
  },
  {
    title: 'Dissolution par le feu, sur un folio de vélin',
    tiles: [0.22, 0.48, 0.72].map((p) => burnTile(`avance ${frac(p)}`, { u_progress: p, u_time: 2 + p * 3 })),
  },
  {
    title: '',
    tiles: [
      burnTile('avance 1, tout est suie', { u_progress: 1, u_time: 5 }),
      burnTile('chute de la suie 0,35', { u_progress: 1, u_clear: 0.35, u_time: 6 }),
      burnTile('chute de la suie 0,7', { u_progress: 1, u_clear: 0.7, u_time: 6.5 }),
    ],
  },
];

const shaders = {
  basalt: { fragment: BASALT, defaults: BASALT_DEFAULTS },
  embers: { fragment: EMBERS, defaults: EMBERS_DEFAULTS },
  burn: { fragment: BURN, defaults: BURN_DEFAULTS },
};

const html = `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<title>Banc d'essai de la matière</title>
<style>
  html, body { margin: 0; background: #141011; color: #c9bfb2; }
  body { padding: 28px 32px; font: 15px/1.4 'Alegreya Sans', 'Gill Sans', Candara, sans-serif; }
  h1 { font: 400 26px/1 'Texturina', Georgia, serif; letter-spacing: -0.02em; margin: 0 0 18px; color: #ebe2d0; }
  h2 { font: 400 18px/1 'Texturina', Georgia, serif; letter-spacing: -0.01em; margin: 14px 0 8px; color: #ebe2d0; }
  .row { display: flex; gap: 24px; align-items: flex-start; }
  figure { margin: 0; }
  figcaption { margin-top: 6px; font-size: 13px; color: #9d9285; }
  canvas { display: block; }
  pre { color: #f0602a; white-space: pre-wrap; font-size: 12px; }
</style>
<body>
<h1>banc d'essai de la matière</h1>
<div id="board"></div>
<pre id="log"></pre>
<script>
const VERTEX = ${JSON.stringify(VERTEX)};
const SHADERS = ${JSON.stringify(shaders)};
const ROWS = ${JSON.stringify(rows)};
const log = (m) => { document.getElementById('log').textContent += m + '\\n'; console.error(m); };

const glCanvas = document.createElement('canvas');
const gl = glCanvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false })
  || glCanvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false });
if (!gl) log('WebGL indisponible');

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const programs = {};
function program(name) {
  if (programs[name]) return programs[name];
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, SHADERS[name].fragment));
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return (programs[name] = p);
}
if (gl) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

function draw(name, uniforms, w, h) {
  glCanvas.width = w; glCanvas.height = h;
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const p = program(name);
  gl.useProgram(p);
  const all = Object.assign({ u_res: [w, h], u_pointer: [0.5, 0.5], u_dpr: 1, u_time: 0 }, SHADERS[name].defaults, uniforms);
  for (const [k, v] of Object.entries(all)) {
    const loc = gl.getUniformLocation(p, k);
    if (!loc) continue;
    const a = Array.isArray(v) ? v : [v];
    gl['uniform' + a.length + 'fv'](loc, a);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function folio(ctx, w, h) {
  ctx.fillStyle = '#e8ddc6';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#8f1d1c';
  ctx.font = '600 26px Georgia, serif';
  ctx.fillText('la conquête', 22, 44);
  ctx.fillStyle = '#3b2a22';
  ctx.font = '15px Georgia, serif';
  const line = "En l'an premier, Aegon débarqua au pied de la colline qui porte aujourd'hui son nom, avec ses deux sœurs et leurs trois dragons.";
  const words = line.split(' ');
  let y = 74, cur = '';
  for (let k = 0; k < 4; k++) {
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(t).width > w - 44) { ctx.fillText(cur, 22, y); y += 22; cur = wd; } else cur = t;
      if (y > h - 10) return;
    }
  }
}

const board = document.getElementById('board');
const t0 = performance.now();
for (const row of ROWS) {
  if (row.title) { const h2 = document.createElement('h2'); h2.textContent = row.title.toLowerCase(); board.appendChild(h2); }
  const div = document.createElement('div');
  div.className = 'row';
  board.appendChild(div);
  for (const tile of row.tiles) {
    const fig = document.createElement('figure');
    const c = document.createElement('canvas');
    c.width = tile.w; c.height = tile.h;
    const ctx = c.getContext('2d');
    if (tile.bg) { ctx.fillStyle = tile.bg; ctx.fillRect(0, 0, tile.w, tile.h); }
    if (tile.folio) folio(ctx, tile.w, tile.h);
    try {
      for (const layer of tile.layers) {
        draw(layer.s, layer.u, tile.w, tile.h);
        ctx.drawImage(glCanvas, 0, 0);
      }
    } catch (e) { log(String(e && e.message || e)); }
    const cap = document.createElement('figcaption');
    cap.textContent = tile.caption;
    fig.append(c, cap);
    div.appendChild(fig);
  }
}
log('rendu en ' + Math.round(performance.now() - t0) + ' ms');
</script>
</body>
</html>
`;

const out = path.join(root, 'design/prototypes/gl-lab.html');
fs.writeFileSync(out, html);
console.log('Écrit : ' + path.relative(root, out));
