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

Use the **Credentials** tab on your Railway bucket. `S3_BUCKET` is the full API bucket name (e.g. `my-bucket-jdhhd8oe18xi`). `S3_ENDPOINT` is typically `https://storage.railway.app`. Do **not** set `S3_FORCE_PATH_STYLE` (Railway uses virtual-hosted URLs).

**Web build variable:** `VITE_API_URL=https://your-api.up.railway.app`

Set `WEB_ORIGIN` to the web service public URL so the API accepts browser requests.

### Railway bucket: browser uploads & multipart

Railway buckets are S3-compatible (Tigris-backed) and **support multipart uploads**. Files **≥ 32 MB** upload in **8 MB parts**, **4 at a time**; smaller files use a single PUT.

**CORS is required** for browser → bucket uploads (including each multipart part). Configure once with the AWS CLI (replace values from your bucket credentials):

```bash
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... aws s3api put-bucket-cors \
  --bucket YOUR_BUCKET_NAME \
  --endpoint-url https://storage.railway.app \
  --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT","POST","HEAD"],"AllowedOrigins":["https://your-web.up.railway.app"],"MaxAgeSeconds":3000}]}'
```

For local dev with MinIO, set `S3_FORCE_PATH_STYLE=true` in `apps/api/.env` (see `.env.example`).

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/shares` | Create share; returns simple PUT URL or multipart part URLs |
| `POST` | `/shares/:id/complete` | Finalize upload (`{ parts }` required for multipart) |
| `GET` | `/shares/:id` | Share metadata |
| `POST` | `/shares/:id/download` | Mint short-lived download URL |
| `GET` | `/health` | Health check |
