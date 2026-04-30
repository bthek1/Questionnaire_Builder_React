# Questionnaire Builder — task runner
# Run `just <recipe>` from the repo root.

backend_dir := "Backend"
venv := backend_dir / ".venv"
python := venv / "bin/python"
manage := python + " " + backend_dir / "manage.py"

# Show all available recipes
default:
    @just --list

# ── Frontend ──────────────────────────────────────────────────────────────────

# Start Postgres, Django, and Vite dev server
[group('frontend')]
dev: db-up
    #!/usr/bin/env bash
    set -e
    {{manage}} migrate
    {{manage}} runserver 0.0.0.0:8000 &
    DJANGO_PID=$!
    trap "kill $DJANGO_PID 2>/dev/null; fuser -k 5173/tcp 2>/dev/null" EXIT INT TERM
    pnpm dev
    wait

# Production build
[group('frontend')]
build:
    pnpm build

# Lint source files
[group('frontend')]
lint:
    pnpm lint

# Lint and auto-fix
[group('frontend')]
lint-fix:
    pnpm lint:fix

# Format source files with Prettier
[group('frontend')]
format:
    pnpm format

# ── Frontend Tests ────────────────────────────────────────────────────────────

# Run unit / integration tests
[group('frontend-test')]
test:
    pnpm test

# Run tests with coverage
[group('frontend-test')]
coverage:
    pnpm coverage

# Run Playwright e2e tests
[group('frontend-test')]
test-e2e:
    pnpm test:e2e

# ── Django ────────────────────────────────────────────────────────────────────

# Create a Python virtual environment and install dependencies
[group('django')]
backend-install:
    python3 -m venv {{venv}}
    {{venv}}/bin/pip install -e {{backend_dir}}

# Start the Django development server
[group('django')]
backend-dev:
    {{manage}} runserver 0.0.0.0:8000

# Apply all pending migrations
[group('django')]
backend-migrate:
    {{manage}} migrate

# Create new migrations from model changes
[group('django')]
backend-makemigrations:
    {{manage}} makemigrations

# Open the Django shell
[group('django')]
backend-shell:
    {{manage}} shell

# Create a Django superuser
[group('django')]
backend-createsuperuser:
    {{manage}} createsuperuser

# Collect static files
[group('django')]
backend-collectstatic:
    {{manage}} collectstatic --noinput

# Run Django tests
[group('django')]
backend-test:
    {{manage}} test

# ── Database ──────────────────────────────────────────────────────────────────

# Start the Postgres container
[group('database')]
db-up:
    docker compose -f {{backend_dir}}/docker-compose.yml up -d

# Stop the Postgres container
[group('database')]
db-down:
    docker compose -f {{backend_dir}}/docker-compose.yml down

# Stop the Postgres container and remove volumes
[group('database')]
db-reset:
    docker compose -f {{backend_dir}}/docker-compose.yml down -v

# Show Postgres container logs
[group('database')]
db-logs:
    docker compose -f {{backend_dir}}/docker-compose.yml logs -f

# ── Combined ──────────────────────────────────────────────────────────────────

# Start Postgres + Django + Vite (alias for dev)
[group('combined')]
start: dev
