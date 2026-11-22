/**
 * La matière du site en WebGL brut : basalte, braises, dissolution par le feu.
 * Toujours avec repli statique ; mouvement réduit : une image figée ou un fondu.
 */
export { createShaderCanvas, isWebGLAvailable } from './createShaderCanvas';
export type { ShaderCanvas as ShaderCanvasHandle, ShaderCanvasOptions, UniformValue, Uniforms } from './createShaderCanvas';
export { ShaderCanvas } from './ShaderCanvas';
export type { ShaderCanvasProps } from './ShaderCanvas';
export { BurnTransition } from './BurnTransition';
export type { BurnPlayOptions, BurnTransitionHandle, BurnTransitionProps } from './BurnTransition';
export { useBurnTransition } from './useBurnTransition';
export { BASALT, BASALT_DEFAULTS, BURN, BURN_DEFAULTS, EMBERS, EMBERS_DEFAULTS } from './shaders';
