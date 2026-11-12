# Schreibly – demo

React + Toast UI editor, Express server, documents stored in **Backblaze B2**, login via **Supabase**.

## 1. Backblaze B2 (5 min)
1. Create a **private** bucket.
2. *Application Keys → Add a New Application Key* – restrict it to that bucket, access **Read and Write**. Copy `keyID` and `applicationKey` (shown only once).
3. The bucket page shows its **Endpoint**, e.g. `s3.us-west-004.backblazeb2.com`.

## 2. Supabase (optional, 3 min)
Create a project → *Project Settings → API* → copy the project URL and the `anon` key.
For the demo, turn off *Authentication → Providers → Email → Confirm email* so new accounts can sign in at once.
Leave the two variables empty to run in guest mode (no login).

## 3. Run
```bash
cp .env.example .env     # fill in the B2 (and Supabase) values
npm install
npm run demo             # builds the frontend and serves everything on http://localhost:3001
```
Development with hot reload: `npm run dev` → open http://localhost:5173.

`http://localhost:3001/api/health` tells you if the B2 connection works (`"storage":"ok"`); problems are also shown as a red banner in the app.

## How it is built
- `server/index.js` – Express; talks to B2 through the S3 API, checks the Supabase token, one folder per user:
  `users/<id>/docs/<doc>.json` and `users/<id>/characters.json`. The B2 keys never reach the browser.
- `src/` – React app. Left bar: **Tools** (top half) and **Social** (bottom half). The right panel depends on the tool:
  chapters + word count + goal in the editor, the list of heroes in the character editor.
- Themes: Dark / White / Book, chosen in the top bar and remembered in the browser.
- Autosave 1.2 s after you stop typing; MD / HTML export with your two icons next to the title.

## Not in the demo
Timeline, Messages, real forum posting (the forum and feed screens show sample content), PDF/EPUB export, snapshots.
