# TransferFlow Raycast Extension

Upload the file selected in Finder to TransferFlow and copy the share link to your clipboard.

## Setup

1. Install dependencies:

   ```bash
   cd apps/raycast
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open Raycast and run **Share File**.

4. In Raycast → Extensions → TransferFlow → Preferences, set:
   - **API URL** — e.g. `https://api.transferflow.bramsuurd.nl` or `http://localhost:3001` for local dev
   - **Web App URL** — e.g. `https://transferflow.bramsuurd.nl` or `http://localhost:5173` for local dev
   - **Link validity** — default retention for uploads

## Usage

1. Select a file in Finder.
2. Open Raycast and run **Share File** (assign a hotkey in Raycast preferences if you like).
3. The file uploads via the TransferFlow API; the share link is copied to your clipboard.

## Local development

With TransferFlow running locally (`bun run dev` from the repo root):

- API URL: `http://localhost:3001`
- Web App URL: `http://localhost:5173`

This package is not part of the Bun workspace (use `npm install` here, not `bun install` from the repo root). It depends on `@transferflow/shared` via `file:../../packages/shared`. Raycast extensions rely on the Ray CLI and npm lockfile.

The extension calls the API with Node `fetch`, so browser CORS does not apply.
