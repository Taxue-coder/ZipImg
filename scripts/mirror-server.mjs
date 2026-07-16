import http from 'node:http';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const port = Number(process.env.PORT || 4174);
const host = '127.0.0.1';
const root = path.resolve('site-source');
const pageOrigin = 'https://zippic.cn';
const assetOrigin = 'https://assets.zippic.cn';
const localOrigin = `http://${host}:${port}`;
const textTypes = ['text/', 'javascript', 'json', 'xml', 'svg'];

function isAssetPath(pathname) {
  return pathname.startsWith('/_next/') || pathname.startsWith('/files/') ||
    pathname.startsWith('/zippic/');
}

function targetUrl(requestUrl) {
  const incoming = new URL(requestUrl, localOrigin);
  if (incoming.pathname.startsWith('/__assets/')) {
    return new URL(incoming.pathname.slice('/__assets'.length) + incoming.search, assetOrigin);
  }
  if (incoming.pathname === '/_next/image') {
    return new URL(incoming.pathname + incoming.search, pageOrigin);
  }
  return new URL(incoming.pathname + incoming.search, isAssetPath(incoming.pathname) ? assetOrigin : pageOrigin);
}

function cachePathFor(url, contentType = '') {
  const bucket = url.origin === assetOrigin ? 'assets' : 'pages';
  let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!pathname) pathname = 'index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (!path.extname(pathname) && contentType.includes('text/html')) pathname += '/index.html';
  const safe = pathname.split('/').map(part => part.replace(/[<>:"|?*]/g, '_')).join('/');
  if (!url.search) return path.join(root, bucket, safe);
  const queryHash = createHash('sha1').update(url.search).digest('hex').slice(0, 12);
  const extension = path.extname(safe);
  return path.join(root, bucket, extension ? `${safe.slice(0, -extension.length)}.${queryHash}${extension}` : `${safe}.${queryHash}`);
}

function rewriteText(text) {
  return text
    .replaceAll(assetOrigin, `${localOrigin}/__assets`)
    .replaceAll('https:\\/\\/assets.zippic.cn', `${localOrigin.replaceAll('/', '\\/')}\\/__assets`)
    .replaceAll(pageOrigin, localOrigin)
    .replaceAll('https:\\/\\/zippic.cn', localOrigin.replaceAll('/', '\\/'));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function getCached(url) {
  const candidates = [cachePathFor(url, 'application/octet-stream'), cachePathFor(url, 'text/html')];
  for (const file of new Set(candidates)) {
    if (!existsSync(file) || !existsSync(`${file}.headers.json`)) continue;
    const metadata = JSON.parse(await readFile(`${file}.headers.json`, 'utf8'));
    return { file, metadata };
  }
  return null;
}

function send(res, status, contentType, payload, headOnly = false) {
  res.statusCode = status;
  res.setHeader('content-type', contentType);
  res.setHeader('content-length', payload.length);
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('access-control-allow-origin', '*');
  res.end(headOnly ? undefined : payload);
}

async function proxy(req, res) {
  const target = targetUrl(req.url);
  const method = req.method || 'GET';
  if (/^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?blog(?:\/|$)/.test(target.pathname)) {
    const payload = Buffer.from('404 - Blog removed', 'utf8');
    return send(res, 404, 'text/plain; charset=utf-8', payload, method === 'HEAD');
  }
  if (method === 'GET' || method === 'HEAD') {
    const cached = await getCached(target);
    if (cached) {
      const payload = await readFile(cached.file);
      return send(res, cached.metadata.status, cached.metadata.contentType, payload, method === 'HEAD');
    }
  }
  const requestHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'connection', 'content-length', 'accept-encoding'].includes(key) && value) requestHeaders[key] = value;
  }
  requestHeaders.host = target.host;
  requestHeaders['accept-encoding'] = 'identity';
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(req);

  try {
    const upstream = await fetch(target, { method, headers: requestHeaders, body, redirect: 'manual' });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const cacheFile = cachePathFor(target, contentType);
    let payload;

    if (method === 'GET' && existsSync(cacheFile)) {
      payload = await readFile(cacheFile);
    } else {
      const raw = Buffer.from(await upstream.arrayBuffer());
      payload = textTypes.some(type => contentType.includes(type)) ? Buffer.from(rewriteText(raw.toString('utf8'))) : raw;
      if (method === 'GET' && upstream.ok) {
        await mkdir(path.dirname(cacheFile), { recursive: true });
        await writeFile(cacheFile, payload);
        await writeFile(`${cacheFile}.headers.json`, JSON.stringify({ contentType, status: upstream.status }, null, 2));
      }
    }

    if (upstream.headers.get('location')) res.setHeader('location', rewriteText(upstream.headers.get('location')));
    send(res, upstream.status, contentType, payload, req.method === 'HEAD');
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(`Mirror fetch failed: ${error.message}`);
  }
}

const server = http.createServer(proxy);
server.listen(port, host, () => {
  console.log(`ZipImg mirror: ${localOrigin}/zh`);
  console.log(`Cached deployment files: ${root}`);
});
