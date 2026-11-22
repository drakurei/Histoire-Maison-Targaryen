import { HEADER, NOISE, PALETTE } from './common.ts';

/**
 * Dissolution par le feu.
 *
 * Un front irrégulier (bruit fractal) part d'un point et traverse la surface. Devant lui, rien :
 * la page reste visible, à peine roussie sur quelques pixels. Sur le front, un liseré
 * incandescent étroit. Derrière, la suie, avec quelques points encore rouges qui s'éteignent.
 * Une seconde passe (`u_clear`) fait tomber la suie et rend la surface d'en dessous :
 * le feu efface, puis révèle.
 *
 * Sortie en alpha prémultiplié, à poser par-dessus la page.
 *
 * Uniformes propres :
 * - u_progress (0..1)  avance du front ; 0 : rien n'a brûlé, 1 : tout est suie.
 * - u_clear    (0..1)  chute de la suie ; 0 : la suie couvre, 1 : tout est rendu.
 * - u_origin   (vec2)  point de départ du feu, 0..1, origine en bas à gauche.
 * - u_seed             change le dessin du front.
 */
export const BURN = /* glsl */ `${HEADER}
uniform float u_progress;
uniform float u_clear;
uniform vec2 u_origin;
uniform float u_seed;
${NOISE}
${PALETTE}

// Champ de combustion : 0 près de l'origine, 1 au coin le plus éloigné, déformé par le bruit.
float field(vec2 uv, vec2 frag, vec2 aspect, vec2 origin, float seed, float crawl) {
  vec2 p = uv * aspect;
  vec2 o = origin * aspect;
  vec2 far = max(o, aspect - o);
  float dist = length(p - o) / length(far);
  float coarse = fbm4(p * 2.4 + seed * 13.1) - 0.5;
  float fine = fbm4(p * 9.0 + seed * 7.7 + vec2(0.0, crawl)) - 0.5;
  // Le papier ne brûle pas en nuage : un bord déchiqueté, fibreux, à l'échelle du pixel.
  // Mesuré en pixels CSS, pas en fraction d'écran : même grain sur un téléphone et sur un grand écran.
  float ragged = fbm4(frag / (u_dpr * vec2(22.0, 27.0)) + seed * 3.1) - 0.5;
  return dist * 0.74 + coarse * 0.46 + fine * 0.12 + ragged * 0.035 + 0.13;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_res;
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  // Unités du champ par pixel physique : la distance occupe 0,74 du champ sur la diagonale.
  float px = 0.8 / (u_res.y * length(aspect));

  float crawl = u_time * 0.35;
  float f = field(uv, frag, aspect, u_origin, u_seed, crawl);
  float front = mix(-0.14, 1.16, u_progress);
  float x = front - f; // > 0 : brûlé ; < 0 : pas encore atteint

  vec3 sang = srgbToLinear(SANG);
  vec3 braise = srgbToLinear(BRAISE);
  vec3 hot = srgbToLinear(vec3(1.0, 0.78, 0.50));

  // Roussi : une bande étroite devant le front, brun translucide.
  float scorchReach = (14.0 + 16.0 * vnoise(uv * aspect * 24.0 + u_seed)) * px;
  float scorch = smoothstep(-scorchReach, 0.0, x) * (1.0 - smoothstep(0.0, 2.0 * px, x));
  // Suie : opaque dès que le front est passé.
  float soot = smoothstep(0.0, 3.0 * px, x);

  // Liseré : quelques pixels, centrés juste derrière le front ; son épaisseur varie.
  float thick = (1.2 + 1.6 * vnoise(uv * aspect * 40.0 + u_seed)) * u_dpr * px;
  float rim = exp(-pow((x - thick * 0.6) / thick, 2.0));
  // Le liseré n'est pas un néon continu : il s'affaiblit et se ravive le long du front.
  float along = 0.55 + 0.45 * vnoise(uv * aspect * 18.0 + vec2(u_time * 0.8, u_seed));
  rim *= along;

  // Braise résiduelle derrière le front : des points rouges qui meurent en quelques dizaines de pixels.
  float behind = smoothstep(0.0, 4.0 * px, x) * (1.0 - smoothstep(0.0, 45.0 * px, x));
  // Points ronds d'un pixel ou deux, un sur dix cellules : jamais de pavés.
  vec2 sc = frag / (7.0 * u_dpr);
  vec2 sid = floor(sc);
  vec2 spos = 0.2 + 0.6 * hash22(sid + u_seed);
  float sdist = length(fract(sc) - spos) * 7.0;
  float sparks = step(hash12(sid + 5.0 + u_seed), 0.12) * (1.0 - smoothstep(0.4, 1.3, sdist)) * behind;
  sparks *= 0.5 + 0.5 * vnoise(sid * 0.7 + u_time * 2.0);
  float glowBand = exp(-max(x, 0.0) / (12.0 * px)) * soot * 0.12;

  // ---------------------------------------------------------------- Chute de la suie
  float clearMask = 0.0;
  float clearRim = 0.0;
  if (u_clear > 0.0) {
    float f2 = field(uv, frag, aspect, u_origin, u_seed + 4.7, crawl * 0.6);
    float front2 = mix(-0.14, 1.16, u_clear);
    float x2 = front2 - f2;
    clearMask = smoothstep(0.0, 2.0 * px, x2);
    float t2 = (2.0 + 1.5 * vnoise(uv * aspect * 36.0 + 9.0)) * u_dpr * px;
    clearRim = exp(-pow((x2 + t2 * 0.8) / t2, 2.0)) * soot;
  }

  // ---------------------------------------------------------------- Couleurs
  float charTex = fbm4(uv * aspect * 60.0 + u_seed);
  vec3 sootCol = srgbToLinear(OBSIDIENNE) * (0.75 + 0.5 * charTex);
  // Cendre grise sur le papier entièrement consumé, par plaques, à peine visible.
  float ashy = smoothstep(0.55, 0.9, fbm4(frag / (u_dpr * vec2(9.0, 12.0)) + u_seed * 2.0)) * smoothstep(60.0 * px, 220.0 * px, x);
  sootCol = mix(sootCol, srgbToLinear(vec3(0.15, 0.14, 0.135)), ashy * 0.16);
  // Juste derrière le front, la suie est encore brune, le papier carbonisé.
  float fresh = 1.0 - smoothstep(0.0, 26.0 * px, x);
  sootCol = mix(sootCol, srgbToLinear(vec3(0.16, 0.075, 0.045)), fresh * 0.8);
  vec3 scorchCol = srgbToLinear(vec3(0.42, 0.24, 0.12));

  // Le feu du papier est orangé ; le rouge sang ne reste qu'aux braises qui meurent sur la suie.
  vec3 ember = srgbToLinear(vec3(0.62, 0.13, 0.05));
  vec3 rimCol = mix(ember, braise, smoothstep(0.15, 0.6, rim));
  rimCol = mix(rimCol, hot, smoothstep(0.85, 1.0, rim) * 0.45);
  vec3 emit = rimCol * rim * 1.9;
  emit += mix(sang * 0.5, braise, 0.3) * sparks * 1.4;
  emit += sang * glowBand;
  emit += mix(ember, braise, 0.25) * clearRim * 0.9;

  float keep = 1.0 - clearMask;
  float aSoot = soot * keep;
  float aScorch = scorch * 0.38 * (1.0 - soot);
  float alpha = max(aSoot, aScorch);

  // Couleur de la matière non prémultipliée, convertie, puis multipliée par sa couverture ;
  // la lumière du feu s'ajoute par-dessus (alpha nul : elle éclaire ce qui est dessous).
  vec3 base = (sootCol * aSoot + scorchCol * aScorch) / max(alpha, 1e-3);
  emit *= mix(1.0, keep, step(0.001, u_clear));
  vec3 rgbBase = linearToSrgb(1.0 - exp(-base * 1.4)) * alpha;
  vec3 rgbEmit = linearToSrgb(1.0 - exp(-emit * 1.4));
  vec3 rgb = rgbBase + rgbEmit;
  gl_FragColor = vec4(rgb, alpha);
}
`;

/** Valeurs par défaut des uniformes propres à la dissolution. */
export const BURN_DEFAULTS = {
  u_progress: 0,
  u_clear: 0,
  u_origin: [0.08, 0.04] as [number, number],
  u_seed: 0,
};
