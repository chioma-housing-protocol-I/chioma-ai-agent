# ADR-001: Tool Implementation Pattern and Abstraction

## Status
Accepted

## Context
The Chioma AI Agent must support multiple agent capabilities (tools) that the LLM can call to interact with the Chioma backend and Stellar contracts. Each tool must:
- Be independently testable
- Have a consistent interface for the LLM
- Clearly define parameters with JSON Schema
- Handle errors gracefully
- Return structured JSON responses

## Decision
Implemented a unified tool pattern across all 15 agent tools using:

1. **Consistent Interface** (`AgentTool`)
   - `definition`: LLM tool metadata (name, description, parameters in JSON Schema)
   - `execute(args, context)`: Async method taking parsed arguments and user context
   - Returns JSON stringified output for LLM consumption

2. **Tool Categories**
   - **Listings** (3 tools): Property recommendations, matching, similarity
   - **Wizard** (3 tools): Pricing, description, completeness suggestions
   - **Payments** (3 tools): Status, transaction, charge breakdown
   - **Escrow** (3 tools): Status, release requests, claims
   - **Disputes** (4 tools): Status, filing, evidence, settlement
   - **Fraud** (3 tools): Signals, alerts, reporting
   - **Notifications** (3 tools): Retrieval, dismissal, preferences

3. **Backend Abstraction** (`ChiomaApiClient`)
   - Typed interface matching Chioma backend REST API
   - Centralized Bearer token injection
   - Consistent error handling
   - Supports both GET and POST operations

4. **Testing Pattern**
   - Mock `ChiomaApiClient` methods for each tool
   - Assert correct arguments forwarded
   - Verify response shape (JSON-stringified)
   - No external network calls in unit tests

5. **Registration** (`ToolsModule`)
   - NestJS dependency injection for tool providers
   - `AGENT_TOOLS` token for tool collection
   - `ToolRegistry` loads all tools at bootstrap

## Consequences

### Positive
- Scalable: New tools added in <30 lines (tool + test class)
- Testable: 100% unit test coverage possible
- Maintainable: Single pattern across all 15 tools
- Flexible: Easy to swap LLM providers or add new tools
- Type-safe: Full TypeScript support

### Negative
- Verbose: Each tool + test file requires ~150 lines
- Runtime overhead: Tool definitions loaded into memory on startup
- API coupling: Tightly bound to Chioma backend REST contract

## Alternatives Considered

1. **Single monolithic tool** — Rejected: Too hard to test, poor separation of concerns
2. **Decorator-based tools** — Rejected: Adds complexity without clear benefit
3. **YAML-driven tools** — Rejected: No static type checking, harder to extend with custom logic

## Notes
- Each tool is an `@Injectable()` class, enabling NestJS DI for database/config if needed
- Tools return JSON strings (not parsed objects) for LLM safety — all output is re-parsed by agent
- Future: May add a tool versioning system for backward compatibility during API evolution
