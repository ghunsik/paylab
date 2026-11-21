/// <reference types="@cloudflare/workers-types/2023-07-01" />
/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}
