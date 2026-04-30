# Deployment

## Overview

Two deploy workflows push the project to Azure from GitHub Actions.

| Workflow | Triggered by | Action |
|---|---|---|
| `ci.yml` | every push and pull request to `main` | Build and run the full Vitest unit + integration suite (124 tests). Does not deploy. |
| `deploy-api.yml` | changes under `api/**` or the workflow file itself, on `main` | Build, test, prune, deploy to Azure Functions, then run an inline post-deploy smoke test against the live endpoint. |
| `deploy-site.yml` | changes under `site/**` or the workflow file itself, on `main` | Inject the Function App hostname into `site/app-config.js`, then upload `site/` to the `$web` container. |
| `e2e.yml` | `workflow_run` after `deploy-api.yml` or `deploy-site.yml` completes successfully on `main`; also `workflow_dispatch` for manual re-runs | Run Playwright in headless Chromium against the live deployed static site. Upload the HTML report on every run; upload traces and screenshots only on failure. |

## Secrets and variables

Configured in GitHub under **Settings -> Secrets and variables -> Actions**.

| Name | Kind | Purpose |
|---|---|---|
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Secret | XML publish profile used by `Azure/functions-action@v1` to authenticate to the Function App |
| `AZURE_STORAGE_ACCOUNT` | Secret | Target storage account name for the `$web` site upload |
| `AZURE_STORAGE_SAS_TOKEN` | Secret | Short-lived SAS for the site upload |
| `AZURE_FUNCTIONAPP_NAME` | Variable | Function App resource name, passed to the deploy action as `app-name` |
| `AZURE_FUNCTIONAPP_HOSTNAME` | Variable | Public hostname of the Function App (long-form including the random Azure suffix and region slot). Used by the site deploy to substitute the API base URL into `app-config.js` and by the smoke-test step to call the live endpoint |
| `AZURE_STORAGE_STATIC_WEB_URL` | Variable | Public URL of the deployed static site, scheme included with no trailing slash. Used by `e2e.yml` to point Playwright at the live site |

Actual resource names are never committed to the repository; they live only in these Secrets/Variables.

## Pipeline

### `deploy-api.yml`

1. Checkout.
2. Set up Node.js 22 with npm caching keyed to `api/package-lock.json`.
3. `npm ci`, `npm run build`, `npm test`.
4. `npm prune --omit=dev` to slim the deployment package.
5. `Azure/functions-action@v1` with `package: api` and `app-name: ${{ vars.AZURE_FUNCTIONAPP_NAME }}`.
6. Post-deploy smoke test: POST a known payload to the live endpoint, retry on cold-start, fail the run if the response is not `{ ok: true }` with the expected converted text.

### `deploy-site.yml`

1. Checkout.
2. Inject runtime config: substitute `__API_BASE_URL__` in `site/app-config.js` with `https://${{ vars.AZURE_FUNCTIONAPP_HOSTNAME }}`. Fails if the Variable is missing or the placeholder isn't replaced.
3. `az storage blob upload-batch` with `--overwrite true` to the `$web` container.

### `ci.yml`

Runs on every push and pull request to `main`. Executes `npm ci`, `npm run build`, and `npm test`. Does not deploy.

### `e2e.yml`

1. `workflow_run` listener on `deploy-api.yml` and `deploy-site.yml`; runs only when the upstream conclusion was success.
2. Checkout, set up Node.js 22, `npm ci` in `e2e/`, then cache and install Playwright browsers.
3. Run `npx playwright test` against `${{ vars.AZURE_STORAGE_STATIC_WEB_URL }}`. Fails fast if the Variable is missing.
4. Upload the HTML report as a `playwright-report` artifact on every run, and traces/screenshots on failure only.

## Manual interventions

- **Cold-start slowness on the first request after deploy.** The smoke test retries up to six times with backoff (5s, 10s, 15s, 20s, 25s, 30s — max ~105s). If it still fails, the Function App is likely genuinely down; check the Portal -> Function App -> Monitor or Log stream.
- **Deploy to the wrong Function App.** The deploy action uses `AZURE_FUNCTIONAPP_NAME`. Changing that repository Variable in GitHub swaps the target without touching the workflow file.
- **Site serving stale files in the browser.** Azure Storage static-website defaults to a fairly aggressive `Cache-Control`. Hard refresh (`Ctrl+Shift+R`) during testing. For demo day, use a clean incognito window.

## Legacy deploy workflows

The preceding quote-demo workflows are preserved under [`../legacy/github-workflows-archive/`](../legacy/github-workflows-archive/) for historical reference. They are not in `.github/workflows/` and therefore do not run.
