/// <reference types="vite/client" />
import type { ReactElement } from 'react';

declare global {
  namespace JSX {
    type Element = ReactElement;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
export {};
