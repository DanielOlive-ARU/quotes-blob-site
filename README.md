# Serverless Cloud Conversion Platform

An academic prototype of a serverless file conversion service on Azure.

The application accepts a file upload from a static web frontend, routes the upload to a serverless backend, converts the file into another format, stores both the original and converted files in Azure Blob Storage, and returns the converted content for browser-side download.

## Design documents

- [`ASSIGNMENT-CONTEXT.md`](ASSIGNMENT-CONTEXT.md) — target design, architectural rules, and API contract
- [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) — build phases, testing tiers, and local development flow
- [`JSON-XML-MVP-PLAN.md`](JSON-XML-MVP-PLAN.md) — the 10-route catalogue and conversion rules

## Repository layout

```text
api/                     Azure Functions app (TypeScript, Node.js 22)
site/                    Static frontend (HTML, CSS, vanilla JS)
legacy/                  Preserved quote-demo codebase — not deployed
  api/                   Original Functions app
  site/                  Original static site
  github-workflows-archive/  Original deploy workflows
.github/workflows/       CI and deploy workflows for the current build
```

## Build status

The converter platform is being built in the vertical slices described in `IMPLEMENTATION-PLAN.md` §1.

- **Phase 0** — initial scaffolding, `.github/workflows/`, and repo shape. _Done._
- **Phase 1** — shared contract types, route registry, validation pipeline, blob storage helper, timestamp/filename utilities, and the first converter (`json_to_text`) wired through `POST /api/convert` end to end on the backend, plus unit tests for the converter, validation, timestamp, and filename sanitiser. _Done._
- **Phase 2** — remaining backend hardening beyond the first route (error envelope refinements, logging detail). _In progress._
- **Phase 3** — frontend UI driving `POST /api/convert` with file upload, paste mode, route-specific help, preview, and client-side download. The deploy-site workflow substitutes the Function App hostname into `site/app-config.js` at upload time so the live static site always points at the current API. _Done._
- **Phase 4** — the full 10-route catalogue per `IMPLEMENTATION-PLAN.md` §7. _Done. All ten routes implemented: `json_to_text`, `list_to_json_array`, `form_to_json`, `json_to_keyvalue`, `csv_to_json`, `json_array_to_csv`, `json_to_html`, `markdown_to_html`, `json_to_xml`, `xml_to_text`._
- **Phase 5** — full test harden: Vitest integration tests against Azurite, Playwright end-to-end tests, deployed smoke tests.
- **Phase 6** — deploy and verify.

## Legacy code

The preceding quote-demo project lives under [`legacy/`](legacy/) for reference and recoverability. None of that code is imported, executed, or deployed by the current workflows.
