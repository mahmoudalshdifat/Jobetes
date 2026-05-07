import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { applyTheme } from '@jobetes/ui';
import { App } from './App.js';
import { i18n } from './i18n.js';
import { initObservability, reportVitalToSentry } from './observability.js';
import { initWebVitals } from './lib/web-vitals.js';
import './styles.css';

applyTheme();
initObservability();
// Web Vitals → Sentry — runs after first paint, no-op when DSN unset.
void initWebVitals(reportVitalToSentry);

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
