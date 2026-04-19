# Upgrade playbook — Phase 10.2

Walk this checklist whenever you bump a major dependency (Next, React,
Claude models, Anthropic SDK, Node, Tailwind). Each section owns one
tricky dep we've actually hit in production.

## Pre-flight (always)

```bash
git checkout watt-city
git pull --rebase
pnpm install
pnpm build && pnpm test
# Snapshot the current tip hash so you can roll back cleanly:
git rev-parse HEAD > .upgrade-baseline.txt
```

## Next.js major

1. Read release notes in `node_modules/next/dist/docs/` **before**
   running `pnpm add next@latest`. Breaking changes frequently land in
   the `app/` router, metadata API, and middleware runtime.
2. Test with: `NODE_OPTIONS="--max-old-space-size=6144" pnpm build` and
   all 200+ unit tests.
3. Specifically re-verify:
   - `middleware.ts` (edge runtime imports must stay free of `node:`
     modules — see `lib/csrf-shared.ts` split).
   - `export const dynamic = "force-dynamic"` semantics on
     `/api/cron/*` and `/miasto`.
   - `layout.tsx` metadata schema — React 19 + Next 16 split
     `viewport` out of `metadata`; verify the split stayed.
4. Visual smoke test at `/`, `/miasto`, `/games/finance-quiz`.

## React major

1. Check `components/*.tsx` for deprecated patterns
   (`useEffect(() => fetch...)` without AbortController, ref-forwarding
   without `forwardRef` where still required).
2. Run `pnpm build` with strict mode enabled.
3. Verify `useReportWebVitals` import path.

## Claude model migration (e.g. Sonnet 4.7 → 4.8)

```bash
# 1. Poll admin to see what's available
curl -H "Authorization: Bearer $ADMIN_SECRET" https://watt-city.vercel.app/api/admin/engine-check
```

2. Update `PRIMARY_MODEL` / `TRANSLATION_MODEL` constants in
   `lib/ai-pipeline/generate.ts`.
3. Run mock-path tests: `pnpm test` (they exercise the pipeline without
   real Claude calls).
4. Deploy to preview, force-rotate:
   `curl -X POST https://preview-*.watt-city.vercel.app/api/admin/rotate-ai`
5. Inspect the generated spec — check field shapes match existing
   `AiGameSchema`. Rare regressions: Claude adds new optional fields
   that zod rejects under `.strict()`.

## Anthropic SDK minor

Mostly safe — `@anthropic-ai/sdk` is stable. Watch for:
- Breaking changes to `messages.parse` signature.
- New required headers.

## Tailwind 4 → 5

Deferred until v5 ships stable. Our CSS is neo-brutalist, not utility-
heavy, so the risk surface is small, but run a visual smoke pass on
`/` and `/miasto`.

## Node LTS bump

- Current: Node 22 LTS (Hardhat 3 supports only 22; Next 16 works on
  22+).
- Watch: Node 24 LTS due autumn 2026.
- Upgrade steps: bump Vercel runtime pin (vercel.json or project
  settings), update `.nvmrc` if present, run build + tests.

## Rollback

```bash
git checkout $(cat .upgrade-baseline.txt)
git push --force-with-lease origin watt-city
```

(Hard constraint: agent never force-pushes. Operator runs this.)

## Dependabot PRs

Dependabot opens PRs into `watt-city` per `.github/dependabot.yml`.
Review workflow:

1. Read the PR diff.
2. Run `pnpm install` against the PR branch locally.
3. `pnpm build && pnpm test`.
4. If tests pass, merge.
5. If tests fail, close the PR with a comment explaining why (or
   cherry-pick a hotfix onto the dependabot branch).
