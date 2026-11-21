// serve.ts — a pocket static server for trying the studio locally:
//   node serve.ts [--port 8080]
// It answers files from inside app/ and nothing else, at
// http://localhost:8080, with the content types an offline web app
// needs. Node 22 standard library only, no build step — a
// development convenience for this machine, not a public server.
//
// Round 4 rewrote this file end to end: the port flag, the path
// jail and the responder are separate small functions now, and the
// responder is async, so a slow read never stalls the accept loop.
// The contract did not move: same flag, same jail, same content
// types, same status lines, same startup message.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const HOST = '127.0.0.1';
const DEFAULT_PORT = 8080;

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.wasm', 'application/wasm'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

// --port wins when it names a usable port; anything else (missing,
// garbled, out of range) falls back to the default rather than
// crashing a convenience tool.
function portFromArgs(argv) {
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i] !== '--port') continue;
    const n = Number(argv[i + 1]);
    return Number.isInteger(n) && n > 0 && n < 65536 ? n : DEFAULT_PORT;
  }
  return DEFAULT_PORT;
}

// Turn a URL path into a file inside the app jail, or into the
// refusal it deserves. A directory URL means its index.html.
function locate(pathname) {
  const rel = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  const file = resolve(join(APP_ROOT, '.' + rel));
  return file === APP_ROOT || file.startsWith(APP_ROOT + sep)
    ? { file }
    : { status: 403, body: 'forbidden' };
}

function refuse(res, status, body) {
  res.writeHead(status).end(body);
}

async function respond(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    refuse(res, 400, 'bad request');
    return;
  }
  const found = locate(pathname);
  if (!found.file) {
    refuse(res, found.status, found.body);
    return;
  }
  let info;
  try {
    info = await stat(found.file);
    if (!info.isFile()) throw new Error('not a file');
  } catch {
    refuse(res, 404, 'not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME.get(extname(found.file).toLowerCase()) ?? 'application/octet-stream',
    'content-length': info.size,
    'cache-control': 'no-store',
  });
  await pipeline(createReadStream(found.file), res);
}

const port = portFromArgs(process.argv.slice(2));
createServer((req, res) => {
  respond(req, res).catch(() => res.destroy());
}).listen(port, HOST, () => {
  console.log(`Sunset Cover Studio is on http://localhost:${port}`);
});
