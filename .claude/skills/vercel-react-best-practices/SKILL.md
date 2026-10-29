---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code (components, pages, server actions, data fetching, bundle size, re-renders) to ensure optimal performance patterns.
---

# Vercel React Best Practices (Claude Code entry point)

The skill itself is installed at `.agents/skills/vercel-react-best-practices/` (managed by `skills-lock.json`). This file only makes it discoverable by Claude Code; don't copy rules here.

1. Read `.agents/skills/vercel-react-best-practices/SKILL.md` for the prioritized rule index.
2. Open the specific rule files you need from `.agents/skills/vercel-react-best-practices/rules/<rule-id>.md` (e.g. `async-parallel.md`, `server-auth-actions.md`). Only fall back to the compiled `AGENTS.md` there (~3800 lines) for a full review.
3. Prioritize CRITICAL/HIGH categories (`async-`, `bundle-`, `server-`) before lower ones.

## Project precedence

This project's `AGENTS.md` wins when it conflicts with a rule:

- Next.js 16 APIs come from `node_modules/next/dist/docs/`, not the skill's examples. With `cacheComponents: true`, prefer `"use cache"` / Suspense boundaries over ad-hoc caching, and keep request-time reads inside `<Suspense>`.
- `server-auth-actions` is mandatory here: every server action calls `requireAdmin()` / `requirePrayerTeam()` from `src/lib/dal.ts`.
- `server-cache-lru` and `client-swr-dedup` add dependencies; check `docs/PROJECT_BRIEF.md` before introducing new packages.
