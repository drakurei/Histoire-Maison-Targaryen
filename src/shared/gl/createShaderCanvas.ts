/**
 * Un shader de fragment plein cadre sur un canvas, en WebGL brut.
 *
 * - un triangle qui couvre tout le cadre ; uniformes communs `u_time`, `u_res`, `u_pointer`,
 *   `u_dpr`, et uniformes libres (nombre ou vecteur de 2 à 4 composantes) ;
 * - la boucle ne tourne que si le canvas est visible (IntersectionObserver) et l'onglet actif ;
 * - densité de pixels plafonnée (1,5 par défaut), taille suivie par ResizeObserver ;
 * - perte et restauration du contexte : le programme est reconstruit, la boucle reprend ;
 * - `destroy()` libère tout (observateurs, écouteurs, ressources GPU).
 *
 * Aucune dépendance au framework : `ShaderCanvas.tsx` et `BurnTransition.tsx` s'en servent.
 */
import { VERTEX } from './shaders/common.ts';

export type UniformValue =
  | number
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

export type Uniforms = Readonly<Record<string, UniformValue>>;

export interface ShaderCanvasOptions {
  /** Source GLSL du fragment (voir `shaders/`). */
  fragment: string;
  /** Uniformes libres de départ. */
  uniforms?: Uniforms;
  /** Plafond de densité de pixels. 1,5 par défaut. */
  maxDpr?: number;
  /** Fraction de la définition (0,25 à 1). Pour un fond lent et coûteux, 0,75 suffit. */
  resolution?: number;
  /** Plafond d'images par seconde. 60 par défaut ; un fond qui respire se contente de 30. */
  fps?: number;
  /** Lance la boucle dès que le canvas est visible. Vrai par défaut. */
  autoplay?: boolean;
  /** Canvas transparent (alpha prémultiplié), pour une couche posée sur la page. */
  transparent?: boolean;
  /** Valeur de départ de `u_time`, en secondes. */
  startTime?: number;
  /** Appelé si la compilation échoue ou si le contexte est perdu sans retour. */
  onError?: (error: Error) => void;
}

export interface ShaderCanvas {
  readonly canvas: HTMLCanvasElement;
  /** Fusionne des uniformes ; l'image suivante les prend en compte. */
  setUniforms(uniforms: Uniforms): void;
  /** Fixe `u_time` (secondes). Utile pour une image figée ou un pilotage externe. */
  setTime(seconds: number): void;
  /** Mesure le canvas tout de suite (au lieu d'attendre ResizeObserver). */
  resize(): void;
  /** Dessine une image maintenant, que la boucle tourne ou non. */
  render(): void;
  /** Demande la boucle (elle ne tourne réellement que si le canvas est visible). */
  play(): void;
  pause(): void;
  isPlaying(): boolean;
  destroy(): void;
}

interface GlState {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  locations: Map<string, WebGLUniformLocation | null>;
}

const DEFAULT_MAX_DPR = 1.5;

let support: boolean | undefined;

/** Vrai si le navigateur ouvre un contexte WebGL. Le test est fait une fois, puis mémorisé. */
export function isWebGLAvailable(): boolean {
  if (support !== undefined) return support;
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    support = gl !== null;
    // Rendre le contexte d'essai tout de suite : le navigateur en limite le nombre.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    support = false;
  }
  return support;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader a échoué');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader) ?? '';
    gl.deleteShader(shader);
    throw new Error(`Shader non compilé : ${log}`);
  }
  return shader;
}

function buildState(gl: WebGLRenderingContext | WebGL2RenderingContext, fragment: string): GlState {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('createProgram a échoué');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'a_pos');
  gl.linkProgram(program);
  // Les shaders attachés ne servent plus une fois le programme lié.
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program) ?? '';
    gl.deleteProgram(program);
    throw new Error(`Programme non lié : ${log}`);
  }
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('createBuffer a échoué');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  return { gl, program, buffer, locations: new Map() };
}

function setUniform(state: GlState, name: string, value: UniformValue): void {
  const { gl, program, locations } = state;
  let loc = locations.get(name);
  if (loc === undefined) {
    loc = gl.getUniformLocation(program, name);
    locations.set(name, loc);
  }
  if (loc === null) return; // uniforme absent ou éliminé par le compilateur
  if (typeof value === 'number') {
    gl.uniform1f(loc, value);
    return;
  }
  switch (value.length) {
    case 2:
      gl.uniform2f(loc, value[0], value[1]);
      break;
    case 3:
      gl.uniform3f(loc, value[0], value[1], value[2]);
      break;
    case 4:
      gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
      break;
  }
}

/**
 * Monte un shader sur `canvas`. Rend `null` si WebGL manque ou si le shader ne compile pas :
 * l'appelant affiche alors son repli statique.
 */
export function createShaderCanvas(canvas: HTMLCanvasElement, options: ShaderCanvasOptions): ShaderCanvas | null {
  const maxDpr = options.maxDpr ?? DEFAULT_MAX_DPR;
  const resolution = Math.min(1, Math.max(0.25, options.resolution ?? 1));
  const frameGap = 1000 / Math.max(1, Math.min(120, options.fps ?? 60));
  const transparent = options.transparent ?? false;

  const attributes: WebGLContextAttributes = {
    alpha: transparent,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  };
  const getContext = () =>
    (canvas.getContext('webgl2', attributes) as WebGL2RenderingContext | null) ??
    (canvas.getContext('webgl', attributes) as WebGLRenderingContext | null);

  const context = getContext();
  if (!context) return null;

  let state: GlState | null;
  try {
    state = buildState(context, options.fragment);
  } catch (error) {
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const uniforms: Record<string, UniformValue> = { ...options.uniforms };
  let time = options.startTime ?? 0;
  let pointer: [number, number] = [0.5, 0.5];
  let dpr = 1;
  let wanted = options.autoplay ?? true;
  let visible = false;
  let pageShown = typeof document === 'undefined' || document.visibilityState !== 'hidden';
  let lost = false;
  let destroyed = false;
  let raf = 0;
  let lastTick = 0;
  let lastDraw = 0;

  const draw = () => {
    if (!state || lost || destroyed) return;
    const { gl } = state;
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (transparent) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    setUniform(state, 'u_res', [canvas.width, canvas.height]);
    setUniform(state, 'u_time', time);
    setUniform(state, 'u_pointer', pointer);
    setUniform(state, 'u_dpr', dpr);
    for (const name in uniforms) {
      const value = uniforms[name];
      if (value !== undefined) setUniform(state, name, value);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * resolution;
    // Un canvas caché garde un tampon d'un pixel : la mémoire du GPU n'est pas retenue pour rien.
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  };

  const running = () => wanted && visible && pageShown && !lost && !destroyed;

  const tick = (now: number) => {
    raf = 0;
    if (!running()) return;
    raf = requestAnimationFrame(tick);
    // Un retour d'onglet ne fait pas sauter le temps : pas plus d'un dixième de seconde par pas.
    const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0;
    lastTick = now;
    time += dt;
    if (now - lastDraw < frameGap - 1) return;
    lastDraw = now;
    draw();
  };

  const sync = () => {
    if (running()) {
      if (!raf) {
        lastTick = 0;
        raf = requestAnimationFrame(tick);
      }
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (!running()) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointer = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
  };

  const onVisibility = () => {
    pageShown = document.visibilityState !== 'hidden';
    sync();
  };

  const onLost = (event: Event) => {
    // Sans preventDefault, le navigateur ne rendra jamais le contexte.
    event.preventDefault();
    lost = true;
    state = null;
    sync();
  };

  const onRestored = () => {
    const gl = getContext();
    if (!gl) return;
    try {
      state = buildState(gl, options.fragment);
      lost = false;
      draw();
      sync();
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    // Un canvas en pause est redessiné tout de suite : sinon il resterait étiré ou vide.
    if (measure() && !running()) draw();
  });
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visible = entry.isIntersecting;
      sync();
    },
    { rootMargin: '64px' },
  );

  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointermove', onPointer, { passive: true });
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  measure();
  draw();

  return {
    canvas,
    setUniforms(next) {
      Object.assign(uniforms, next);
    },
    setTime(seconds) {
      time = seconds;
    },
    resize() {
      measure();
    },
    render() {
      draw();
    },
    play() {
      wanted = true;
      sync();
    },
    pause() {
      wanted = false;
      sync();
    },
    isPlaying() {
      return running();
    },
    destroy() {
      if (destroyed) return;
      wanted = false;
      sync();
      destroyed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (state && !lost) {
        const { gl, program, buffer } = state;
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        // Rendre le contexte : le navigateur n'en garde qu'une poignée à la fois.
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      state = null;
    },
  };
}
