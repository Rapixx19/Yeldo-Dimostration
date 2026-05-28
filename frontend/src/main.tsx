import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentry } from './lib/sentry';
import './styles/globals.css';

// Init Sentry before rendering so that errors thrown during initial
// React render (e.g. broken context provider) are still captured.
// No-op when VITE_SENTRY_DSN is unset — see lib/sentry.ts.
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
