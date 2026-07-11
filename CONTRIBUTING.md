# Contributing to Chioma AI Agent

Thanks for helping build the conversational layer for [Chioma](https://t.me/chiomagroup). This service is a **standalone NestJS app** that talks to the main `chioma` backend over HTTP — it does not import the monorepo directly.

## Local setup

**Requirements:** Node.js 20+, [pnpm](https://pnpm.io/)

```bash
git clone https://github.com/chioma-housing-protocol-I/chioma-ai-agent.git
cd chioma-ai-agent
pnpm install
cp .env.example .env
```

Edit `.env` with at least:

| Variable | Purpose |
| -------- | ------- |
| `LLM_PROVIDER` / `LLM_MODEL` | `openai` or `anthropic` |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | LLM credentials |
| `CHIOMA_API_URL` | Chioma backend base URL (see `chioma/backend/openapi.json`) |
| `SESSION_STORE` | `memory` for local dev; `redis` when `REDIS_URL` is set |

Start the dev server:

```bash
pnpm run start:dev
```

Health check: `GET http://localhost:3100/health` (default port from `.env.example`).

## Before opening a PR

The `ci` script in `package.json` encodes the required checks — run it locally:

```bash
pnpm run ci
```

That runs, in order:

1. `pnpm run lint` — ESLint on `src/` and `test/`
2. `pnpm run typecheck` — `tsc --noEmit`
3. `pnpm run test` — Jest unit tests

Optional but recommended:

```bash
pnpm run build        # compile NestJS output
pnpm run test:e2e     # end-to-end specs (when present)
```

Fix lint issues with `pnpm run lint` (it applies `--fix`).

## Pull request expectations

- **One concern per PR** when possible (e.g. docs vs feature vs fix).
- **Link the issue** (`Fixes #123`) in the PR description.
- **Tests** for behavior changes — especially DTO validation, tools, and conversation logic.
- **No secrets** in commits — keep API keys in `.env` only.
- **Naming clarity:** "AI agent" here means this LLM service, not Chioma's human marketplace "agent" role (see README).

## Project layout (quick map)

```text
src/
├── agent/          # conversation engine, LLM providers, session memory
├── tools/          # listings, wizard, etc. — callable by the agent
├── integrations/   # typed client for the chioma backend API
├── modules/chat/   # HTTP chat endpoints
└── config/         # env validation
```

## Questions?

Open a [GitHub issue](https://github.com/chioma-housing-protocol-I/chioma-ai-agent/issues) if setup fails or scope is unclear. For good first tasks, see issues labeled [`good first issue`](https://github.com/chioma-housing-protocol-I/chioma-ai-agent/labels/good%20first%20issue).
