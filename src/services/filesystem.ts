import * as fs from "fs";
import * as path from "path";
import { IGNORED_DIRS, IGNORED_EXTENSIONS } from "../constants.js";

export function resolveSafePath(inputPath: string): string {
  return path.resolve(inputPath);
}

export function readFileContents(filePath: string): string {
  const safePath = resolveSafePath(filePath);
  if (!fs.existsSync(safePath)) {
    throw new Error(`File not found: ${safePath}`);
  }
  const stat = fs.statSync(safePath);
  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${safePath}`);
  }
  return fs.readFileSync(safePath, "utf-8");
}

export function ensureDirectoryExists(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeProjectFile(
  projectDir: string,
  relativePath: string,
  content: string
): void {
  const safeProjDir = resolveSafePath(projectDir);
  const normalizedRelative = path.normalize(relativePath);

  // Prevent path traversal outside project root
  if (normalizedRelative.startsWith("..")) {
    throw new Error(
      `Security: relative path escapes project directory: ${relativePath}`
    );
  }

  const fullPath = path.join(safeProjDir, normalizedRelative);
  ensureDirectoryExists(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, "utf-8");
}

export function collectProjectFiles(
  dirPath: string,
  maxFiles: number,
  maxChars: number
): Array<{ path: string; content: string }> {
  const safeDirPath = resolveSafePath(dirPath);

  if (!fs.existsSync(safeDirPath)) {
    throw new Error(`Directory not found: ${safeDirPath}`);
  }

  const result: Array<{ path: string; content: string }> = [];
  let totalChars = 0;

  function walk(dir: string): void {
    if (result.length >= maxFiles || totalChars >= maxChars) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (result.length >= maxFiles || totalChars >= maxChars) break;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(safeDirPath, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IGNORED_EXTENSIONS.has(ext)) continue;

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (totalChars + content.length > maxChars) continue;
          result.push({ path: relPath, content });
          totalChars += content.length;
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  walk(safeDirPath);
  return result;
}
