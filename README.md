# Serverless Cloud Conversion Platform

An academic prototype of a serverless file conversion service on Azure.

The application accepts a file upload from a static web frontend, routes the upload to a serverless backend, converts the file into another format, stores both the original and converted files in Azure Blob Storage, and returns the converted content for browser-side download.

## Design documents

- [`ASSIGNMENT-CONTEXT.md`](ASSIGNMENT-CONTEXT.md) — target design, architectural rules, and API contract
- [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) — build phases, testing tiers, and local development flow
- [`JSON-XML-MVP-PLAN.md`](JSON-XML-MVP-PLAN.md) — the 10-route catalogue and conversion rules

## Reference documents

- [`docs/architecture.md`](docs/architecture.md) — component diagram and layer responsibilities
- [`docs/cost.md`](docs/cost.md) — cost-aware design decisions and risks
- [`docs/testing.md`](docs/testing.md) — test tiers, coverage, and how to run locally
- [`docs/deployment.md`](docs/deployment.md) — CI/CD pipeline, secrets/variables, and manual interventions
- [`docs/submission.md`](docs/submission.md) — pre-submission checklist and demo-day notes

## Repository layout

```text
api/                     Azure Functions app (TypeScript, Node.js 22)
site/                    Static frontend (HTML, CSS, vanilla JS)
e2e/                     Playwright end-to-end tests against the deployed site
legacy/                  Preserved quote-demo codebase — not deployed
  api/                   Original Functions app
  site/                  Original static site
  github-workflows-archive/  Original deploy workflows
.github/workflows/       CI, deploy, and E2E workflows for the current build
docs/                    Architecture, cost, testing, deployment, submission
```

## Build status

The converter platform was built in the vertical slices described in `IMPLEMENTATION-PLAN.md` §1.

- **Phase 0** — initial scaffolding, `.github/workflows/`, and repo shape. _Done._
- **Phase 1** — shared contract types, route registry, validation pipeline, blob storage helper, timestamp/filename utilities, and the first converter (`json_to_text`) wired through `POST /api/convert` end to end on the backend, plus unit tests for the converter, validation, timestamp, and filename sanitiser. _Done._
- **Phase 2** — backend core: `POST /api/convert` handler with full validation pipeline, converter registry, blob-storage helper, structured Application Insights logging, and timing / byte metrics in the response. _Done._
- **Phase 3** — frontend UI driving `POST /api/convert` with file upload, paste mode, route-specific help, preview, and client-side download. The deploy-site workflow substitutes the Function App hostname into `site/app-config.js` at upload time so the live static site always points at the current API. _Done._
- **Phase 4** — the full 10-route catalogue per `IMPLEMENTATION-PLAN.md` §7. _Done. All ten routes implemented: `json_to_text`, `list_to_json_array`, `form_to_json`, `json_to_keyvalue`, `csv_to_json`, `json_array_to_csv`, `json_to_html`, `markdown_to_html`, `json_to_xml`, `xml_to_text`._
- **Phase 5** — test harden. _Done._ 124 Vitest tests (110 unit + 14 integration), with `uploadBlob` mocked so no emulator is required. A post-deploy smoke test in `deploy-api.yml` exercises the live endpoint end to end after every API deploy with retry-on-cold-start. Structured Application Insights logging emits a `convert` event per request with `outcome`, `route`, byte counts, duration, and `invocationId`. A separate Playwright end-to-end suite (`e2e/`) drives the deployed static site through upload → convert → preview → download via the `e2e.yml` workflow, triggered after either deploy workflow succeeds.
- **Phase 6** — deploy and verify. _Done._ Three deploy workflows (`ci.yml`, `deploy-api.yml`, `deploy-site.yml`) plus the post-deploy `e2e.yml` are live; every push to `main` runs the full pipeline. See `docs/deployment.md` and `docs/submission.md` for the operational runbook and the pre-submission checklist.

## Legacy code

The preceding quote-demo project lives under [`legacy/`](legacy/) for reference and recoverability. None of that code is imported, executed, or deployed by the current workflows.
