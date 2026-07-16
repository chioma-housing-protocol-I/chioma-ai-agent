## 📝 Description

<!-- Brief description of the changes -->

## 🎯 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔒 Security fix
- [ ] 🧹 Code cleanup/refactoring

## 🔗 Related Issues

<!-- Link to related issues -->

Closes #

## 📋 Changes Made

<!-- List the specific changes -->

-
-

## ✅ Acceptance Criteria

<!-- Copy the Acceptance Criteria checklist from the linked issue and check off each item as you satisfy it. A PR that doesn't satisfy every item from the issue's Acceptance Criteria will not be merged. -->

- [ ]
- [ ]

## 🧪 Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] `pnpm run ci` (lint + typecheck + test) passes locally, or `make check`

## 📸 Screenshot / Recording

<!-- REQUIRED. A screenshot, curl/Postman capture, or short screen-recording demonstrating the change actually works. Terminal output or a short recording of tests/logs is acceptable for non-HTTP/internal changes. PRs without this will not be merged. -->

## 📊 Checklist

### Code Quality

- [ ] Code follows project style guidelines (`pnpm run lint`)
- [ ] No unused variables or imports
- [ ] Types are correct (`pnpm run typecheck`)

### Security

- [ ] No hardcoded secrets or API keys
- [ ] Input validation added where user/LLM input crosses a trust boundary
- [ ] Authorization checks in place for any new endpoint or tool

### Documentation

- [ ] README updated (if needed)
- [ ] CONTRIBUTING.md updated (if needed)
- [ ] ADR added under `docs/architecture/` (if this is a design decision)

## 🔄 Reviewer Checklist

- [ ] Code changes are clear and understandable
- [ ] Tests are comprehensive
- [ ] Acceptance Criteria from the linked issue are fully met
- [ ] Screenshot/recording provided and demonstrates the change
- [ ] No security concerns
