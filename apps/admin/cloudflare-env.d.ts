declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_SERVICE_KEY?: string;
    ADMIN_AUTOMATION_KEY?: string;
    WEB_ORIGIN?: string;
    COOLIFY_URL?: string;
    COOLIFY_TOKEN?: string;
  }
}
