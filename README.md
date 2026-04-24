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

The converter platform is being built in the vertical slices described in `IMPLEMENTATION-PLAN.md` §1. Phase 0 (initial scaffolding) establishes the repo shape and a placeholder `POST /api/convert` endpoint. Further phases add the shared route contract, real converters, the frontend UI, tests, and deployment hardening.

## Legacy code

The preceding quote-demo project lives under [`legacy/`](legacy/) for reference and recoverability. None of that code is imported, executed, or deployed by the current workflows.
