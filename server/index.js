import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

const {
  B2_ENDPOINT,
  B2_KEY_ID,
  B2_APP_KEY,
  B2_BUCKET,
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  PORT = 3001,
} = process.env;

// ---------------------------------------------------------------- B2 client
const regionFromEndpoint = /s3\.([^.]+)\.backblazeb2\.com/.exec(B2_ENDPOINT || '')?.[1];
const s3 = new S3Client({
  endpoint: B2_ENDPOINT,
  region: process.env.B2_REGION || regionFromEndpoint || 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: B2_KEY_ID || '', secretAccessKey: B2_APP_KEY || '' },
  // B2 does not accept the newer default CRC32 checksum headers of the AWS SDK.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const storageConfigured = Boolean(B2_ENDPOINT && B2_KEY_ID && B2_APP_KEY && B2_BUCKET);

async function getJSON(Key) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: B2_BUCKET, Key }));
    return JSON.parse(await res.Body.transformToString());
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function putJSON(Key, data) {
  await s3.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    }),
  );
}

async function listKeys(Prefix) {
  const keys = [];
  let ContinuationToken;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: B2_BUCKET, Prefix, ContinuationToken }),
    );
    for (const o of res.Contents || []) keys.push(o.Key);
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return keys;
}

// --------------------------------------------------------------------- auth
const authEnabled = Boolean(VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY);
const supabase = authEnabled ? createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) : null;

async function auth(req, res, next) {
  if (!authEnabled) {
    req.uid = 'guest';
    return next();
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired session' });
  req.uid = data.user.id;
  next();
}

// ---------------------------------------------------------------- utilities
const ID_RE = /^[a-zA-Z0-9-]{8,64}$/;
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const docKey = (uid, id) => `users/${uid}/docs/${id}.json`;
const docsPrefix = (uid) => `users/${uid}/docs/`;
const charsKey = (uid) => `users/${uid}/characters.json`;

const countWords = (md = '') =>
  md.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

const summary = (d) => ({
  id: d.id,
  title: d.title,
  updatedAt: d.updatedAt,
  words: countWords(d.markdown),
});

const WELCOME = `# Chapter 1

Welcome to **Schreibly**. This document lives in your Backblaze B2 bucket.

## A first scene

Start writing here. Headings become chapters in the right-hand panel.
`;

// ---------------------------------------------------------------------- app
const app = express();
app.use(express.json({ limit: '10mb' }));

app.get(
  '/api/health',
  wrap(async (_req, res) => {
    const out = { ok: true, authEnabled, storageConfigured, bucket: B2_BUCKET || null, storage: 'ok' };
    if (!storageConfigured) {
      out.storage = 'B2 is not configured – check your .env file';
    } else {
      try {
        await s3.send(new ListObjectsV2Command({ Bucket: B2_BUCKET, MaxKeys: 5 }));
      } catch (err) {
        out.storage = `${err.name}: ${err.message}`;
      }
    }
    res.json(out);
  }),
);

app.use('/api', auth);

// Documents ---------------------------------------------------------------
app.get(
  '/api/docs',
  wrap(async (req, res) => {
    const keys = await listKeys(docsPrefix(req.uid));
    const docs = (await Promise.all(keys.map((k) => getJSON(k)))).filter(Boolean);
    docs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    res.json(docs.map(summary));
  }),
);

app.post(
  '/api/docs',
  wrap(async (req, res) => {
    const now = new Date().toISOString();
    const first = (await listKeys(docsPrefix(req.uid))).length === 0;
    const doc = {
      id: crypto.randomUUID(),
      title: String(req.body?.title || (first ? 'My first novel' : 'Untitled')).slice(0, 200),
      markdown: typeof req.body?.markdown === 'string' ? req.body.markdown : first ? WELCOME : '# Chapter 1\n\n',
      goal: 0,
      createdAt: now,
      updatedAt: now,
    };
    await putJSON(docKey(req.uid, doc.id), doc);
    res.status(201).json(doc);
  }),
);

app.get(
  '/api/docs/:id',
  wrap(async (req, res) => {
    if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const doc = await getJSON(docKey(req.uid, req.params.id));
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  }),
);

app.put(
  '/api/docs/:id',
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!ID_RE.test(id)) return res.status(400).json({ error: 'Bad id' });
    const { title, markdown, goal } = req.body || {};
    if (typeof markdown !== 'string') return res.status(400).json({ error: 'markdown must be a string' });
    const prev = await getJSON(docKey(req.uid, id));
    const now = new Date().toISOString();
    const doc = {
      id,
      title: String(title ?? prev?.title ?? 'Untitled').slice(0, 200),
      markdown,
      goal: Math.max(0, Math.floor(Number(goal ?? prev?.goal ?? 0)) || 0),
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    };
    await putJSON(docKey(req.uid, id), doc);
    res.json(summary(doc));
  }),
);

app.delete(
  '/api/docs/:id',
  wrap(async (req, res) => {
    if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    await s3.send(new DeleteObjectCommand({ Bucket: B2_BUCKET, Key: docKey(req.uid, req.params.id) }));
    res.json({ ok: true });
  }),
);

// Characters --------------------------------------------------------------
app.get(
  '/api/characters',
  wrap(async (req, res) => {
    res.json((await getJSON(charsKey(req.uid))) || { characters: [] });
  }),
);

app.put(
  '/api/characters',
  wrap(async (req, res) => {
    const list = Array.isArray(req.body?.characters) ? req.body.characters : null;
    if (!list) return res.status(400).json({ error: 'characters must be an array' });
    const clean = list.slice(0, 200).map((c) => ({
      id: String(c.id || '').slice(0, 64),
      name: String(c.name || '').slice(0, 120),
      role: String(c.role || '').slice(0, 120),
      age: String(c.age || '').slice(0, 40),
      appearance: String(c.appearance || '').slice(0, 4000),
      traits: String(c.traits || '').slice(0, 4000),
      backstory: String(c.backstory || '').slice(0, 20000),
    }));
    await putJSON(charsKey(req.uid), { characters: clean, updatedAt: new Date().toISOString() });
    res.json({ ok: true });
  }),
);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint' }));

// Static frontend (after `npm run build`) ---------------------------------
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Schreibly server on http://localhost:${PORT}`);
  console.log(`  storage : ${storageConfigured ? `B2 bucket "${B2_BUCKET}"` : 'NOT CONFIGURED (.env)'}`);
  console.log(`  auth    : ${authEnabled ? 'Supabase' : 'disabled (guest mode)'}`);
  console.log(`  frontend: ${fs.existsSync(DIST) ? 'serving dist/' : 'dist/ not built (use vite dev on :5173)'}`);
});
