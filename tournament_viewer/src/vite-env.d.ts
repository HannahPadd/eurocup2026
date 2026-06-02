/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_PUBLIC_ENABLE_LIVE_SCORES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
