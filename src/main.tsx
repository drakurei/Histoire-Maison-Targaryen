import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// L'ordre compte : les faces, puis les jetons qui les nomment, puis le socle qui s'en sert.
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/base.css';

import { App } from '@/app/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Élément #root introuvable dans index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
