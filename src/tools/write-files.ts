import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as path from "path";
import * as fs from "fs";
import { writeProjectFile, resolveSafePath } from "../services/filesystem.js";
import { saveProjectState } from "./list-projects.js";

const FileSchema = z.object({
  path: z.string().min(1).describe('Relative file path within the project (e.g., "src/app/page.tsx")'),
  content: z.string().describe("Complete file content"),
});

const InputSchema = z.object({
  output_directory: z
    .string()
    .min(1)
    .describe('Parent directory where the project folder will be created (e.g., "/Users/john/projects")'),
  project_name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Project name must be lowercase letters, numbers, and hyphens only")
    .describe('Project folder name, lowercase with hyphens (e.g., "my-saas-app")'),
  files: z
    .array(FileSchema)
    .min(1, "At least one file is required")
    .describe("Array of files to write, each with a relative path and complete content"),
  stack_id: z
    .string()
    .optional()
    .describe('Optional stack template ID used (e.g., "nextjs-supabase"). Saved to project state for session recovery.'),
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerWriteFilesTool(server: McpServer): void {
  server.registerTool(
    "protoship_write_files",
    {
      title: "Write Project Files",
      description: `Writes a set of files to disk, creating the project directory structure.

Step 4 of the POC Restructurer workflow. Call this after generating all project file contents.

Use poc_get_stack_template first to get the right dependencies, file structure, and scaffold instructions for the chosen stack.

Generate real working code — not placeholder stubs. Include at minimum:
  package.json, tsconfig.json, .env.example, .gitignore, README.md, entry point files,
  one complete page matching the HTML prototype, database schema, and API routes.

After writing, the project state is automatically saved to ~/.poc-restructurer/projects/
so the session can be resumed if interrupted.

Args:
  - output_directory (string): Parent folder — the project gets its own subfolder named project_name
  - project_name (string): Folder name, lowercase with hyphens
  - files (array): Each item has "path" (relative) and "content" (full file content)
  - stack_id (string, optional): Stack template ID used — saved to state for recovery

Returns:
  - project_directory: absolute path of the created project
  - files_written: list of all relative paths written
  - file_count: number of files written`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ output_directory, project_name, files, stack_id }: Input) => {
      try {
        const projectDir = path.join(resolveSafePath(output_directory), project_name);

        if (fs.existsSync(projectDir)) {
          return {
            isError: true,
            content: [{
              type: "text" as const,
              text: `Error: Directory already exists: ${projectDir}. Choose a different project name or output directory.`,
            }],
          };
        }

        const written: string[] = [];
        for (const file of files) {
          writeProjectFile(projectDir, file.path, file.content);
          written.push(file.path);
        }

        // Save state for session recovery — silent on failure
        saveProjectState({
          project_name,
          project_directory: projectDir,
          stack_id: stack_id ?? null,
          files_created: written.length,
          created_at: new Date().toISOString(),
        });

        const output = JSON.stringify({
          project_directory: projectDir,
          files_written: written,
          file_count: written.length,
        }, null, 2);

        return { content: [{ type: "text" as const, text: output }] };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `Error writing files: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
