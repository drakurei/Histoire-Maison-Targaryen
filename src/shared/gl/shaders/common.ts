/**
 * Morceaux GLSL communs aux shaders de la matière (GLSL ES 1.00 : valable en WebGL 1 et 2).
 *
 * Ce fichier n'importe rien et n'emploie que du TypeScript effaçable : `scripts/gl-lab.mjs`
 * le charge tel quel sous Node pour recopier le GLSL dans le banc d'essai.
 */

/** Sommet unique : un triangle qui couvre tout l'écran (pas de quad à deux triangles, pas de couture). */
export const VERTEX = /* glsl */ `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/** Précision et uniformes posés par `createShaderCanvas` sur chaque fragment. */
export const HEADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;      // taille du tampon de dessin, en pixels physiques
uniform float u_time;    // secondes écoulées pendant que le canvas tourne
uniform vec2 u_pointer;  // pointeur, 0..1, origine en bas à gauche
uniform float u_dpr;     // pixels physiques par pixel CSS
`;

/**
 * Bruits. Hachages sans sinus (Dave Hoskins) : stables en précision moyenne et sous SwiftShader.
 * `noised` rend la valeur et ses deux dérivées : le relief de la pierre s'éclaire sans
 * différences finies, donc en une seule évaluation.
 */
export const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Bruit de valeur à interpolation quintique, avec dérivées analytiques (x : valeur, yz : gradient).
vec3 noised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * (vec2(k1, k2) + k4 * u.yx));
}

float vnoise(vec2 x) {
  return noised(x).x;
}

// Rotation entre deux octaves : casse l'alignement sur la grille.
const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8);

float fbm4(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = OCT * p * 2.03;
    a *= 0.5;
  }
  return s / 0.9375;
}

float fbm6(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    s += a * vnoise(p);
    p = OCT * p * 2.01;
    a *= 0.5;
  }
  return s / 0.984375;
}

// fbm avec gradient : la matrice de passage suit les octaves (transposée de OCT, facteur 2).
vec3 fbmd5(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  vec2 d = vec2(0.0);
  mat2 m = mat2(1.0, 0.0, 0.0, 1.0);
  mat2 back = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    vec3 n = noised(p);
    s += a * n.x;
    d += a * (m * n.yz);
    a *= 0.5;
    p = OCT * p * 2.0;
    m = 2.0 * back * m;
  }
  return vec3(s, d) / 0.96875;
}

vec3 srgbToLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 linearToSrgb(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}

// Tramage d'un demi-niveau : pas de bandes dans les noirs profonds.
float dither(vec2 frag) {
  return (hash12(frag + fract(u_time) * 61.0) - 0.5) / 255.0;
}
`;

/** Couleurs de DESIGN.md en sRGB 0..1, injectées en constantes. */
export const PALETTE = /* glsl */ `
const vec3 OBSIDIENNE = vec3(0.0667, 0.0510, 0.0510); // #110d0d
const vec3 SANG = vec3(0.6902, 0.0824, 0.1333);       // #b01522
const vec3 BRAISE = vec3(0.9412, 0.3765, 0.1647);     // #f0602a
`;
