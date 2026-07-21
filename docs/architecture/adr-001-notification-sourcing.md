# ADR: Notification Sourcing Strategy for notifications.tool.ts

## Status
**Proposed / Accepted**

---

## Context
The chioma-ai-agent service requires a proactive notification and follow-up layer (notifications.tool.ts, Phase 3) to alert landlords, tenants, and human agents about critical events (such as rent due dates, draft expirations, or dispute deadlines). 

Because chioma-ai-agent is a standalone sibling service consuming the core NestJS chioma backend API rather than duplicating its database, we must decide how notifications.tool.ts will source events from the backend:
1. **Polling Strategy**: The agent service runs scheduled background worker jobs (e.g., via @nestjs/schedule) that periodically query backend REST endpoints.
2. **Webhook / Event Subscription Strategy**: The core backend pushes events via HTTP webhooks or an event stream.

---

## Decision
We choose the **Polling Strategy via NestJS Scheduled Jobs (@nestjs/schedule)** combined with on-demand user-driven fetches for the initial implementation.

### Rationale:
* **Decoupled Architecture**: Operates as a pure consumer of existing backend REST APIs without requiring modifications to the core production monorepo.
* **Simplicity & Reliability**: Avoids webhook delivery failures, signature verification overhead, and complex retry queues in early phases.
* **Resource Efficiency**: Sensible poll intervals combined with Redis caching prevent excessive load on the backend database.

---

## Endpoints Sourced from the Chioma Backend

| Event Type | Backend Endpoint / Source | Description | Polling Frequency |
| :--- | :--- | :--- | :--- |
| **Rent Due Reminders** | GET /payments/upcoming | Fetches active rent obligations nearing due dates. | Daily (cron) |
| **Draft Expiry Warnings** | GET /property-listings/drafts | Identifies listings stuck in draft status nearing expiration. | Daily (cron) |
| **Dispute Deadlines** | GET /disputes/active | Checks active arbitration cases for approaching response deadlines. | Every 6 hours |
| **General Notifications** | GET /notifications | Syncs unread user notifications to surface in the agent. | On-demand / Session load |

---

## Consequences
* **Positive**: Rapid implementation; robust against transient network drops.
* **Negative / Trade-off**: Minor polling latency before an event is proactively surfaced.
