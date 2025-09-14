/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_XLSX_IMPORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
