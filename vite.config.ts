import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { normalizePath } from 'vite';
import { defineConfig } from 'vitest/config';

/** Le site ne s'écoute que sur la boucle locale : rien n'est exposé sur le réseau. */
const HOST = '127.0.0.1';
const PORT = 4173;

const srcDir = normalizePath(fileURLToPath(new URL('./src', import.meta.url)));

export default defineConfig({
  plugins: [react()],

  resolve: {
    // « @/ » = « src/ ». L'expression exige la barre oblique : « @fontsource/… » n'est pas concerné.
    alias: [{ find: /^@\//, replacement: `${srcDir}/` }],
  },

  server: { host: HOST, port: PORT, strictPort: true },
  preview: { host: HOST, port: PORT, strictPort: true },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React et le routeur : nécessaires dès l'amorçage, stables entre deux livraisons.
            // Priorité la plus haute pour que le bloc « gsap » n'emporte pas React
            // par le biais des dépendances de @gsap/react.
            {
              name: 'react',
              test: /node_modules[\\/](?:react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 20,
            },
            // GSAP et ses modules : à part, chargés avec la première version qui anime.
            {
              name: 'gsap',
              test: /node_modules[\\/](?:gsap|@gsap)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },

  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Par défaut, Vitest vide toute feuille de style importée, y compris en texte brut.
    // src/styles/tokens.test.ts lit tokens.css avec « ?raw » : ces imports gardent leur contenu.
    css: { include: [/\.css\?raw$/] },
  },
});
