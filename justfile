# Questionnaire Builder — task runner
# Run `just <recipe>` from the repo root.

default: dev

# Start the Vite dev server
dev:
    pnpm dev

# Production build
build:
    pnpm build

# Run unit / integration tests
test:
    pnpm test

# Run tests with coverage
coverage:
    pnpm coverage

# Run Playwright e2e tests
test-e2e:
    pnpm test:e2e

# Lint source files
lint:
    pnpm lint

# Lint and auto-fix
lint-fix:
    pnpm lint:fix

# Format source files with Prettier
format:
    pnpm format
