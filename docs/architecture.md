# Architecture

## Overview

The Serverless Cloud Conversion Platform is a single-page static site plus a single HTTP Azure Function that provides file-format conversion across ten supported routes. Both halves are hosted in one Azure resource group and share one storage account.

## Component diagram

```text
Browser
  |
  |  (1) loads HTML / JS from static website
  v
Azure Storage  --  $web container
                   (static site: index.html, app.js, routes.js,
                    styles.css, app-config.js)

Browser
  |
  |  (2) POST /api/convert  { route, filename, text }
  v
Azure Functions (Consumption plan, Node.js 22)
  -> validate request shape
  -> validate route + input against registry
  -> run converter (pure function)
  -> upload original blob
  -> upload converted blob
  -> respond with { ok, route, original, converted, metrics }
    |
    v
Azure Storage  --  files container (private)
                   originals/{route}/{timestamp}_{safeFilename}
                   converted/{route}/{timestamp}_{safeOutputFilename}
```

## Layers

- **Routing** (`api/src/routing/`) — request-shape validation, route registry, per-route input validation. Keeps the list of known routes in one place so frontend and backend cannot drift silently.
- **Converters** (`api/src/converters/`) — one file per route. Each exports a `RouteDefinition` with `validate` and `convert` callables plus presentation metadata (label, description, accepted extensions, example input/output).
- **Utilities** (`api/src/utils/`) — blob storage helper, response envelope builders, content-type constants, filename sanitisation, and ISO-like timestamp generation.
- **Function handler** (`api/src/functions/convert.ts`) — parses the JSON body, walks through validation, invokes the converter, uploads both blobs, and emits structured Application Insights logs on every outcome.

## Key decisions

- **One static site, one Function App, one endpoint.** Smallest possible surface for an academic project; easy to demo and reason about.
- **Converters are pure functions.** Text in, text out. Storage is separate. This keeps unit testing trivial: 110+ unit tests exercise every route without any Azure dependency.
- **Route registry is the source of truth.** Frontend `site/routes.js` mirrors a subset of the backend registry; adding a route touches two files by design.
- **Anonymous endpoint, private blob container.** Browser-facing auth would require client-side credentials; that is security theatre. The endpoint is defended by `MAX_INPUT_BYTES`, structured request validation, and the `files` container never being made public. Downloads are generated client-side from `converted.text` in the API response so no blob SAS URL ever reaches the browser.
- **Synchronous processing.** All ten routes finish in milliseconds, so a queue-backed async path adds cost without benefit. Noted as future work in `IMPLEMENTATION-PLAN.md` §12.

## Related documents

- [`../ASSIGNMENT-CONTEXT.md`](../ASSIGNMENT-CONTEXT.md) — full design brief and API contract
- [`../IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md) — build phases, testing tiers, out-of-scope list
- [`../JSON-XML-MVP-PLAN.md`](../JSON-XML-MVP-PLAN.md) — per-route specifications
- [`cost.md`](cost.md) — cost-aware design decisions
- [`testing.md`](testing.md) — test strategy
- [`deployment.md`](deployment.md) — CI/CD pipeline
