import * as os from "os";
import * as path from "path";

export const MAX_HTML_SIZE = 500_000;
export const MAX_PROJECT_FILES_FOR_REVIEW = 50;
export const MAX_REVIEW_CONTENT_CHARS = 120_000;
export const CHARACTER_LIMIT = 25_000;

export const PROTOSHIP_STATE_DIR = path.join(os.homedir(), ".protoship", "projects");

export const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".nuxt",
  ".svelte-kit", "coverage", ".turbo", ".vercel", "__pycache__",
]);

export const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp4", ".mp3", ".zip", ".tar", ".gz",
  ".lock", ".bin", ".exe",
]);
