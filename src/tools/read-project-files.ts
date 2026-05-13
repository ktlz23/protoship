import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";
import { collectProjectFiles } from "../services/filesystem.js";
import {
  MAX_PROJECT_FILES_FOR_REVIEW,
  MAX_REVIEW_CONTENT_CHARS,
} from "../constants.js";
import {
  SECURITY_CHECKLIST,
  ARCHITECTURE_CHECKLIST,
  CODE_QUALITY_CHECKLIST,
  REVIEW_DISPATCH_INSTRUCTIONS,
} from "../review-specialists.js";

const InputSchema = z.object({
  project_directory: z
    .string()
    .min(1)
    .describe("Absolute path to the scaffolded project directory"),
}).strict();

export function registerReadProjectFilesTool(server: McpServer): void {
  server.registerTool(
    "protoship_read_project_files",
    {
      title: "Read Project Files",
      description: `Reads all source files in a scaffolded project and returns them alongside specialist review checklists.

Step 5 of the POC Restructurer workflow. Call this to load the project for quality review.

The response includes a "review_dispatch" section with:
- Instructions for spawning 3 parallel Agent subagents (security, architecture, code_quality)
- A checklist for each specialist — pass it as the ONLY context (no conversation history)
- Scoring formula and report format

After getting the response, follow the review_dispatch.instructions exactly:
spawn 3 subagents IN PARALLEL, merge their findings, compute the composite score, present the report.

When the review is complete, create an empty .protoship-review-done file in the project directory
so future sessions know the review was completed.

Args:
  - project_directory (string): Absolute path to the project folder

Skips: node_modules, .git, dist, build, binary files, lock files.`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ project_directory }) => {
      try {
        const files = collectProjectFiles(
          project_directory,
          MAX_PROJECT_FILES_FOR_REVIEW,
          MAX_REVIEW_CONTENT_CHARS
        );

        if (files.length === 0) {
          return {
            isError: true,
            content: [{
              type: "text" as const,
              text: `No readable source files found in ${project_directory}. Make sure the project was scaffolded with poc_write_files first.`,
            }],
          };
        }

        const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);

        // Check if review was already completed
        const reviewDoneMarker = path.join(project_directory, ".protoship-review-done");
        const reviewAlreadyDone = fs.existsSync(reviewDoneMarker);

        const output = JSON.stringify({
          project_directory,
          file_count: files.length,
          total_chars: totalChars,
          review_already_completed: reviewAlreadyDone,
          files,
          review_dispatch: {
            instructions: REVIEW_DISPATCH_INSTRUCTIONS,
            security_checklist: SECURITY_CHECKLIST,
            architecture_checklist: ARCHITECTURE_CHECKLIST,
            code_quality_checklist: CODE_QUALITY_CHECKLIST,
            completion_marker: `After presenting the review to the user, create an empty file at: ${reviewDoneMarker}\nThis marks the review as complete for future session recovery.`,
          },
        }, null, 2);

        return { content: [{ type: "text" as const, text: output }] };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `Error reading project: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
