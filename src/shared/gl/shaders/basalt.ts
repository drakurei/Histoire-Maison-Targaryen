import { HEADER, NOISE, PALETTE } from './common.ts';

/**
 * Basalte : pierre volcanique noire vue de près, sous une lumière rasante chaude.
 *
 * Ce qu'on doit voir, dans l'ordre : un grain minéral fin qui accroche la lumière ; un réseau de
 * fissures de refroidissement (plaques polygonales irrégulières, légèrement basculées l'une par
 * rapport à l'autre) ; des vacuoles de gaz ; et, au fond de quelques fissures seulement, une lueur
 * rouge contenue qui respire lentement. La pierre domine, le feu reste en dessous.
 *
 * Uniformes propres :
 * - u_heat  (0..1)  part des fissures où le feu affleure et son intensité ; 0 : pierre froide.
 * - u_light (vec2)  direction d'où vient la lumière, dans le plan de l'écran (y vers le haut).
 *                   Par défaut, bas gauche : vec2(-0.8, -0.6).
 * - u_scale (> 0)   taille des plaques ; 1 : une plaque d'environ 340 px CSS.
 * - u_seed          déplace le motif sans le changer de nature.
 */
export const BASALT = /* glsl */ `${HEADER}
uniform float u_heat;
uniform vec2 u_light;
uniform float u_scale;
uniform float u_seed;
${NOISE}
${PALETTE}

// Voronoï avec distance à l'arête la plus proche (méthode d'Inigo Quilez).
// x : distance à l'arête ; yz : direction qui s'éloigne de l'arête ; w : identifiant de la plaque.
vec4 cracks(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = 0.12 + 0.76 * hash22(n + g);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) { md = d; mr = r; mg = g; }
    }
  }
  md = 8.0;
  vec2 away = vec2(0.0, 1.0);
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = 0.12 + 0.76 * hash22(n + g);
      vec2 r = g + o - f;
      vec2 e = r - mr;
      if (dot(e, e) > 0.00001) {
        vec2 en = normalize(e);
        float d = dot(0.5 * (mr + r), en);
        if (d < md) { md = d; away = -en; }
      }
    }
  }
  return vec4(md, away, hash12(n + mg));
}

// Vacuoles : petites cavités rondes, groupées en essaims. x : profondeur 0..1 ; yz : pente.
vec3 vesicles(vec2 x, float swarm) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float best = 8.0;
  vec2 br = vec2(0.0);
  float bh = 1.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 h = hash22(n + g + 71.0);
      vec2 r = g + 0.2 + 0.6 * h - f;
      float d = dot(r, r);
      if (d < best) { best = d; br = r; bh = hash12(n + g + 13.0); }
    }
  }
  float rad = 0.07 + 0.2 * pow(fract(bh * 7.13), 2.0);
  float present = step(bh, 0.32 * swarm);
  float d = sqrt(best);
  float depth = present * (1.0 - smoothstep(rad * 0.6, rad, d));
  // Paroi : bande étroite où la cavité remonte vers la surface ; la pente pointe vers le centre.
  float wall = smoothstep(rad * 0.4, rad * 0.8, d) * (1.0 - smoothstep(rad * 0.8, rad * 1.05, d)) * 3.0;
  return vec3(depth, present * wall * normalize(br + 1e-4));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float dpr = max(u_dpr, 0.5);
  float plate = 340.0 * max(u_scale, 0.05);   // taille d'une plaque, en px CSS
  vec2 q = frag / (dpr * plate) + u_seed * vec2(3.17, 1.93);
  float pxc = 1.0 / plate;                      // un px CSS, en unités de plaque
  vec2 centered = (frag - 0.5 * u_res) / u_res.y;

  // Déformation douce : les arêtes de refroidissement ne sont jamais droites.
  vec2 warp = vec2(fbm4(q * 1.4), fbm4(q * 1.4 + vec2(5.2, 1.3))) - 0.5;
  vec2 w = q + 0.28 * warp;

  // ---------------------------------------------------------------- Fissures
  vec4 big = cracks(w);
  const float SMALL = 2.7;
  vec4 small = cracks(w * SMALL + vec2(17.0, 4.0));
  float dBig = big.x / pxc;                      // distance à l'arête, en px CSS
  float dSmall = small.x / (pxc * SMALL);

  // Demi-largeur de la fente : de la fêlure (0,4 px) à la fente ouverte (3 px), avec des éclats.
  // La plupart des joints sont refermés (un cheveu) ; quelques-uns seulement sont ouverts.
  float open = smoothstep(0.42, 0.8, fbm4(q * 1.25 + 3.0));
  float chips = 0.65 + 0.7 * vnoise(w * 60.0);
  float hw = mix(0.3, 3.0, open) * chips;
  float bevel = 1.2 + hw * 0.9;
  // Fissures secondaires : des cheveux, qui s'éteignent dans la pierre.
  float smallOn = smoothstep(0.45, 0.65, fbm4(q * 1.1 + 9.0));
  float hwSmall = (0.3 + 0.5 * vnoise(w * 31.0)) * smallOn;

  // Par endroits le joint est soudé : la fêlure disparaît dans la masse.
  float sealed = max(smoothstep(0.3, 0.55, vnoise(w * 2.6 + 40.0)), open);
  float slit = (1.0 - smoothstep(hw * 0.6, hw + 0.6, dBig)) * sealed;
  float hair = (1.0 - smoothstep(hwSmall * 0.5, hwSmall + 0.7, dSmall)) * smallOn;
  float lip = smoothstep(hw, hw + bevel, dBig);  // 0 au bord de la fente, 1 sur la plaque
  float lipSlope = (1.0 - lip) * step(hw * 0.6, dBig) * sealed;

  // ---------------------------------------------------------------- Relief
  vec3 grain = fbmd5(q * 95.0);
  vec3 rough = fbmd5(q * 17.0 + 7.0);
  vec3 swell = fbmd5(q * 2.2 + 11.0);
  float swarm = smoothstep(0.35, 0.8, vnoise(q * 3.5 + 2.0));
  vec3 ves = vesicles(q * 30.0, swarm);
  // Chaque plaque est un peu basculée : elle ne prend pas la lumière comme sa voisine.
  vec2 tilt = (hash22(vec2(big.w * 91.0, big.w * 37.0)) - 0.5) * 0.1;

  vec2 grad = grain.yz * 0.12 + rough.yz * 0.04 + swell.yz * 0.1 + tilt;
  grad += big.yz * lipSlope * 0.85;
  grad -= ves.yz * 0.8;
  vec3 nrm = normalize(vec3(-grad, 1.0));

  // ---------------------------------------------------------------- Matière
  float mottle = fbm4(q * 5.0 + 2.0);
  float broad = fbm4(q * 1.1 + 31.0);
  vec3 albedo = srgbToLinear(vec3(0.175, 0.170, 0.172)) * (0.75 + 0.45 * mottle) * (0.8 + 0.4 * broad);
  // Phénocristaux clairs, rares et minuscules (plagioclase).
  float speck = smoothstep(0.86, 0.97, vnoise(q * 190.0)) * smoothstep(0.5, 0.75, vnoise(q * 7.0 + 4.0));
  albedo = mix(albedo, srgbToLinear(vec3(0.42, 0.40, 0.37)), speck * 0.5);
  albedo *= 1.0 - 0.75 * ves.x;
  float dark = max(slit, hair * 0.8);
  albedo *= 1.0 - 0.94 * dark;

  // ---------------------------------------------------------------- Lumière rasante chaude
  vec2 ldir = normalize(u_light + vec2(1e-4));
  vec3 L = normalize(vec3(ldir, 0.36));
  float reach = dot(centered, ldir);
  float falloff = mix(0.16, 1.0, smoothstep(-0.8, 0.9, reach));
  vec3 lightCol = vec3(1.0, 0.76, 0.56) * 1.45;
  float diff = max(dot(nrm, L), 0.0);
  diff = diff * diff * 2.2; // la lumière rasante creuse les ombres du grain
  float occl = (1.0 - 0.85 * dark) * (1.0 - 0.6 * ves.x);
  vec3 col = albedo * lightCol * diff * falloff * occl;
  col += albedo * vec3(0.05, 0.045, 0.05) * 0.5;

  // Éclats vitreux : quelques facettes seulement renvoient la lumière.
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float glassy = smoothstep(0.88, 0.98, vnoise(q * 240.0 + 40.0));
  float spec = pow(max(dot(nrm, H), 0.0), 48.0) * (0.04 + 1.2 * glassy);
  col += lightCol * spec * falloff * 0.12 * (1.0 - dark);

  // ---------------------------------------------------------------- Feu en profondeur
  float zones = smoothstep(0.62 - 0.3 * u_heat, 0.78 - 0.25 * u_heat, fbm4(q * 0.6 + 23.0 + u_seed));
  float phase = fbm4(q * 0.9 + 3.0) * 6.2831;
  float breath = 0.7 + 0.3 * sin(u_time * 0.42 + phase) * sin(u_time * 0.17 + phase * 0.5 + 1.0);
  // Le feu affleure par poches le long de la fente, jamais en trait continu.
  float pockets = smoothstep(0.62 - 0.2 * u_heat, 0.86 - 0.2 * u_heat, vnoise(w * 8.0 + vec2(u_seed, u_time * 0.03)));
  float heat = smoothstep(0.0, 0.12, u_heat) * (0.4 + 0.6 * u_heat) * zones * breath * pockets * smoothstep(0.5, 1.4, hw);
  float core = 1.0 - smoothstep(0.0, hw, dBig);
  float t = heat * core * (0.8 + 0.6 * pockets);
  // Les parois de la fente rougissent ; un peu de cette lumière déborde sur la pierre.
  float walls = heat * exp(-max(dBig - hw, 0.0) / 2.2) * (1.0 - core);
  float spill = heat * exp(-dBig / 10.0);

  vec3 deep = srgbToLinear(vec3(0.24, 0.025, 0.015));
  vec3 sang = srgbToLinear(SANG);
  vec3 braise = srgbToLinear(BRAISE);
  vec3 ember = srgbToLinear(vec3(0.66, 0.10, 0.06));
  vec3 ramp = mix(deep, mix(sang, ember, 0.5), smoothstep(0.05, 0.6, t));
  ramp = mix(ramp, braise, smoothstep(0.5, 0.95, t));
  vec3 glow = ramp * t * 1.3;
  glow += mix(sang, ember, 0.6) * walls * 0.12 * (0.5 + 0.5 * lipSlope);
  glow += albedo * ember * spill * 2.0;
  col += glow;

  // ---------------------------------------------------------------- Sortie
  col = 1.0 - exp(-col * 1.2);
  vec3 outc = linearToSrgb(col);
  outc = max(outc, OBSIDIENNE * 0.5);
  gl_FragColor = vec4(outc + dither(frag), 1.0);
}
`;

/** Valeurs par défaut des uniformes propres au basalte. */
export const BASALT_DEFAULTS = {
  u_heat: 0.4,
  u_light: [-0.8, -0.6] as [number, number],
  u_scale: 1,
  u_seed: 0,
};
