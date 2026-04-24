# Testing strategy

## Layers

| Layer | Tooling | Scope | How to run |
|---|---|---|---|
| Unit tests | Vitest | Each converter's `validate` and `convert` functions, routing helpers, utilities | `cd api && npm test` |
| Integration tests | Vitest + `vi.mock` on blob storage | The full `POST /api/convert` handler with mocked uploads | `cd api && npm test` |
| Deployed smoke test | curl + jq inside `deploy-api.yml` | One end-to-end round-trip against the live Function App after each deploy | Fires automatically on every push to `main` |

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

## Outstanding work in Phase 5

- **Playwright end-to-end tests** — planned. A headless browser driving the live static site against the deployed API, asserting the upload / preview / download round-trip.
- **Azurite integration tests** — optional. A second tier of integration tests pointing at a locally-running Azurite emulator to verify the real blob-storage helper rather than only the mocked version.
