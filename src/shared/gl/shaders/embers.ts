import { HEADER, NOISE, PALETTE } from './common.ts';

/**
 * Braises et cendres qui montent, rares, à des profondeurs différentes.
 *
 * Cinq plans de profondeur. Les plans proches montent plus vite, sont plus gros et hors de
 * la mise au point (disque flou, pâle) ; les plans lointains sont des points nets et lents.
 * Une braise refroidit en montant : orange au départ, rouge sang, puis éteinte. Les cendres
 * ne brillent pas : flocons gris irréguliers qui tournent sur eux-mêmes et masquent un peu
 * ce qui est derrière.
 *
 * Sortie en alpha prémultiplié : la lumière des braises s'ajoute (alpha nul), la cendre couvre.
 * Le canvas se pose donc par-dessus n'importe quelle surface.
 *
 * Uniformes propres :
 * - u_density (0..1)  nombre de particules ; 0.35 : quelques-unes à l'écran à la fois.
 * - u_rise    (> 0)   vitesse de montée ; 1 par défaut.
 */
export const EMBERS = /* glsl */ `${HEADER}
uniform float u_density;
uniform float u_rise;
${NOISE}
${PALETTE}

const int LAYERS = 5;

void main() {
  vec2 frag = gl_FragCoord.xy;
  // Unités : hauteur d'écran, mais bornée pour qu'un grand écran ne multiplie pas les braises.
  float unit = clamp(u_res.y, 420.0 * u_dpr, 1100.0 * u_dpr);
  vec2 uv = frag / unit;
  float pxPerUnit = unit;
  float vy = frag.y / u_res.y; // hauteur relative dans la fenêtre, 0 en bas

  vec3 light = vec3(0.0);
  float cover = 0.0;
  vec3 ashPre = vec3(0.0); // cendre, prémultipliée, du plus proche au plus lointain

  for (int i = 0; i < LAYERS; i++) {
    float fi = float(i);
    float z = (fi + 0.5) / float(LAYERS);          // 0 : tout près, 1 : loin
    float cells = mix(2.6, 9.0, z);                 // cellules par unité
    float speed = mix(0.22, 0.05, z) * u_rise;      // unités par seconde
    vec2 p = uv * cells;
    float travel = u_time * speed * cells;
    p.y -= travel;
    // Le courant d'air chaud : une dérive lente, différente à chaque hauteur.
    p.x += (vnoise(vec2(p.y * 0.35, fi * 7.0 + u_time * 0.05)) - 0.5) * 1.4;

    vec2 cell = floor(p);
    vec2 f = fract(p);
    float h = hash12(cell + fi * 37.1);
    float present = step(h, u_density * mix(0.10, 0.28, z));
    if (present < 0.5) continue;

    vec2 h2 = hash22(cell + fi * 11.3);
    vec2 pos = 0.25 + 0.5 * h2;
    float wob = u_time * (0.5 + h2.y) + h * 40.0;
    pos.x += 0.12 * sin(wob) * (1.0 - z * 0.5);
    float cellPx = pxPerUnit / cells;
    vec2 d = (f - pos) * cellPx;                    // écart en pixels physiques
    // Rien ne doit franchir le bord de la cellule : sinon une couture carrée apparaît.
    vec2 room = min(pos, 1.0 - pos);
    float roomPx = min(room.x, room.y) * cellPx;

    float kind = hash12(cell + fi * 5.7 + 2.0);
    // Mise au point sur le plan médian : les plans proches s'élargissent.
    float blur = pow(max(0.0, 0.55 - z) / 0.55, 2.0) * 3.0 * u_dpr;
    float win = 1.0 - smoothstep(roomPx * 0.55, roomPx * 0.95, length(d));

    if (kind < 0.4) {
      // Cendre : flocon allongé, irrégulier, qui tourne.
      float ang = u_time * (0.4 + 0.8 * h2.x) * (h2.y < 0.5 ? -1.0 : 1.0) + h * 6.28;
      mat2 rot = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));
      vec2 r = rot * d;
      float size = mix(5.0, 2.2, z) * u_dpr;
      float edge = (vnoise(normalize(r + 1e-4) * 2.0 + cell) - 0.5) * 0.7;
      float sd = length(r / vec2(size, size * (0.35 + 0.3 * h2.x))) - 1.0 - edge;
      float a = 1.0 - smoothstep(-0.2, 0.2 + blur / size, sd);
      a *= mix(0.8, 0.5, z) * win;
      // Elle passe à la lumière par moments en tournant.
      float sheen = 0.5 + 0.5 * cos(ang * 2.0);
      vec3 c = mix(vec3(0.13, 0.115, 0.11), vec3(0.34, 0.29, 0.25), sheen * 0.7);
      ashPre += (1.0 - cover) * c * a;
      cover += (1.0 - cover) * a;
    } else {
      // Braise : refroidit en montant, scintille un peu.
      float cool = clamp(vy * 0.85 + h2.x * 0.35 - 0.1, 0.0, 1.0);
      float temp = 1.0 - cool;
      float flick = 0.7 + 0.3 * vnoise(vec2(u_time * 6.0 + h * 50.0, fi));
      // Petit filé vertical : la braise bouge pendant le temps de pose.
      vec2 ds = d / vec2(1.0, 1.0 + 0.7 * (1.0 - z));
      float r = length(ds);
      float core = mix(1.4, 0.75, z) * u_dpr;
      float spread = core + blur;
      float energy = (core * core) / (spread * spread);
      float disc = exp(-pow(r / spread, 2.0));
      float halo = exp(-r / (spread * 1.6)) * 0.025 * (1.0 - smoothstep(roomPx * 0.5, roomPx, r));
      vec3 sang = srgbToLinear(SANG);
      vec3 braise = srgbToLinear(BRAISE);
      vec3 hot = srgbToLinear(vec3(1.0, 0.72, 0.42));
      vec3 c = mix(sang * 0.45, sang, smoothstep(0.1, 0.5, temp));
      c = mix(c, braise, smoothstep(0.45, 0.85, temp));
      c = mix(c, hot, smoothstep(0.9, 1.0, temp) * 0.6);
      float gain = temp * temp * flick * mix(1.0, 0.55, z);
      light += c * (disc * energy * 3.2 + halo) * gain * win;
    }
  }

  // Lumière tonale douce, puis retour en sRGB ; alpha prémultiplié.
  light = 1.0 - exp(-light);
  vec3 glow = linearToSrgb(light);
  vec3 rgb = ashPre + glow * (1.0 - cover * 0.6);
  gl_FragColor = vec4(rgb, cover);
}
`;

/** Valeurs par défaut des uniformes propres aux braises. */
export const EMBERS_DEFAULTS = {
  u_density: 0.35,
  u_rise: 1,
};
