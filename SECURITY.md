# Security Policy

## Supported Versions

This project is pre-1.0 and under active development. Security fixes are applied to the `main` branch only; there are no maintained release branches yet.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately using one of these channels:

1. **GitHub Private Vulnerability Reporting** (preferred): go to the [Security tab](../../security/advisories) of this repository and click "Report a vulnerability".
2. **Email**: security@chioma.dev

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (or a proof-of-concept, if safe to share privately)
- The affected file(s)/module(s), if known

## What to expect

- We'll acknowledge your report as soon as we can.
- We'll investigate and, if confirmed, work on a fix before any public disclosure.
- Once a fix is available, we'll coordinate disclosure timing with you and credit you (unless you prefer to remain anonymous).

## Scope

In scope: this repository (`chioma-ai-agent`) — the conversational agent service, its tool-calling layer, session/memory stores, and its integrations with the `chioma` backend API and Stellar Horizon.

Vulnerabilities in the main [`chioma`](https://github.com/chioma-housing-protocol-I/chioma) monorepo (frontend/backend/contracts) should be reported to that repository's security channel instead.
