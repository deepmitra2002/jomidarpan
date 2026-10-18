declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    GEMINI_BASE_URL?: string;
    BUCKET?: R2Bucket;
  }
}
