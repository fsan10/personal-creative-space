declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CMS_ORIGIN?: string;
    CMS_SITE_TOKEN?: string;
  }
}
