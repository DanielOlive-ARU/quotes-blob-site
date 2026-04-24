# Implementation Plan And User Runbook

This document is the execution plan for the project being built in this repository.

It is written for two audiences:

- the AI implementing the codebase
- the user performing Azure, GitHub, and deployment setup

The legacy quote-demo code has been archived under `legacy/` and is no longer deployed. New code is scaffolded at the repo root.

## 1. Delivery Strategy

Build the project in vertical slices.
Do not start by writing all 10 converters at once.

Recommended order:

1. scaffold repo workflows and shared types
2. ship one route end to end
3. expand to the simple routes
4. add medium-complexity routes
5. add XML and final hardening
6. deploy and smoke test

This sequence reduces rework and gives a working system early.

## 2. Final Technical Design

### Frontend

- static site hosted in Azure Storage (`$web`)
- one page with:
  - file upload
  - paste input option
  - route selector
  - example/help panel
  - convert button
  - preview area
  - browser download button
  - Azure SAS download link
  - status/error area

### Backend

- one `POST /api/convert` Azure Function
- route metadata and validation separated from converters
- each converter implemented as a pure function where possible
- storage handled through helper utilities
- structured success and error responses

### Storage

- one storage account (existing)
- `$web` container for site hosting (existing)
- `files` container for originals and outputs (existing)
- route-aware blob path prefixes

### CI/CD

- `ci.yml` for build and tests
- `deploy-api.yml` for Azure Functions deployment
- `deploy-site.yml` for `$web` upload

## 3. User Prerequisites

Installed locally:

- Node.js 22 LTS
- npm
- Git
- Azure CLI
- Azure Functions Core Tools v4
- a code editor such as VS Code

Accounts:

- Azure subscription (existing)
- GitHub account (existing)

## 4. Repository And Design Files

Already in place:

- the existing repo is the working repo for this project
- the legacy quote-demo code is preserved in `legacy/`
- `ASSIGNMENT-CONTEXT.md`, `IMPLEMENTATION-PLAN.md`, and `JSON-XML-MVP-PLAN.md` are in the repo root

No further repo setup is required before AI implementation starts.

## 5. Azure Environment (Already Provisioned)

The following are already configured and must not be recreated:

- resource group
- storage account
- static website hosting on the storage account, serving `$web` with `index.html`
- `files` container on the same storage account
- Function App on Node.js 22 Consumption plan, linked to Application Insights
- Function App publish profile is present in GitHub secrets
- CORS on the Function App authorises the static site origin

Function App application settings the new API relies on (names reuse existing legacy naming so no renames are required):

- `FILES_STORAGE` — storage connection string (required; already present)
- `FILES_CONTAINER` — defaults to `files` if absent (optional)
- `MAX_INPUT_BYTES` — defaults to `200000` in code if absent (optional)
- `SAS_EXPIRY_MINUTES` — defaults to `60` in code if absent (optional)

Actual resource names (storage account, resource group, Function App name) are confidential and are referenced only via GitHub Secrets in workflows. They must not be committed to the repo in any form.

## 6. GitHub Configuration

### Secrets in use

- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` — Function App publish profile (existing)
- `AZURE_STORAGE_ACCOUNT` — storage account name (existing)
- `AZURE_STORAGE_SAS_TOKEN` — SAS token for uploading to `$web` (existing)

### Repository variables in use

- `AZURE_FUNCTIONAPP_NAME` — Function App name, kept as a repository Variable rather than a Secret because the Function App hostname is already public in the Azure-assigned URL. Required — the user must add it under `Settings -> Secrets and variables -> Actions -> Variables` before the new `deploy-api.yml` is pushed; otherwise the deploy step will fail with an empty `app-name`.
- `AZURE_STORAGE_STATIC_WEB_URL` — for documentation / smoke-test references (optional)

### Branch protection

For a solo academic repo this is optional but recommended:

- require pull request for merge if working collaboratively
- require status checks for `ci`

## 7. AI Build Plan Inside The Repo

### Phase 0. Initial scaffold

AI creates or updates:

- `.gitignore` (existing — keep/augment as needed)
- root `README.md` noting the project and pointing to the three design `.md` files
- fresh `api/` (alongside `legacy/api/`)
- fresh `site/` (alongside `legacy/site/`)
- `.github/workflows/` with the three new workflows
- initial package files

### Phase 1. Shared contract first

- route union type
- route metadata map
- request and response types
- error envelope
- blob naming utilities
- content type and extension helpers

Deliverable: one working route end to end, preferably `json_to_text`.

### Phase 2. Backend core

- `POST /api/convert`
- validation pipeline
- converter registry
- blob storage helper (reading `FILES_STORAGE` / `FILES_CONTAINER`)
- SAS URL generation
- timing and byte metrics

Deliverable: successful local conversion and storage with one route.

### Phase 3. Frontend core

- upload input
- paste mode
- route dropdown
- example text area
- output preview
- browser download
- Azure download link
- route-specific validation feedback

Deliverable: one full route working in browser against local Functions host.

### Phase 4. Route expansion

Implement in this order:

1. `json_to_text`
2. `list_to_json_array`
3. `form_to_json`
4. `json_to_keyvalue`
5. `csv_to_json`
6. `json_array_to_csv`
7. `json_to_html`
8. `markdown_to_html`
9. `json_to_xml`
10. `xml_to_text`

### Phase 5. Test and harden

- unit tests for all converters
- routing and validation tests
- utility tests
- Azurite integration tests
- deployed smoke tests

### Phase 6. Deploy and verify

- `ci.yml`
- `deploy-api.yml` (reads `AZURE_FUNCTIONAPP_NAME` from repository Variables)
- `deploy-site.yml` (reads `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_SAS_TOKEN` from secrets — existing pattern)
- deployment notes in `docs/deployment.md`

User then:

- pushes to GitHub
- verifies `ci` passes
- verifies API deployment runs
- verifies site deployment runs
- tests the live site and Function App

## 8. Workflow Design

### `ci.yml`

Trigger:

- pull requests to `main`
- pushes to `main`

Run:

- install dependencies
- build API
- run unit tests
- run integration tests if Azurite is included in CI

### `deploy-api.yml`

Trigger:

- push to `main`
- changes under `api/**`
- workflow file changes

Run:

- checkout
- setup Node 22
- install
- build
- test
- prune dev dependencies if needed
- deploy with `Azure/functions-action@v1` using `${{ vars.AZURE_FUNCTIONAPP_NAME }}` as the target app

### `deploy-site.yml`

Trigger:

- push to `main`
- changes under `site/**`
- workflow file changes

Run:

- checkout
- optional HTML/CSS/JS validation step
- upload `site/` contents to `$web` using `${{ secrets.AZURE_STORAGE_ACCOUNT }}` and `${{ secrets.AZURE_STORAGE_SAS_TOKEN }}`

## 9. Local Development Flow

Recommended local loop:

1. run Azurite if integration tests need it
2. run the Functions API locally
3. serve the `site/` folder locally
4. test browser flow
5. run unit tests before commit

Recommended API local settings (`api/local.settings.json`):

- `FILES_STORAGE=UseDevelopmentStorage=true`
- `FILES_CONTAINER=files`
- `MAX_INPUT_BYTES=200000`
- `SAS_EXPIRY_MINUTES=60`

`local.settings.json` must remain gitignored.

## 10. Definition Of Done

The project is complete when:

- the repo root contains only assignment-relevant features
- `legacy/` still contains the original quote-demo code and is untouched by new development
- the frontend is branded as the conversion platform
- all 10 routes are implemented
- route rules match `JSON-XML-MVP-PLAN.md`
- originals and converted blobs are persisted
- download works
- build and tests run in GitHub Actions
- API and site deploy from GitHub Actions
- the deployed app can be demonstrated live

## 11. Submission Checklist

Before submission:

- verify the public static site URL works
- verify the deployed Function App URL works
- test at least 3 representative routes live
- confirm blob uploads exist in Azure Storage
- capture screenshots of:
  - GitHub Actions passing
  - Azure Function App deployed
  - Azure Storage containers/blobs
  - live conversion in browser
- tag the final commit or create a release for presentation stability

## 12. Official Reference Links

- Azure Functions with GitHub Actions:
  - `https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions`
- Azure Storage static website hosting:
  - `https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website-how-to`
- Azure Functions security and CORS guidance:
  - `https://learn.microsoft.com/en-us/azure/azure-functions/security-concepts`
- GitHub Actions secrets:
  - `https://docs.github.com/actions/security-guides/encrypted-secrets`
