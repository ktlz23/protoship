import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { STACK_TEMPLATES, STACK_TEMPLATE_LIST } from "../stack-templates.js";

const InputSchema = z.object({
  stack_id: z
    .string()
    .optional()
    .describe(
      'Optional. Stack ID to retrieve the full template for. If omitted, returns the list of available stacks. ' +
      'Available IDs: "nextjs-supabase", "nextjs-prisma-neon", "sveltekit-supabase", "remix-supabase"'
    ),
}).strict();

export function registerGetStackTemplateTool(server: McpServer): void {
  server.registerTool(
    "poc_get_stack_template",
    {
      title: "Get Stack Template",
      description: `Returns opinionated, production-tested stack configurations for common app types.

Use this BEFORE poc_write_files to get the right dependencies, environment variables, key files, and scaffolding instructions for the chosen stack.

Step 2.5 in the workflow — call this after the founder confirms their stack choice.

Without stack_id: returns the list of 4 available stacks with descriptions and best-for guidance.
With stack_id: returns the full template including:
  - Exact dependency versions (core + dev)
  - Required environment variables with examples
  - Key files to generate with descriptions
  - scaffold_guide: instructions for generating high-quality starter code

Available stacks:
  - nextjs-supabase: Next.js 14 + Supabase + Vercel (recommended default for most SaaS)
  - nextjs-prisma-neon: Next.js 14 + Prisma + Neon + Vercel (more DB control)
  - sveltekit-supabase: SvelteKit + Supabase + Vercel (simpler syntax)
  - remix-supabase: Remix + Supabase + Fly.io (SSR-heavy apps)`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ stack_id }) => {
      if (!stack_id) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ available_stacks: STACK_TEMPLATE_LIST }, null, 2),
          }],
        };
      }

      const template = STACK_TEMPLATES[stack_id];
      if (!template) {
        const available = Object.keys(STACK_TEMPLATES).join(", ");
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `Unknown stack_id "${stack_id}". Available: ${available}`,
          }],
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(template, null, 2),
        }],
      };
    }
  );
}
