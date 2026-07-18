# ADR-002: Chioma API Client Abstraction

## Status
Accepted

## Context
The Chioma AI Agent is a standalone service that must call the Chioma backend REST API with the end user's JWT token (not its own). The client must:
- Support many different endpoints across multiple business domains (payments, escrow, disputes, fraud, etc.)
- Ensure every call carries the user's access token
- Provide type safety for request/response shapes
- Handle common errors consistently
- Scale to support new endpoints without code duplication

## Decision
Created `ChiomaApiClient` as a typed, centralized REST client with:

1. **Method-per-endpoint pattern**
   - `getRecommendations()`, `getPaymentStatus()`, `fileDispute()`, etc.
   - Each method has explicit parameters matching the Chioma backend API
   - Return types are interfaces defined in the client module

2. **Bearer Token Injection**
   - Every HTTP call automatically injects `Authorization: Bearer {accessToken}` header
   - Access token passed per-request (method parameter), not stored on client
   - No "current user" state — stateless, multi-tenant safe

3. **HTTP Abstractions**
   - `private get<T>()` and `private post<T>()` handle common logic
   - Both use NestJS `HttpService` + `firstValueFrom()` for type-safe observables
   - Consistent `baseURL` and header setup

4. **Response Type Interfaces**
   - Separate interface for each domain: `PaymentStatus`, `DisputeInfo`, `FraudSignals`, etc.
   - All return types defined in the client module for centralized discovery
   - Enables IDE autocomplete and compile-time type checking

5. **Endpoint Organization**
   - Comments mark domain sections (Payments, Escrow, Disputes, etc.)
   - Makes client navigation easier as the API grows

## Consequences

### Positive
- Single source of truth for Chioma API contract
- Type-safe: Compile errors for API changes
- Easy to mock in tests
- Easy to add new endpoints
- No middleware/interceptor coupling to HTTP config

### Negative
- Method duplication if endpoints are very similar (e.g., GET endpoints)
- No automatic OpenAPI sync — must manually update client if backend changes
- Adding 20+ methods makes the client file large (~350 lines)

## Alternatives Considered

1. **OpenAPI code generation (OpenAPI Generator, NSwag)** — Rejected: Adds build complexity, auto-generated code harder to maintain
2. **Axios interceptor patterns** — Rejected: Mixes concerns, harder to test
3. **Implicit current-user in DI** — Rejected: Not multi-tenant safe, breaks when handling multiple sessions

## Notes
- The client uses `ConfigService` to read `CHIOMA_API_URL` at runtime (injectable)
- Each method returns a Promise (no observables) for cleaner async/await in tools
- Future: Could add request retry logic, rate limiting, or request/response logging as a cross-cutting concern

## Related Files
- `src/integrations/chioma-api/chioma-api.client.ts` — Main client
- `src/tools/*.tool.ts` — All tools depend on this client
- `src/config/env.validation.ts` — Where `CHIOMA_API_URL` is validated
