<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: CAMAC - San Fernando Events

- Full spec, decisions and build order: `docs/PROJECT_BRIEF.md`. Check it before adding features; the "Explicitly not planned" list is deliberate.
- Next.js 16 with `cacheComponents: true`: anything reading cookies/headers/searchParams (e.g. `requireAdmin()`) must render inside `<Suspense>`.
- Protect admin pages and server actions with `requireAdmin()` / `requirePrayerTeam()` from `src/lib/dal.ts`, never with client-side checks.
- Store UTC, display `Asia/Manila` (`src/lib/time.ts`). Slugs are immutable after creation (`src/lib/slug.ts`).
- Public queries must filter `publishedAt: { not: null }, deletedAt: null`.
- Prisma 7: client is generated to `src/generated/prisma` (gitignored); import from `@/generated/prisma/client`. Server code uses `db` from `src/lib/db.ts`.
- When writing or reviewing React/Next.js code, apply the `vercel-react-best-practices` skill (`.agents/skills/vercel-react-best-practices/`; Claude Code entry point in `.claude/skills/`). The rules above and the Next 16 docs win where they conflict.
- Public repo: never commit real emails, secrets or private church details.
- Before committing: `npm run typecheck && npm run lint && npm test`.
