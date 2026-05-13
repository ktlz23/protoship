# POC Restructurer — Claude Code MCP Plugin

Transforms a single AI-generated HTML prototype into a production-ready project scaffold — with a guided step-by-step experience designed for non-technical founders.

Tell Claude Code *"I have an HTML prototype at `/path/to/app.html`, turn it into a real app"* and it handles the rest.

**No Anthropic API key required.** The plugin is pure I/O — Claude Code does all reasoning, generation, and review using its existing session.

## What it does

1. **Detects in-progress work** — if your previous session was interrupted, picks up where you left off
2. **Reads and analyzes** your HTML prototype (app type, features, data models)
3. **Asks clarification questions** (team skills, budget, integrations)
4. **Recommends a tech stack** with rationale, cost estimate, and alternatives
5. **Checks your machine** for required tools, provides setup instructions for gaps
6. **Scaffolds a complete project** from an opinionated template — real working code, pinned dependencies
7. **Runs an independent quality review** — 3 specialist subagents (security, architecture, code quality) review the code in parallel with no conversation context, like a cold senior-engineer review

## Prerequisites

- Node.js 18+ — [nodejs.org](https://nodejs.org)

That's it. No API key needed.

## Installation

```bash
git clone https://github.com/your-org/poc-restructurer-mcp-server
cd poc-restructurer-mcp-server
npm install && npm run build
```

## Add to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "poc-restructurer": {
      "command": "node",
      "args": ["/absolute/path/to/poc-restructurer-mcp-server/dist/index.js"]
    }
  }
}
```

Then install the guided workflow skill:

```bash
mkdir -p ~/.claude/skills/poc-restructurer
cp SKILL.md ~/.claude/skills/poc-restructurer/SKILL.md
```

Restart Claude Code and say: *"I have an HTML prototype at ~/Downloads/app.html — help me turn it into a real app."*

## Available stacks

| ID | Stack | Best for |
|----|-------|----------|
| `nextjs-supabase` | Next.js 14 + Supabase + Vercel | Most SaaS apps — recommended default |
| `nextjs-prisma-neon` | Next.js 14 + Prisma + Neon + Vercel | Complex DB queries, more control |
| `sveltekit-supabase` | SvelteKit + Supabase + Vercel | Simpler syntax, less boilerplate |
| `remix-supabase` | Remix + Supabase + Fly.io | SSR-heavy apps |

## MCP Tools

| Tool | Step | What it does |
|------|------|-------------|
| `poc_list_projects` | 0 | Lists previously scaffolded projects and their status (for session recovery) |
| `poc_read_html` | 1 | Reads the HTML prototype and extracts app type, features, and clarification questions |
| `poc_check_prerequisites` | 3 | Checks that required CLI tools are installed |
| `poc_get_stack_template` | 2–4 | Returns opinionated stack configs with pinned dependencies, env vars, and scaffold instructions |
| `poc_write_files` | 4 | Writes the generated project files to disk and saves project state |
| `poc_read_project_files` | 5 | Reads all project files and returns specialist review checklists for parallel quality review |

Claude handles all analysis, recommendation, code generation, and review orchestration. The tools handle only I/O.

## How the quality review works

After scaffolding, Claude calls `poc_read_project_files`, then spawns **3 Agent subagents in parallel** — one each for security, architecture, and code quality. Each subagent receives only the project files and its specialist checklist — no conversation history, no HTML context. They review the code as if seeing it for the first time.

Composite score: `security×0.40 + architecture×0.35 + code_quality×0.25`

## Session recovery

If a session is interrupted (closed tab, out of credits, etc.), the plugin automatically detects where you left off:
- Project state is saved to `~/.poc-restructurer/projects/` after scaffolding
- `poc_list_projects` at session start detects in-progress projects
- Review completion is tracked via a `.poc-review-done` marker file

## License

MIT
