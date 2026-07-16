# Contributing to Chioma AI Agent

Thanks for contributing! This guide covers local setup, the checks your PR needs to pass, and what we expect in a PR.

## Local Setup

```bash
git clone https://github.com/chioma-housing-protocol-I/chioma-ai-agent.git
cd chioma-ai-agent
pnpm install
cp .env.example .env
# Fill in .env: at minimum LLM_PROVIDER, LLM_MODEL, and the matching API key
# (OPENAI_API_KEY or ANTHROPIC_API_KEY). SESSION_STORE=memory needs no extra
# setup; SESSION_STORE=redis needs a running Redis at REDIS_URL.

pnpm run start:dev
```

## Before Opening a PR

Run everything the CI pipeline runs:

```bash
make check
# equivalent to: pnpm run lint && pnpm run typecheck && pnpm run test
```

Or run checks individually:

```bash
pnpm run lint        # eslint --fix
pnpm run typecheck    # tsc --noEmit
pnpm run test         # jest unit tests
pnpm run test:e2e     # jest e2e tests, once test/ specs exist
pnpm run build        # nest build
```

Add or update tests for any code you touch. For a new tool file under `src/tools/`, mirror the pattern in `src/tools/listings.tool.spec.ts` (mock `ChiomaApiClient`, assert forwarded arguments and response shape).

## PR Expectations

Every PR must:

1. **Reference the issue it closes** (`Closes #123`) and satisfy every item in that issue's **Acceptance Criteria**.
2. **Pass `make check`** — a red CI run will not be merged.
3. **Include a screenshot or short screen-recording** demonstrating the change. Terminal output or a short recording of tests/logs is acceptable for non-HTTP/internal changes. This is required — see `.github/pull_request_template.md`.
4. **Not leave the codebase in a worse state** — no new lint/type errors, no dropped test coverage.

## Picking Up an Issue

Most open issues are self-contained and labeled by difficulty (`good first issue`, `help wanted`) and area. If an issue references an ADR that doesn't exist yet, write the ADR first (see `docs/architecture/`) — implementation issues that depend on one will say so.

## Questions

Join the contributor chat: https://t.me/chiomagroup

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) instead of opening a public issue.
