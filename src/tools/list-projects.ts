import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";
import { PROTOSHIP_STATE_DIR } from "../constants.js";
import { STACK_TEMPLATES } from "../stack-templates.js";

export interface ProjectState {
  project_name: string;
  project_directory: string;
  stack_id: string | null;
  files_created: number;
  created_at: string;
}

export interface ProjectEntry extends ProjectState {
  status: "files_written" | "review_completed" | "directory_missing";
  stack_name: string | null;
}

const InputSchema = z.object({}).strict();

export function saveProjectState(state: ProjectState): void {
  try {
    fs.mkdirSync(PROTOSHIP_STATE_DIR, { recursive: true });
    const filePath = path.join(PROTOSHIP_STATE_DIR, `${state.project_name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Silent — state persistence must never block the main workflow
  }
}

export function registerListProjectsTool(server: McpServer): void {
  server.registerTool(
    "protoship_list_projects",
    {
      title: "List Projects",
      description: `Lists all previously scaffolded projects and their current status.

Call this at the START of every POC Restructurer session to detect in-progress projects.

If a project has status "files_written", the scaffolding completed but the quality review hasn't run yet.
Offer the founder to resume by running the quality review on the existing project_directory.

If status is "directory_missing", the project folder was moved or deleted — start fresh.

Returns:
  - projects: array of projects sorted by most recent first
    - project_name, project_directory, stack_id, stack_name, files_created, created_at, status
  - has_in_progress: true if any project needs the quality review`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const projects: ProjectEntry[] = [];

      if (!fs.existsSync(PROTOSHIP_STATE_DIR)) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ projects: [], has_in_progress: false }, null, 2),
          }],
        };
      }

      let files: string[];
      try {
        files = fs.readdirSync(PROTOSHIP_STATE_DIR).filter((f) => f.endsWith(".json"));
      } catch {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ projects: [], has_in_progress: false }, null, 2),
          }],
        };
      }

      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(PROTOSHIP_STATE_DIR, file), "utf-8");
          const state = JSON.parse(raw) as ProjectState;

          const dirExists = fs.existsSync(state.project_directory);
          const reviewDone =
            dirExists &&
            fs.existsSync(path.join(state.project_directory, ".protoship-review-done"));

          const status: ProjectEntry["status"] = !dirExists
            ? "directory_missing"
            : reviewDone
            ? "review_completed"
            : "files_written";

          const stackName = state.stack_id ? (STACK_TEMPLATES[state.stack_id]?.name ?? state.stack_id) : null;

          projects.push({ ...state, status, stack_name: stackName });
        } catch {
          // Skip malformed state files
        }
      }

      projects.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const hasInProgress = projects.some((p) => p.status === "files_written");

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ projects, has_in_progress: hasInProgress }, null, 2),
        }],
      };
    }
  );
}
