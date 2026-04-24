# Cost-aware architecture

## Services used

| Service | Purpose | Pricing model |
|---|---|---|
| Azure Storage (Hot tier, one account) | `$web` static site + `files` container for originals/converted | per-GB stored, per-10k-operation request |
| Azure Functions (Consumption plan, Node.js 22) | `POST /api/convert` handler | per-execution, per-GB-second, 1 000 000 executions/month free |
| Application Insights | telemetry and log querying | first 5 GB/month free |
| GitHub Actions | CI and deploy | 2 000 minutes/month free on public repositories |

## Decisions that keep the bill low

- **Consumption plan, not Premium.** Premium plans charge for always-on pre-warmed instances. Consumption charges per execution and ships with a 1 000 000-execution/month free allowance that comfortably covers this workload.
- **One storage account for `$web` and `files`.** A second storage account would roughly double the storage-related base cost. Containers within a single account are logically separate and can still be managed independently.
- **Private `files` container, no CDN.** A CDN is not justified at this scale. Converted blobs are read by the backend only; downloads are generated client-side from the API response, not from a blob SAS URL.
- **No asynchronous queue.** Queue Storage would add messaging costs and Function trigger executions. The synchronous path finishes in single-digit milliseconds for every route, so the latency case for async doesn't apply here.
- **Hot tier storage.** Access is hot (just written / just read). Moving to Cool or Archive would only help if stored blobs aged; this project's data is short-lived demonstration evidence rather than long-term archive.

## Cost risks and mitigations

- **Anonymous endpoint could be abused.** Each request writes two blobs capped at `MAX_INPUT_BYTES` (200 000 bytes by default). Even one million abusive requests stays inside the 1M-execution free allowance and adds on the order of 400 MB of storage at roughly £0.02/GB/month. Meaningful cost escalation is unlikely; rate limiting is noted as future work.
- **Application Insights volume at higher load.** Every convert call emits one structured log event. At 100 000 requests/month the 5 GB free tier is comfortable; past that, AppInsights sampling on the Function App limits ingestion without code changes.

## Future cost optimisations (out of scope)

- Move from Consumption to Flex Consumption if cold-start latency becomes a UX issue — trades higher baseline cost for faster cold start.
- Add an Azure Storage lifecycle policy that transitions blobs older than 30 days to Cool tier for submitted assignments that need longer retention.
- Replace Application Insights with a cheaper log aggregator if telemetry volume grows beyond the free tier by order of magnitude.
