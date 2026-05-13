import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileContents } from "../services/filesystem.js";
import { MAX_HTML_SIZE } from "../constants.js";

const InputSchema = z.object({
  file_path: z
    .string()
    .min(1, "File path is required")
    .describe("Absolute or relative path to the HTML prototype file"),
}).strict();

export function registerReadHtmlTool(server: McpServer): void {
  server.registerTool(
    "poc_read_html",
    {
      title: "Read HTML Prototype",
      description: `Reads an HTML prototype file and returns its full content for analysis.

Step 1 of the POC Restructurer workflow. Call this first to load the HTML file.
After getting the content, analyze it yourself: detect app type, features, libraries referenced, and data models.
Then ask the founder 4-5 clarification questions before recommending a stack.

Args:
  - file_path (string): Path to the HTML file

Returns:
  - content: the full HTML file content
  - file_path: resolved absolute path
  - file_size_chars: file size in characters`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ file_path }) => {
      try {
        const content = readFileContents(file_path);

        if (content.length > MAX_HTML_SIZE) {
          return {
            isError: true,
            content: [{
              type: "text" as const,
              text: `Error: File is too large (${content.length} chars, max ${MAX_HTML_SIZE}).`,
            }],
          };
        }

        const output = JSON.stringify({
          file_path,
          file_size_chars: content.length,
          content,
        }, null, 2);

        return { content: [{ type: "text" as const, text: output }] };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
