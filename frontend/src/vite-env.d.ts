/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_DOMAIN: string;
  readonly VITE_API_PROTOCOL: string;
  readonly VITE_MAPTILER_API_KEY: string;
  readonly VITE_ENABLE_LOGGING?: string;
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
