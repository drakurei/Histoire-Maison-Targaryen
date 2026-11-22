import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { normalizePath } from 'vite';
import { defineConfig } from 'vitest/config';

/** Le site ne s'écoute que sur la boucle locale : rien n'est exposé sur le réseau. */
const HOST = '127.0.0.1';
const PORT = 4173;

const srcDir = normalizePath(fileURLToPath(new URL('./src', import.meta.url)));

export default defineConfig({
  // Chemin de publication : « / » en local, « /Histoire-Maison-Targaryen/ » pour GitHub Pages.
  base: process.env.BASE_PATH ?? '/',

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
            // Chaque jeu de contenu dans son propre bloc, avec son module de lecture. Sans cela,
            // les petits modules partagés par les mêmes pages (marques, format des années)
            // sont fondus dans le bloc des chroniques et le tirent partout où ils servent.
            {
              name: (id: string) => /src[\\/](?:core[\\/]content|content[\\/]generated)[\\/](\w+)\.(?:ts|json)$/.exec(id)?.[1] ?? null,
              test: /src[\\/](?:core[\\/]content[\\/](?:timeline|people|dragons|wars|places|language|paths|sources|search)\.ts|content[\\/]generated[\\/]\w+\.json)$/,
              priority: 5,
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
