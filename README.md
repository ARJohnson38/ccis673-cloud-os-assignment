# CCIS-673 Assignment 2 — Cloudflare Workers implementation

**Provider change:** This implementation uses Cloudflare Workers, **not** the Azure Static Web Apps managed API required in the original assignment. Obtain instructor approval for this substitution. No deployment or pricing status is asserted without checking the actual account.

## Contents
- `public/`: the Assignment 1 website plus ML Prediction page, CSS, JS and 404 page
- `src/worker.js`: `/api/health` and `/api/predict` with validation and JSON responses
- `src/model.json`: trained coefficients, feature order/ranges, preprocessing, seed and version
- `training/`: deterministic synthetic-data training, held-out cases and metrics
- `tests/`: local tests for valid/invalid requests and malformed JSON
- `wrangler.jsonc`: Workers deployment with static asset binding

## Reproduce
Requires Python 3 and Node.js 22+.

```bash
python training/train.py
npm install
npm test
npx wrangler dev
```

Visit `http://localhost:8787/predict.html` and try 20 concurrent requests and 128 KB. Test from another terminal:

```bash
curl -i http://localhost:8787/api/health
curl -i -X POST http://localhost:8787/api/predict -H "Content-Type: application/json" -d '{"concurrent_requests":20,"payload_kb":128}'
```

Windows CMD uses escaped JSON: `-d "{\"concurrent_requests\":20,\"payload_kb\":128}"`.

## GitHub / Cloudflare deployment
1. Back up the existing Assignment 1 repository and Cloudflare deployment; preserve rollback evidence.
2. Create an Assignment 2 branch, and copy **the contents of this ZIP** to repository root. This layout replaces the old root-level website with `public/`.
3. Commit the files and push the branch. Do not upload `node_modules`, `.env`, credentials, private files or account identifiers.
4. In Cloudflare Workers & Pages, verify that the existing Worker is connected to this repository and that the build/deploy settings use `npm run deploy` (or `npx wrangler deploy`), **not** `npx wrangler preview`.
5. Verify the Wrangler Worker name matches the intended existing Worker before deployment. Check current Free-plan limits, build settings and pricing in the account. Do not upgrade or add payment details.
6. Merge only after preview/build checks are successful. Inspect production deployment and the public `/api/health` route, `/predict.html`, and a valid and invalid `/api/predict` request.
7. For rollback, use GitHub revert or Cloudflare version rollback, verify earlier behavior, then redeploy the final version. Record full commit SHAs and timestamps.
8. Measure first and ten subsequent calls from your own computer; report median of later calls. This is not proof of a cold start. Capture actual cost/usage view.

## API schema
`POST /api/predict` with `Content-Type: application/json` and exactly `{ "concurrent_requests": 20, "payload_kb": 128 }`.
`concurrent_requests` must be an integer from 1 to 100. `payload_kb` must be a finite number from 1 to 1024. Successful responses include `prediction_ms`, `units`, `model_version` and `synthetic`. Errors use `{ "error": { "code": "...", "message": "..." } }`.

## Cloud/OS analysis
The Worker is stateless per request and may execute on separate isolates; global model data can be reused in a warm isolate but is not durable shared storage. Cloudflare manages infrastructure and runtime isolation; the author manages input validation, authorization, deployment safety and code. CORS is not authentication. The model is a public synthetic example and does not represent real cloud latency. Static assets and Worker routing are Cloudflare-specific deployment dependencies.

## Evidence still required
Live HTTPS URL, successful deployment log, GitHub SHA, five real valid and five invalid API calls, measured latencies, model version change and rollback, Cloudflare usage/cost screenshot, and 4–6 minute narrated demo. Do not claim these are complete until personally verified.
