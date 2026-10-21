import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive descriptor for window.fetch in case executor scripts attempt direct assignment
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch;
    let currentFetch = typeof origFetch === 'function' ? origFetch.bind(window) : origFetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (fn) => {
        currentFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // Descriptor already defined
  }
}

if (typeof window !== 'undefined' && !(window as any).__EDUCOM_APP_BOOTED__) {
  (window as any).__EDUCOM_APP_BOOTED__ = true;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

