// serve.ts — Sunset Cover Studio's pocket development server.
//   node serve.ts [--port 8123]
// It serves the static app under app/ and nothing outside it, at
// http://localhost:8080 by default, so the studio can be tried in a
// browser exactly as it ships. Node 22 standard library only; this
// is a local convenience for the maker's machine, not a deployment.
//
// The behaviour is a small fixed contract: the port flag falls back
// to 8080 when missing or unusable, paths are jailed to app/ (an
// encoded climb such as /..%2f is refused 403), a missing file is a
// plain 404, an undecodable URL a 400, and every answer carries
// cache-control: no-store so a rebuilt app is never masked by a
// cached one.

import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const FALLBACK_PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

// --port <n> is honoured when <n> is a whole number inside the
// usable range; a missing flag, a garbled value or an out-of-range
// one all land on the fallback rather than crashing a dev tool.
function wantedPort(args) {
  const at = args.indexOf('--port');
  if (at === -1 || at + 1 >= args.length) return FALLBACK_PORT;
  const n = Number(args[at + 1]);
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : FALLBACK_PORT;
}

// Maps a decoded URL path to a file inside the app jail, or null
// when the path climbs out of it. A path ending in '/' names that
// directory's index.html; a bare directory is left alone here and
// refused as a 404 by the reader below.
function jailPath(pathname) {
  const named = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const target = resolve(join(ROOT, `.${named}`));
  const out = relative(ROOT, target);
  return out.startsWith('..') || out.startsWith('/') ? null : target;
}

function fail(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

async function serve(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  } catch {
    fail(res, 400, 'bad request');
    return;
  }
  const target = jailPath(pathname);
  if (target === null) {
    fail(res, 403, 'forbidden');
    return;
  }
  let body;
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('not a file');
    body = await readFile(target);
  } catch {
    fail(res, 404, 'not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME_TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}

const port = wantedPort(process.argv.slice(2));
createServer((req, res) => {
  serve(req, res).catch(() => res.destroy());
}).listen(port, '127.0.0.1', () => {
  console.log(`Sunset Cover Studio is on http://localhost:${port}`);
});
