.PHONY: install build lint typecheck test test-watch test-cov test-e2e check ci dev start clean

install: ## Install dependencies
	pnpm install

build: ## Compile the project
	pnpm run build

lint: ## Lint (and auto-fix) src/ and test/
	pnpm run lint

typecheck: ## Type-check with no emit
	pnpm run typecheck

test: ## Run unit tests
	pnpm run test

test-watch: ## Run unit tests in watch mode
	pnpm run test:watch

test-cov: ## Run unit tests with coverage
	pnpm run test:cov

test-e2e: ## Run e2e tests
	pnpm run test:e2e

check: lint typecheck test ## Run the full pipeline: lint + typecheck + test (what CI runs)
	@echo "All checks passed."

ci: check ## Alias for check

dev: ## Start in watch mode
	pnpm run start:dev

start: ## Start the production build
	pnpm run start:prod

clean: ## Remove build and coverage artifacts
	rm -rf dist coverage
