import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTheme } from '@jobetes/ui';
import { App } from './App.js';
import './styles.css';

applyTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
