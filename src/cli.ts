#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// When Claude Code calls `npx protoship --mcp`, run the MCP server
if (process.argv.includes("--mcp")) {
  import("./index.js");
} else {
  runInstaller();
}

function runInstaller(): void {
  console.log("\nProtoship — installing...\n");

  // 1. Configure Claude Code MCP settings
  const settingsDir = path.join(os.homedir(), ".claude");
  const settingsPath = path.join(settingsDir, "settings.json");

  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      console.error("✗  Could not parse ~/.claude/settings.json — fix it manually and re-run.");
      process.exit(1);
    }
  }

  if (!settings.mcpServers || typeof settings.mcpServers !== "object") {
    settings.mcpServers = {};
  }

  (settings.mcpServers as Record<string, unknown>)["protoship"] = {
    command: "npx",
    args: ["-y", "protoship", "--mcp"],
  };

  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  console.log("✓  Claude Code configured (~/.claude/settings.json)");

  // 2. Install the guided workflow skill
  const skillDir = path.join(settingsDir, "skills", "poc-restructurer");
  fs.mkdirSync(skillDir, { recursive: true });

  const skillSrc = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "SKILL.md");
  const skillDest = path.join(skillDir, "SKILL.md");

  if (fs.existsSync(skillSrc)) {
    fs.copyFileSync(skillSrc, skillDest);
    console.log("✓  Skill installed (~/.claude/skills/poc-restructurer/SKILL.md)");
  } else {
    console.warn("⚠  SKILL.md not found — skill not installed. You can copy it manually from the repo.");
  }

  console.log("\nDone! Restart Claude Code, then say:");
  console.log('  "I have an HTML prototype at ~/path/to/app.html — turn it into a real app."\n');
}
