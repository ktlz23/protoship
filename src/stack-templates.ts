export interface StackTemplate {
  id: string;
  name: string;
  description: string;
  best_for: string[];
  frontend: { framework: string; language: string };
  backend: { framework: string; language: string };
  database: { name: string; type: string; managed_by: string };
  hosting: { platform: string; monthly_cost_estimate: string };
  dependencies: { core: string[]; dev: string[] };
  required_env_vars: Array<{ name: string; description: string; example: string }>;
  key_files: Array<{ path: string; description: string }>;
  scaffold_guide: string;
}

export const STACK_TEMPLATES: Record<string, StackTemplate> = {
  "nextjs-supabase": {
    id: "nextjs-supabase",
    name: "Next.js 14 + Supabase + Vercel",
    description: "The best default for most SaaS apps. Supabase gives you a full Postgres database, authentication, file storage, and real-time subscriptions — all managed. Vercel deploys in one click.",
    best_for: [
      "SaaS products with user accounts",
      "Internal tools with dashboards",
      "Apps that need auth out of the box",
      "Founders with no DevOps experience",
    ],
    frontend: { framework: "Next.js 14 App Router", language: "TypeScript" },
    backend: { framework: "Next.js API Routes / Server Actions", language: "TypeScript" },
    database: { name: "PostgreSQL", type: "relational", managed_by: "Supabase" },
    hosting: { platform: "Vercel", monthly_cost_estimate: "$0 (free tier) → ~$20/mo at scale" },
    dependencies: {
      core: [
        "next@14",
        "react@18",
        "react-dom@18",
        "@supabase/supabase-js@2",
        "@supabase/ssr@0",
        "tailwindcss@3",
        "zod@3",
      ],
      dev: [
        "typescript@5",
        "@types/node@20",
        "@types/react@18",
        "@types/react-dom@18",
        "autoprefixer@10",
        "postcss@8",
        "eslint@8",
        "eslint-config-next@14",
      ],
    },
    required_env_vars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Your Supabase project URL", example: "https://xxxx.supabase.co" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Your Supabase anon (public) key", example: "eyJhbGci..." },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Server-only service role key (never expose to browser)", example: "eyJhbGci..." },
    ],
    key_files: [
      { path: "src/lib/supabase/client.ts", description: "Browser-side Supabase client" },
      { path: "src/lib/supabase/server.ts", description: "Server-side Supabase client (for Server Components and API routes)" },
      { path: "src/middleware.ts", description: "Refreshes auth session on every request" },
      { path: "src/app/layout.tsx", description: "Root layout with auth provider" },
      { path: "src/app/page.tsx", description: "Main page" },
      { path: "src/app/auth/login/page.tsx", description: "Login page" },
      { path: "src/app/api/route.ts", description: "Example API route" },
      { path: "supabase/migrations/001_initial.sql", description: "Initial database schema" },
      { path: ".env.local.example", description: "Environment variable template" },
    ],
    scaffold_guide: `Generate a Next.js 14 App Router project with Supabase integration. Key rules:
- Use Server Components by default; add 'use client' only when needed (event handlers, hooks)
- Use @supabase/ssr for creating clients (not @supabase/auth-helpers which is deprecated)
- Server client: createServerClient from @supabase/ssr, passing cookies()
- Browser client: createBrowserClient from @supabase/ssr
- Middleware: use createServerClient and call supabase.auth.getUser() to refresh session
- All Tailwind CSS for styling — no CSS modules, no styled-components
- Use Zod for all form and API input validation
- Database: generate SQL migration file with proper types, indexes, and RLS policies
- Auth: use Supabase Auth with email/password by default; add OAuth if detected in HTML`,
  },

  "nextjs-prisma-neon": {
    id: "nextjs-prisma-neon",
    name: "Next.js 14 + Prisma + Neon + Vercel",
    description: "More control over your database with Prisma ORM and Neon (serverless Postgres). Better for complex data models and teams comfortable writing SQL migrations.",
    best_for: [
      "Apps with complex relational data models",
      "Teams that prefer ORM over raw SQL",
      "Apps needing fine-grained DB control",
    ],
    frontend: { framework: "Next.js 14 App Router", language: "TypeScript" },
    backend: { framework: "Next.js API Routes / Server Actions", language: "TypeScript" },
    database: { name: "PostgreSQL", type: "relational", managed_by: "Neon (serverless)" },
    hosting: { platform: "Vercel", monthly_cost_estimate: "$0 (free tier) → ~$25/mo at scale" },
    dependencies: {
      core: [
        "next@14",
        "react@18",
        "react-dom@18",
        "@prisma/client@5",
        "next-auth@5",
        "tailwindcss@3",
        "zod@3",
      ],
      dev: [
        "typescript@5",
        "@types/node@20",
        "@types/react@18",
        "@types/react-dom@18",
        "prisma@5",
        "autoprefixer@10",
        "postcss@8",
        "eslint@8",
        "eslint-config-next@14",
      ],
    },
    required_env_vars: [
      { name: "DATABASE_URL", description: "Neon Postgres connection string (pooled)", example: "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" },
      { name: "DATABASE_URL_UNPOOLED", description: "Direct connection for migrations", example: "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" },
      { name: "NEXTAUTH_SECRET", description: "Random secret for NextAuth (run: openssl rand -base64 32)", example: "your-secret-here" },
      { name: "NEXTAUTH_URL", description: "Your app's base URL", example: "http://localhost:3000" },
    ],
    key_files: [
      { path: "prisma/schema.prisma", description: "Prisma data model and database connection" },
      { path: "prisma/migrations/001_initial/migration.sql", description: "Initial migration" },
      { path: "src/lib/prisma.ts", description: "Prisma client singleton" },
      { path: "src/app/api/auth/[...nextauth]/route.ts", description: "NextAuth handler" },
      { path: "src/app/layout.tsx", description: "Root layout with session provider" },
      { path: "src/app/page.tsx", description: "Main page" },
    ],
    scaffold_guide: `Generate a Next.js 14 App Router project with Prisma and Neon. Key rules:
- Prisma schema: define all models from the HTML prototype's data, add proper relations
- Use a singleton Prisma client (src/lib/prisma.ts) — critical for serverless environments
- Use NextAuth v5 (Auth.js) for authentication
- Generate initial migration SQL based on the Prisma schema
- Use Server Actions for mutations (not API routes where possible)
- Tailwind CSS for styling
- Zod for validation in Server Actions and API routes`,
  },

  "sveltekit-supabase": {
    id: "sveltekit-supabase",
    name: "SvelteKit + Supabase + Vercel",
    description: "Simpler syntax and less boilerplate than React. Great for founders who found Next.js overwhelming. Supabase handles auth and database.",
    best_for: [
      "Simpler apps and MVPs",
      "Founders who want to learn a framework with less magic",
      "Apps that don't need a large React ecosystem",
    ],
    frontend: { framework: "SvelteKit", language: "TypeScript" },
    backend: { framework: "SvelteKit Hooks & API Routes", language: "TypeScript" },
    database: { name: "PostgreSQL", type: "relational", managed_by: "Supabase" },
    hosting: { platform: "Vercel", monthly_cost_estimate: "$0 (free tier) → ~$20/mo" },
    dependencies: {
      core: [
        "@sveltejs/kit@2",
        "svelte@4",
        "@supabase/supabase-js@2",
        "@supabase/ssr@0",
        "tailwindcss@3",
        "zod@3",
      ],
      dev: [
        "typescript@5",
        "@sveltejs/adapter-vercel@5",
        "@sveltejs/vite-plugin-svelte@3",
        "vite@5",
        "autoprefixer@10",
        "postcss@8",
        "eslint@8",
        "eslint-plugin-svelte@2",
      ],
    },
    required_env_vars: [
      { name: "PUBLIC_SUPABASE_URL", description: "Your Supabase project URL", example: "https://xxxx.supabase.co" },
      { name: "PUBLIC_SUPABASE_ANON_KEY", description: "Your Supabase anon key", example: "eyJhbGci..." },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Server-only service role key", example: "eyJhbGci..." },
    ],
    key_files: [
      { path: "src/lib/server/supabase.ts", description: "Server-side Supabase client" },
      { path: "src/hooks.server.ts", description: "Auth session handling on every request" },
      { path: "src/routes/+layout.svelte", description: "Root layout" },
      { path: "src/routes/+page.svelte", description: "Home page" },
      { path: "src/routes/auth/login/+page.svelte", description: "Login page" },
      { path: "supabase/migrations/001_initial.sql", description: "Initial database schema" },
    ],
    scaffold_guide: `Generate a SvelteKit project with Supabase. Key rules:
- Use @supabase/ssr for server-side auth (not deprecated helpers)
- Handle session in hooks.server.ts, pass to +layout.server.ts via locals
- Use +page.server.ts for server-side data loading and form actions
- Tailwind CSS with svelte-specific PostCSS config
- Use Zod for form validation in actions
- Generate SQL migration matching the HTML prototype's data model`,
  },

  "remix-supabase": {
    id: "remix-supabase",
    name: "Remix + Supabase + Fly.io",
    description: "Best for apps with heavy server-side rendering needs. Remix's nested routing and loader/action pattern gives excellent UX for data-heavy apps. Fly.io offers persistent servers (vs serverless).",
    best_for: [
      "Data-heavy apps where every page loads server-side data",
      "Apps needing persistent server processes (background jobs, WebSockets)",
      "Teams from a React background who want more control",
    ],
    frontend: { framework: "Remix v2", language: "TypeScript" },
    backend: { framework: "Remix Loaders & Actions", language: "TypeScript" },
    database: { name: "PostgreSQL", type: "relational", managed_by: "Supabase" },
    hosting: { platform: "Fly.io", monthly_cost_estimate: "~$5-10/mo (always-on server)" },
    dependencies: {
      core: [
        "@remix-run/node@2",
        "@remix-run/react@2",
        "@remix-run/serve@2",
        "react@18",
        "react-dom@18",
        "@supabase/supabase-js@2",
        "tailwindcss@3",
        "zod@3",
      ],
      dev: [
        "typescript@5",
        "@types/node@20",
        "@types/react@18",
        "@types/react-dom@18",
        "@remix-run/dev@2",
        "autoprefixer@10",
        "postcss@8",
        "eslint@8",
      ],
    },
    required_env_vars: [
      { name: "SUPABASE_URL", description: "Your Supabase project URL", example: "https://xxxx.supabase.co" },
      { name: "SUPABASE_ANON_KEY", description: "Your Supabase anon key", example: "eyJhbGci..." },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Server-only service role key", example: "eyJhbGci..." },
      { name: "SESSION_SECRET", description: "Random secret for session cookies (run: openssl rand -hex 32)", example: "your-secret-here" },
    ],
    key_files: [
      { path: "app/lib/supabase.server.ts", description: "Server-side Supabase client" },
      { path: "app/lib/session.server.ts", description: "Cookie-based session management" },
      { path: "app/root.tsx", description: "Root route with providers" },
      { path: "app/routes/_index.tsx", description: "Home route with loader" },
      { path: "app/routes/auth.login.tsx", description: "Login route with action" },
      { path: "supabase/migrations/001_initial.sql", description: "Initial database schema" },
      { path: "fly.toml", description: "Fly.io deployment config" },
    ],
    scaffold_guide: `Generate a Remix v2 project with Supabase. Key rules:
- All data fetching in loaders (not useEffect) — this is the Remix way
- All mutations in actions with Form component (not fetch/axios)
- Session management: use @remix-run/node's createCookieSessionStorage
- Supabase client: server-only, created per-request in loaders/actions
- Use Zod to validate action form data
- Tailwind CSS for styling
- Generate proper fly.toml with health check and http_service
- Generate SQL migration matching the HTML prototype's data model`,
  },
};

export const STACK_TEMPLATE_LIST = Object.values(STACK_TEMPLATES).map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  best_for: t.best_for,
  hosting_cost: t.hosting.monthly_cost_estimate,
}));
