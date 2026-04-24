# Assignment Context - Project Design Handover

This document captures the target design for the academic project being built in this repository.

Use this document first in any future AI session.
Then read `IMPLEMENTATION-PLAN.md`.
Then read `JSON-XML-MVP-PLAN.md`.

The existing repository is being reused as the home for the new conversion platform build. The previous quote-demo code is archived in `legacy/` for reference and recoverability and is no longer deployed. New code is scaffolded at the repo root alongside `legacy/`.

## 1. Project Framing

Product title (for academic submission):

`Serverless Cloud Conversion Platform`

Why reuse the existing repo instead of creating a fresh one:

- The existing Azure Function App, storage account, `$web` static-site container, `files` blob container, GitHub secrets, and CORS rules are already in place and working.
- Reusing them avoids portal setup friction and preserves deployment continuity.
- The old code lives under `legacy/` and stays in git history even after the root is replaced.

## 2. What The Project Must Achieve

The project must satisfy the assignment brief directly:

- provide a cloud-hosted static web interface
- allow a user to upload a file
- route the file to a backend conversion service
- convert the input into a different format
- store both original and converted files in cloud storage
- allow download of the converted result
- be deployed using Azure cloud-native services
- use GitHub and GitHub Actions for automated deployment
- demonstrate modular serverless backend design
- include automated tests for core logic

The project targets all 10 suggested conversion routes:

1. `json_to_html`
2. `json_to_text`
3. `list_to_json_array`
4. `csv_to_json`
5. `json_array_to_csv`
6. `form_to_json`
7. `json_to_keyvalue`
8. `xml_to_text`
9. `markdown_to_html`
10. `json_to_xml`

## 3. Design Positioning

This is not a general file-processing SaaS. It is a focused academic prototype that demonstrates:

- serverless compute
- routing separated from conversion logic
- cloud storage persistence
- CI/CD deployment
- testable modular design

The project should optimise for clarity, reliability, and evidence for marking.
It does not need authentication, billing, user accounts, or polished enterprise UX.

## 4. Technical Stack

- Frontend: static HTML, CSS, and vanilla JavaScript
- Backend: Azure Functions v4 on Node.js 22 with TypeScript
- Storage: one Azure Storage account (already provisioned)
- Static site hosting: Azure Blob Storage static website using the `$web` container (already configured)
- File persistence: same storage account, separate `files` container with blob path prefixes (already exists)
- CI/CD: GitHub Actions
- Testing: Vitest for unit tests and integration tests
- Local storage emulation: Azurite

Supporting packages (the existing `api/package.json` already depends on `@azure/functions`, `@azure/storage-blob`, `vitest`, and `typescript`):

- `@azure/functions`
- `@azure/storage-blob`
- `fast-xml-parser`
- `marked`
- `csv-parse`
- `csv-stringify`
- `vitest`
- `azurite`
- `typescript`

## 5. Core Architecture

```text
Browser
  -> static site hosted in Azure Storage ($web)
  -> POST /api/convert
Azure Function App
  -> validate request
  -> choose route from explicit route key
  -> execute converter from registry
  -> write original file to Blob Storage
  -> write converted file to Blob Storage
  -> return converted text, blob names, and SAS download URL
Azure Blob Storage
  -> $web container for frontend
  -> files container for originals/converted results
GitHub Actions
  -> test on push / pull request
  -> deploy API
  -> deploy site
```

Key architecture rules:

- one main conversion endpoint: `POST /api/convert`
- one route registry used by both backend and frontend metadata
- one converter per file under `api/src/converters/`
- routing logic must be separate from conversion logic
- storage helpers must be separate from request handling
- legacy demo code in `legacy/` must not be imported or referenced by the new code

## 6. API Contract

Recommended request body:

```json
{
  "filename": "student.json",
  "route": "json_to_xml",
  "text": "{ \"name\": \"Student One\", \"course\": \"Cloud Platforms\" }",
  "options": {
    "rootElement": "student"
  }
}
```

Recommended success response:

```json
{
  "ok": true,
  "route": "json_to_xml",
  "original": {
    "filename": "student.json",
    "blobName": "originals/json_to_xml/2026-04-24T12-00-00_student.json"
  },
  "converted": {
    "filename": "student.xml",
    "contentType": "application/xml; charset=utf-8",
    "text": "<student><name>Student One</name><course>Cloud Platforms</course></student>",
    "blobName": "converted/json_to_xml/2026-04-24T12-00-00_student.xml"
  },
  "metrics": {
    "durationMs": 41,
    "inputBytes": 56,
    "outputBytes": 83
  }
}
```

Notes on the contract:

- `ok` is a boolean so clients can branch on success or failure without inspecting HTTP status codes.
- `converted.text` contains the full converted output. The browser uses this to build a client-side download (via `Blob` + object URL) and for the on-screen preview.
- Blob names are returned for auditability and traceability only. No blob SAS URL is returned; the `files` container stays private.
- Timestamps in blob names use the ISO-like form `YYYY-MM-DDTHH-MM-SS` so blob listings sort lexicographically.

Recommended error response:

```json
{
  "ok": false,
  "code": "INVALID_INPUT",
  "message": "Route json_to_xml requires valid JSON input.",
  "details": "Unexpected token } in JSON at position 18"
}
```

## 7. Repository Structure

```text
<repo-root>/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-api.yml
│       └── deploy-site.yml
├── api/
│   ├── src/
│   │   ├── index.ts
│   │   ├── functions/
│   │   │   └── convert.ts
│   │   ├── converters/
│   │   │   ├── index.ts
│   │   │   ├── json-to-html.ts
│   │   │   ├── json-to-text.ts
│   │   │   ├── list-to-json-array.ts
│   │   │   ├── csv-to-json.ts
│   │   │   ├── json-array-to-csv.ts
│   │   │   ├── form-to-json.ts
│   │   │   ├── json-to-keyvalue.ts
│   │   │   ├── xml-to-text.ts
│   │   │   ├── markdown-to-html.ts
│   │   │   └── json-to-xml.ts
│   │   ├── routing/
│   │   │   ├── route-types.ts
│   │   │   ├── route-metadata.ts
│   │   │   └── validate-request.ts
│   │   └── utils/
│   │       ├── blob-storage.ts
│   │       ├── content-types.ts
│   │       ├── response.ts
│   │       ├── sanitise.ts
│   │       └── timestamp.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── host.json
├── site/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── app-config.js
├── legacy/
│   ├── api/
│   ├── site/
│   └── github-workflows-archive/
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── routes.md
│   └── testing.md
├── .gitattributes
├── .gitignore
├── ASSIGNMENT-CONTEXT.md
├── IMPLEMENTATION-PLAN.md
└── JSON-XML-MVP-PLAN.md
```

## 8. Key Product Decisions

These decisions are fixed unless a strong reason appears during implementation:

- The main assignment app is the converter, not a side feature.
- Route selection is explicit in the UI.
- Filename-based routing is rejected.
- The frontend supports both file upload and paste input, but file upload remains the default path because the assignment explicitly asks for file upload.
- Blob names are timestamped and route-aware.
- One storage account is shared between the static site and the uploaded/converted files.
- One Function App hosts a single `POST /api/convert` HTTP endpoint.
- `POST /api/convert` is intentionally anonymous (`authLevel: "anonymous"`). Function-level keys would offer no real defence for a browser-called API because any key has to be embedded in client-side code where any visitor can read it, and user authentication is explicitly out of scope per §3 of this document. The endpoint is hardened by the `MAX_INPUT_BYTES` per-request input cap, structured request validation, and a private `files` container that is never exposed to the public internet. Rate limiting, abuse monitoring, and richer mitigations are noted as future work.
- Downloads are performed client-side in the browser from `converted.text` in the API response. The API does not return blob SAS URLs and the `files` container stays private. This keeps blob-access capability from ever reaching the browser and removes SAS token generation from the backend.
- Blob-name timestamps use the ISO-like form `YYYY-MM-DDTHH-MM-SS` so blob listings sort in upload order.
- Legacy quote-demo code is preserved in `legacy/` for evidence but never executed or deployed.

## 9. Lessons Carried Forward From The Legacy Code

- Do not mix a classroom demo feature with the real assignment feature in the main UI.
- Do not rely on filename tags for routing.
- Define the API contract before building many converters.
- Add tests early so converters stay deterministic.
- Centralise route metadata so frontend and backend do not drift.
- Keep environment variable names explicit and documented.
- Expect Azure Functions cold starts on Consumption.
- Expect CORS setup to be required for the static site origin.
- Prefer direct blob download via SAS instead of proxying downloads through the Function App.

## 10. Azure Resource Reuse

All Azure resources are already provisioned. This project does not create new ones.

Existing and reused:

- 1 resource group
- 1 storage account
- 1 Function App on Consumption plan
- 1 Application Insights resource (attached to the Function App)

Storage layout (already in place):

- `$web` container for the static site
- `files` container for originals and converted files
- blob path pattern used by the new code:

```text
originals/{route}/{timestamp}_{safeInputName}
converted/{route}/{timestamp}_{safeOutputName}
```

Actual resource names (storage account, resource group, Function App name) are intentionally not documented in this repository. They are configured only via GitHub Secrets and Function App application settings.

Function App application settings used by the new converter API (names chosen to match existing legacy usage so no renames are required on the app side):

- `FILES_STORAGE` — Azure Storage connection string (required)
- `FILES_CONTAINER` — target container name (optional; defaults to `files` in code)
- `MAX_INPUT_BYTES` — per-request input size limit in bytes (optional; defaults to `200000` in code)

The Function App also has `AzureWebJobsStorage`, which Azure configures for the runtime. That is independent of `FILES_STORAGE` and is not used by the application code.

## 11. Responsibility Split

AI owns:

- repo scaffolding inside the existing repo
- backend implementation
- frontend implementation
- tests
- workflow files
- local documentation

User owns:

- Azure portal actions (already mostly done: resource group, storage, Function App, containers, CORS, publish profile)
- GitHub repository management
- repository secrets and variables in GitHub
- any re-runs of failed deployments caused by cloud configuration or permissions
- verification that the optional Function App application setting `MAX_INPUT_BYTES` is present if a non-default value is required

## 12. Definition Of Success

The project is ready for submission when all of the following are true:

- all 10 routes work locally
- all 10 routes are available in the deployed frontend
- upload and conversion both work from the browser
- original and converted blobs are written to Azure Storage
- converted output can be downloaded in-browser and from Azure
- CI runs automatically from GitHub
- API and site both deploy automatically from GitHub Actions
- unit tests pass
- at least one local integration suite passes with Azurite
- a deployed smoke test succeeds against the live Function App
- the legacy code under `legacy/` remains recoverable from git history

## 13. Starting Assumption For Future AI Sessions

Future AI sessions opening this repo should assume:

- the repo root is the new project build; the old quote demo lives in `legacy/` for reference only
- the three `.md` files at the repo root are the authoritative design
- Azure infrastructure already exists and is reused; do not propose creating new resources
- actual Azure resource names are confidential and must not appear in committed files, docs, or commit messages
- the first implementation goal is a thin vertical slice of the converter platform, starting with `json_to_text`
