/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_FEATURE_CONFIG_URL?: string;
  readonly VITE_COMP_UI_URL?: string;
  readonly VITE_USER_MGMT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
