/// <reference types="vite/client" />

import type { ReactElement } from 'react';

declare global {
  // React 18 + Vite — `JSX.Element` is no longer auto-globally available.
  namespace JSX {
    type Element = ReactElement;
  }
}

export {};
