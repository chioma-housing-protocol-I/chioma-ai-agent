# ADR 0001: LLM provider abstraction

- **Status:** Accepted
- **Date:** 2026-07-11
- **Context:** Chioma AI Agent (`chioma-agent`)

## Context

The agent needs to call large language models for conversation turns and tool use, but teams may prefer OpenAI, Anthropic, or future vendors. Hard-coding one SDK at call sites would spread provider-specific types through the conversation engine, tools, and tests.

The README already proposed a swappable LLM layer under `src/agent/llm/`. This ADR records why that boundary exists and how messages are normalized.

## Decision

1. **Define a provider interface** — `LlmProvider` exposes a single `complete(request: LlmCompletionRequest): Promise<LlmCompletionResult>` method (`src/agent/llm/llm-provider.interface.ts`).

2. **Normalize messages in `llm.types.ts`** — All providers consume the same shapes:
   - `LlmMessage` with `role: 'system' | 'user' | 'assistant' | 'tool'`, optional `toolCalls` on assistant messages, and `toolCallId` / `name` on tool result messages.
   - `LlmCompletionRequest` wraps `messages`, optional `tools`, and generation knobs (`maxTokens`, `temperature`).
   - `LlmCompletionResult` returns a single assistant `LlmMessage` plus `stopReason: 'stop' | 'tool_calls' | 'length'`.

3. **Implement one class per vendor** — `OpenAiLlmProvider` and `AnthropicLlmProvider` map between vendor SDK payloads and the internal types. NestJS selects the implementation via `LLM_PROVIDER` based on `LLM_PROVIDER` env config.

4. **Keep conversation code vendor-agnostic** — `ConversationService`, session memory, and tools only ever read/write `LlmMessage[]`; they never import OpenAI or Anthropic types.

## Rationale

| Approach | Why / why not |
| -------- | --------------- |
| **Internal `LlmMessage` shape** | Tool-calling flows need a stable representation for assistant tool calls and tool results across providers that use different field names (`tool_calls` vs content blocks). |
| **Single `complete()` entry point** | The agent runtime only needs chat completions with optional tools today; streaming can be a separate interface later without breaking callers. |
| **NestJS DI token (`LLM_PROVIDER`)** | Matches the rest of the service, keeps tests able to inject fakes, and avoids `if (provider === 'openai')` scattered in business logic. |
| **Not calling SDKs from controllers** | HTTP layer stays thin; provider swaps remain a config concern. |

## Consequences

- Adding a provider means: implement `LlmProvider`, map request/response types, register in `llm.module.ts`, document env vars in `.env.example`.
- Provider-specific quirks (e.g. Anthropic system messages as a separate field) stay inside the adapter — callers still pass `LlmMessage[]`.
- Tests can stub `LlmProvider` without network access.

## References

- `src/agent/llm/llm.types.ts`
- `src/agent/llm/llm-provider.interface.ts`
- `src/agent/llm/providers/openai.provider.ts`
- `src/agent/llm/providers/anthropic.provider.ts`
- `src/agent/conversation/conversation.service.ts`
