# TransferFlow

Anonymous file transfers: upload a file, choose 24 hours or 7 days retention, share a link. No accounts.

See [CONTEXT.md](./CONTEXT.md) for domain language and product decisions.

## Stack

- **Web** — Vite + React (`apps/web`)
- **API** — Hono on Bun (`apps/api`)
- **Redis** — share metadata + expiry index
- **S3-compatible bucket** — file storage (Railway bucket or MinIO locally)

## Local development

### 1. Infrastructure

```bash
docker compose up -d
```

Create the MinIO bucket (once):

```bash
docker run --rm --network host minio/mc alias set local http://localhost:9000 minioadmin minioadmin
docker run --rm --network host minio/mc mb local/file-shares
```

### 2. API environment

```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Install and run

```bash
bun install
bun run dev
```

Turbo runs the API on port **3001** and the web app on **5173**. The Vite dev server proxies `/shares` and `/health` to the API.

Open http://localhost:5173

## Production (Railway)

Deploy **two services** from this repo:

| Service | Root | Build | Start |
|---------|------|-------|-------|
| API | `apps/api` | `bun install && bun run build` | `bun run start` |
| Web | `apps/web` | `bun install && bun run build` | `bunx serve dist -l $PORT` |

Also provision **Redis** and an **S3-compatible bucket** in the same project.

**API variables:** `WEB_ORIGIN`, `REDIS_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

Use Railway bucket credentials from the bucket **Credentials** tab. Set `S3_BUCKET` to the bucket name shown there (e.g. `allocated-pannikin-eotpz3`). Use the **Endpoint URL** from that tab (e.g. `https://t3.storageapi.dev`). **Do not set** `S3_FORCE_PATH_STYLE` on Railway — the API defaults to virtual-hosted URLs, which is what Railway requires (see the “Use virtual-hosted-style URLs” note in the dashboard).

**Web build variable:** `VITE_API_URL=https://your-api.up.railway.app`

Set `WEB_ORIGIN` to the web service public URL so CORS allows browser requests.

### Railway bucket notes

- **Multipart uploads are supported** (same S3 API as AWS).
- Presigned URLs work for both single `PUT` and multipart parts.
- Files **≥ 32 MB** upload in **8 MB parts**, **4 at a time**; smaller files use a single `PUT`.
- Abandoned multipart uploads are aborted when pending shares expire.

### Browser uploads require bucket CORS

The browser uploads **directly to the bucket**. Railway buckets are private and **do not ship with CORS** for your app origin. Without CORS you get `Upload to storage failed` (or a CORS error in DevTools).

From `apps/api` with production `.env` (or Railway variables in a local `.env`):

```bash
cd apps/api
bun run configure-cors
```

This allows `PUT` from your `WEB_ORIGIN` (and localhost for dev) and exposes the `ETag` header multipart uploads need.

Use your bucket **Endpoint URL** as `S3_ENDPOINT` (e.g. `https://t3.storageapi.dev`), not a generic placeholder.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shares` | Create share; returns single or multipart presigned upload |
| `POST` | `/shares/:id/complete` | Finalize upload (`{ parts }` required for multipart) |
| `GET` | `/shares/:id` | Share metadata |
| `POST` | `/shares/:id/download` | Mint short-lived download URL |
| `GET` | `/health` | Health check |
