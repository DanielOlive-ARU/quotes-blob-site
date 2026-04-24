# Testing strategy

## Layers

| Layer | Tooling | Scope | How to run |
|---|---|---|---|
| Unit tests | Vitest | Each converter's `validate` and `convert` functions, routing helpers, utilities | `cd api && npm test` |
| Integration tests | Vitest + `vi.mock` on blob storage | The full `POST /api/convert` handler with mocked uploads | `cd api && npm test` |
| Deployed smoke test | curl + jq inside `deploy-api.yml` | One end-to-end round-trip against the live Function App after each deploy | Fires automatically on every push to `main` |
| End-to-end browser tests | Playwright | Drives the deployed static site through upload → convert → preview → download for representative routes, plus error handling and route-switching | Fires via `e2e.yml` after either deploy workflow succeeds; `cd e2e && SITE_URL=<url> npm test` locally |

## What the suite currently covers

- **Converters** — ten files under `api/src/converters/`, each with a validate-happy-path test, a validate-reject test, and at least one edge case (URL-encoded input, quoted CSV, null handling, XML entity escaping, etc.).
- **Routing** — request-shape validation, route existence, extension match, empty input, and `MAX_INPUT_BYTES` override.
- **Utilities** — ISO timestamp formatting and blob-path assembly, filename sanitisation and extension replacement.
- **HTTP handler** — happy path for `json_to_text`, all six request-level rejection codes, route-specific rejections, two separate storage-failure paths, metrics population, shared-timestamp invariant, and filename sanitisation in the response shape.

See `api/tests/` for the tree. Coverage targets are defined in [`../IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md) §7 Phase 5.

## Running locally

```bash
cd api
npm ci          # install
npm run build   # type check
npm test        # run Vitest (unit + integration)
```

Integration tests do not need Azurite because blob storage is mocked with `vi.mock("../../src/utils/blob-storage")`. This keeps the suite fast and free of external dependencies.

## CI

`.github/workflows/ci.yml` runs `npm ci`, `npm run build`, and `npm test` on every push and pull request to `main`. A failing test fails the run.

`.github/workflows/deploy-api.yml` also runs the test suite before the deploy step, so broken code can never reach the Function App.

## Post-deploy smoke test

`.github/workflows/deploy-api.yml` ends with a smoke-test step that POSTs a known payload (route `json_to_text`, a small JSON body) to `https://<function-host>/api/convert`, retries up to six times with backoff to tolerate cold-start, and fails the run if the response body is not `{ ok: true }` with the expected converted text. This exercises the full real pipeline: deployment, runtime, blob-storage binding, and CORS.

## Playwright end-to-end tests

Playwright lives in its own workspace at [`../e2e/`](../e2e/) so it can be installed and run independently of the API. The spec (`e2e/tests/site.spec.ts`) covers:

- Four-step UI renders with correct section headings.
- Dropdown lists exactly 10 routes.
- The first route is pre-selected on load and the example panel is populated.
- `json_to_text` round-trip end to end: select route, fill text, click Convert, assert preview text, assert success status.
- Download button produces a file with the expected `.txt` extension.
- Validation failure (invalid JSON) surfaces a structured error in the status area and hides the output section.
- Switching routes updates the description and accepted extensions.

The workflow `e2e.yml` is triggered via `workflow_run` after either `deploy-api.yml` or `deploy-site.yml` completes successfully on `main`. It reads the deployed site URL from the `AZURE_STORAGE_STATIC_WEB_URL` repository Variable and fails the run if the Variable is missing. Playwright browser binaries are cached in the runner to keep subsequent runs fast.

Run locally:

```bash
cd e2e
npm ci
npx playwright install --with-deps chromium
SITE_URL="https://<your-static-site>" npx playwright test
npx playwright show-report
```

## Outstanding work in Phase 5

- **Azurite integration tests** — optional. A second tier of integration tests pointing at a locally-running Azurite emulator to verify the real blob-storage helper rather than only the mocked version.
