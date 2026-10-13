import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/special-elite';
import '@fontsource/crimson-pro/400.css';
import '@fontsource/crimson-pro/400-italic.css';
import '@fontsource/crimson-pro/600.css';
import 'katex/dist/katex.min.css';
import './styles.css';
import { App } from './App';
import { StoreProvider } from './state/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
