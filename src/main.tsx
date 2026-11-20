import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !import.meta.env.VITE_DEMO) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support unavailable */ });
  });
}

// Ask the browser to keep werde's storage even when space runs low (no prompt in most browsers).
navigator.storage?.persist?.().catch(() => { /* not supported */ });
