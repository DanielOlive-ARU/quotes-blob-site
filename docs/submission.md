# Submission checklist

Work through this checklist once before submitting. Every item is quick. The goal is to leave nothing surprising for the assessor and nothing fragile for demo day.

## 1. Verify the live system

- [ ] Visit the static site URL in an **incognito** window. The four-step layout should render cleanly.
- [ ] Click the **Conversion route** dropdown. It should list **10 options**.
- [ ] Open DevTools Console and run `window.ROUTES.length`. It should print `10`.
- [ ] Run three representative round-trips through the UI — suggest `json_to_text`, `csv_to_json`, and `xml_to_text`. Paste the example input from the "Show example input and output" panel, click **Convert**, confirm the preview matches, click **Download result**.
- [ ] Verify the downloaded filenames have the expected extension (`.txt`, `.json`, `.txt` respectively).

## 2. Verify blob storage

- [ ] Azure Portal → Storage account → **Containers** → `files`.
- [ ] Confirm `originals/` and `converted/` virtual folders exist, each with subfolders per route that you exercised.
- [ ] Open one converted blob and confirm its content matches what the browser showed.

## 3. Verify GitHub Actions

- [ ] On GitHub, open the **Actions** tab.
- [ ] The most recent runs of `ci.yml`, `deploy-api.yml`, `deploy-site.yml`, and `e2e.yml` should all be green.
- [ ] Open the most recent `deploy-api.yml` run and expand the **Post-deploy smoke test** step. It should show the response body with `"ok": true`.
- [ ] Open the most recent `e2e.yml` run, scroll to the bottom of the run summary, and download the `playwright-report` artifact. All seven tests should be green.

## 4. Capture screenshots

Save in a folder you will attach to the submission document (e.g. `evidence/`):

- [ ] GitHub repository front page (README visible)
- [ ] GitHub **Actions** tab showing all four workflows green
- [ ] Most recent `deploy-api.yml` run with the smoke-test step expanded
- [ ] Most recent `e2e.yml` run summary, plus optionally a screenshot of the downloaded Playwright HTML report
- [ ] Azure Portal → Function App → **Overview** (Status: Running)
- [ ] Azure Portal → Storage account → **Containers** (`$web` and `files` visible)
- [ ] `files` container showing populated `originals/` and `converted/` prefixes
- [ ] Live static site rendering the four-step layout
- [ ] A successful conversion in the browser (preview + Download button visible)
- [ ] (Optional, convincing) Browser DevTools Network tab showing the `POST /api/convert` call with a 200 response

## 5. Tag a submission commit

A tag keeps the exact submitted state reproducible even if you commit afterwards.

```bash
git tag -a v1.0.0-submission -m "Coursework submission: Serverless Cloud Conversion Platform"
git push origin v1.0.0-submission
```

Then on GitHub, **Releases → Draft a new release** from the tag with a short release note.

## 6. Submission document

Submit a short document (Word / PDF) containing:

- **GitHub repository link** — `https://github.com/<username>/<repo>`
- **Live application link** — the static site URL
- **Tag / release link** — `https://github.com/<username>/<repo>/releases/tag/v1.0.0-submission`

No written explanation is required per the brief; the presentation (010-2) covers that.

## 7. Presentation (010-2) — quick prep

These are the pieces of evidence this repo makes easy to demonstrate live:

- **Cloud-hosted static site** — open the live URL.
- **Serverless backend** — Azure Portal → Function App → Overview.
- **CI/CD pipeline** — GitHub Actions tab, show the four workflows (`ci.yml`, `deploy-api.yml`, `deploy-site.yml`, `e2e.yml`).
- **Modular serverless design** — `api/src/converters/` (one file per route), then `api/src/routing/route-metadata.ts` (single registry).
- **Testing** — run `cd api && npm test` live; show the 124 passing tests.
- **Cost-aware decisions** — `docs/cost.md`.
- **Logging** — Azure Portal → Function App → Application Insights → **Logs** → run `traces | where customDimensions.event == "convert" | take 10`.
- **Route catalogue** — live UI dropdown.
- **End-to-end round trip** — live conversion with preview + download.

Suggested demo order:

1. Problem + architecture diagram (`docs/architecture.md`).
2. Repo tour: `api/`, `site/`, `legacy/`, `docs/`.
3. Live UI: one round-trip (the "it works" moment).
4. CI/CD: workflows, post-deploy smoke test, Playwright E2E run, local Vitest test run.
5. Architectural decisions: anonymous endpoint + private storage, client-side download, one storage account, synchronous design.
6. Cost story: `docs/cost.md`.
7. Deliberate omission: async processing and why.

## 8. Demo-day rollback plan

- **Site shows stale files** — hard refresh (`Ctrl+Shift+R`), then in DevTools tick **Disable cache**.
- **API feels slow on the first request** — that's a Consumption cold start (3-10 seconds). Use the pause to narrate the architecture; subsequent requests are warm.
- **A conversion errors** — the UI's status area shows a `code` and `message`. That is the structured-error-envelope design working; demonstrate it as graceful handling rather than apologising.
- **Site is completely unreachable** — pivot to the repo walkthrough, `npm test` demo, `docs/architecture.md` diagram, and the GitHub Actions history. The code and evidence speak for the architecture even without a live view.

## 9. Worth mentioning in the presentation

- The `legacy/` folder demonstrates iterative development: an earlier quote-demo project on the same infrastructure was pivoted into the conversion platform rather than built from scratch on new Azure resources. That is realistic industry practice and evidence of agile ways of working.
- The `AZURE_FUNCTIONAPP_NAME` and `AZURE_FUNCTIONAPP_HOSTNAME` live in GitHub Variables; `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`, `AZURE_STORAGE_ACCOUNT`, and `AZURE_STORAGE_SAS_TOKEN` live in Secrets. Names never enter committed code. Good talking point for the DevOps marking criterion.
- The post-deploy smoke test is a real integration check against the deployed system, not just against a mocked layer. It fails the deploy run if the live endpoint ever returns anything other than the expected response — so a regression cannot ship silently.
