import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execSync } from "child_process";
interface PrerequisiteCheck {
  tool: string;
  required: boolean;
  installed: boolean;
  version?: string;
  install_instructions?: string;
}

const TOOL_DEFINITIONS: Record<string, {
  version_cmd: string;
  install_instructions: string;
}> = {
  node: {
    version_cmd: "node --version",
    install_instructions: "Install Node.js v18+ from https://nodejs.org — use the LTS version",
  },
  npm: {
    version_cmd: "npm --version",
    install_instructions: "npm comes with Node.js. Install Node.js from https://nodejs.org",
  },
  git: {
    version_cmd: "git --version",
    install_instructions: "Install Git: run `xcode-select --install` on Mac, or download from https://git-scm.com/downloads",
  },
  gh: {
    version_cmd: "gh --version",
    install_instructions: "Install GitHub CLI: `brew install gh` (Mac) or see https://cli.github.com/manual/installation — then run `gh auth login`",
  },
  vercel: {
    version_cmd: "vercel --version",
    install_instructions: "Install Vercel CLI: `npm install -g vercel` — then run `vercel login`",
  },
  supabase: {
    version_cmd: "supabase --version",
    install_instructions: "Install Supabase CLI: `brew install supabase/tap/supabase` (Mac) or see https://supabase.com/docs/guides/cli/getting-started",
  },
  docker: {
    version_cmd: "docker --version",
    install_instructions: "Install Docker Desktop from https://docker.com/products/docker-desktop",
  },
  pnpm: {
    version_cmd: "pnpm --version",
    install_instructions: "Install pnpm: `npm install -g pnpm`",
  },
  yarn: {
    version_cmd: "yarn --version",
    install_instructions: "Install Yarn: `npm install -g yarn`",
  },
};

const SUPPORTED_TOOLS = Object.keys(TOOL_DEFINITIONS) as [string, ...string[]];

const InputSchema = z.object({
  required_tools: z
    .array(z.string())
    .min(1, "At least one tool name is required")
    .describe(
      `Tool names to verify. Supported values: ${SUPPORTED_TOOLS.join(", ")}`
    ),
  check_env_vars: z
    .array(z.string())
    .optional()
    .default([])
    .describe('Environment variable names to verify are set (e.g., ["ANTHROPIC_API_KEY", "DATABASE_URL"])'),
}).strict();

type Input = z.infer<typeof InputSchema>;

function checkTool(toolName: string): PrerequisiteCheck {
  const def = TOOL_DEFINITIONS[toolName.toLowerCase()];
  if (!def) {
    return {
      tool: toolName,
      required: true,
      installed: false,
      install_instructions: `Unknown tool "${toolName}". Check manually.`,
    };
  }

  try {
    const version = execSync(def.version_cmd, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    })
      .toString()
      .trim()
      .split("\n")[0];

    return { tool: toolName, required: true, installed: true, version };
  } catch {
    return {
      tool: toolName,
      required: true,
      installed: false,
      install_instructions: def.install_instructions,
    };
  }
}

export function registerPrerequisitesTool(server: McpServer): void {
  server.registerTool(
    "poc_check_prerequisites",
    {
      title: "Check Prerequisites",
      description: `Verifies that required CLI tools and environment variables are available on the user's machine.

Step 3 of the POC Restructurer workflow. Call after poc_recommend_stack to confirm the environment is ready before scaffolding.

Args:
  - required_tools (string[]): Tools to check. Supported: node, npm, git, gh, vercel, supabase, docker, pnpm, yarn
  - check_env_vars (string[], optional): Environment variable names to verify

Returns:
  - all_ready: true if everything is in place
  - tool_checks: {tool, installed, version?, install_instructions?} per tool
  - env_checks: {name, set, note?} per env var
  - missing_tools: names of uninstalled tools
  - missing_env_vars: names of unset env vars
  - setup_instructions: ordered list of what the user needs to do if anything is missing`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ required_tools, check_env_vars }: Input) => {
      const toolChecks = required_tools.map(checkTool);
      const envChecks = (check_env_vars ?? []).map((varName) => {
        const set = !!process.env[varName];
        return {
          name: varName,
          set,
          ...(set
            ? {}
            : { note: `Set ${varName} in your environment or in the MCP server's "env" config` }),
        };
      });

      const missingTools = toolChecks.filter((c) => !c.installed).map((c) => c.tool);
      const missingEnvVars = envChecks.filter((c) => !c.set).map((c) => c.name);
      const allReady = missingTools.length === 0 && missingEnvVars.length === 0;

      const setupInstructions: string[] = [
        ...toolChecks.filter((c) => !c.installed && c.install_instructions).map((c) => c.install_instructions!),
        ...envChecks.filter((c) => !c.set && c.note).map((c) => c.note!),
      ];

      const output = {
        all_ready: allReady,
        tool_checks: toolChecks,
        env_checks: envChecks,
        missing_tools: missingTools,
        missing_env_vars: missingEnvVars,
        setup_instructions: setupInstructions,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      };
    }
  );
}
