# AI Development Guidelines for This Project

## Critical Rules for AI Assistants

When working on this project, you MUST follow these guidelines to ensure code quality and project stability.

## End-of-Task Requirements

Before completing ANY task, you MUST:

1. **Run Diagnostics**: Check for syntax, type, and linting errors
2. **Fix All Errors**: Address every error found — do not leave the codebase broken
3. **Verify Build**: Ensure `pnpm run build` succeeds
4. **Run Tests**: Execute relevant tests to verify functionality

## Project Structure

This is a standalone NestJS service — a sibling to, not a fork of, the main [`chioma`](https://github.com/chioma-housing-protocol-I/chioma) monorepo. It talks to that repo's backend over REST; it does not share a database or business logic with it.

```
src/
  agent/
    conversation/     # ConversationService — orchestrates a chat turn, tool-calling loop
    llm/               # LLM provider abstraction (OpenAI / Anthropic) + types
    memory/            # Session stores: in-memory, Redis
  tools/               # AgentTool implementations (listings, wizard, payments, escrow, ...)
  integrations/
    chioma-api/        # ChiomaApiClient — typed client for the chioma backend
  modules/
    chat/              # POST /chat, DELETE /chat/:sessionId
    health/            # /health
  config/              # env.validation.ts — AppConfig
```

## Required Checks

```bash
pnpm install

# Individually
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e   # once test/ e2e specs exist
pnpm run build

# Or all at once
make check
# equivalent to: pnpm run lint && pnpm run typecheck && pnpm run test
```

## Workflow for Every Task

1. **Make Changes**: Implement the requested feature or fix.
2. **Run `make check`**: Fix anything it flags before considering the task done.
3. **Add/update tests**: New code paths need test coverage — see `src/tools/listings.tool.spec.ts` for the established mocking pattern (mock `ChiomaApiClient`, assert forwarded arguments and response shape).
4. **Update docs**: If you add a new tool file, register it in `tools.module.ts` and note it in the README's architecture table. Design decisions that aren't obvious from the code go in `docs/architecture/` as an ADR.
5. **Screenshot/recording**: Every PR needs a screenshot, curl/Postman capture, or short recording demonstrating the change — see `.github/pull_request_template.md`.

## Conventions Specific to This Repo

- **Tool files** (`src/tools/*.tool.ts`) follow one pattern: a class implementing `AgentTool`, a corresponding method on `ChiomaApiClient` if it calls the backend, registration in `tools.module.ts`, and a `.spec.ts` mocking `ChiomaApiClient`.
- **Session stores** must implement the same interface as `InMemorySessionStore`/`RedisSessionStore` — see `SESSION_STORE` env var for how the active implementation is selected.
- **LLM providers** (`src/agent/llm/providers/*.provider.ts`) must implement the shared `LlmMessage`/`LlmCompletionResult` shape in `src/agent/llm/llm.types.ts` regardless of the underlying SDK's native format.
- **Never conflate** "AI agent" (this service) with the on-chain human "agent" role (`agent_registry` contract, real-estate agents) — see the naming note in the README.

## Security

- Never commit secrets (`CHIOMA_API_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) — use `.env`, which is gitignored.
- See [SECURITY.md](./SECURITY.md) for how to report vulnerabilities — do not open a public issue for them.
