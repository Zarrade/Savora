import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ensureSeeded } from './db';
import { initAuth } from './lib/account';
import '@fontsource-variable/plus-jakarta-sans';
import './styles.css';

registerSW({ immediate: true });
// Ask the browser to keep our data (avoids eviction on low storage)
navigator.storage?.persist?.().catch(() => undefined);

ensureSeeded().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  // Restores the session from this device (no network needed); the app shows a splash meanwhile
  initAuth().catch(err => console.error('auth init failed', err));
});
