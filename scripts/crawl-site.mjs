const base = process.env.MIRROR_URL || 'http://127.0.0.1:4174';
const sitemap = await fetch('https://zippic.cn/sitemap.xml').then(response => response.text());
const routeMatches = sitemap.matchAll(/href="https:\/\/zippic\.cn(\/zh(?:[^"#?]*))/g);
const routes = [...new Set([...routeMatches].map(match => match[1]))]
  .filter(route => !/^\/zh\/blog(?:\/|$)/.test(route));
const queue = [...routes];
const visited = new Set();
const assetPattern = /(?:https?:\/\/127\.0\.0\.1:4174)?(\/__assets\/[^"'<>\s)]+|\/_next\/[^"'<>\s)]+)/g;

function normalize(value) {
  return value.replaceAll('&amp;', '&').replace(/[\\),;]+$/, '');
}

async function crawlPath(item) {
  const url = item.startsWith('http') ? item : `${base}${item}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text') && !type.includes('javascript') && !type.includes('json')) return;
  const text = await response.text();
  for (const match of text.matchAll(assetPattern)) {
    const found = normalize(match[1]);
    if (!visited.has(found)) queue.push(found);
  }
}

console.log(`Discovered ${routes.length} Chinese routes.`);
let failures = 0;
while (queue.length) {
  const item = queue.shift();
  if (visited.has(item)) continue;
  visited.add(item);
  try {
    await crawlPath(item);
  } catch (error) {
    failures += 1;
    console.warn(error.message);
  }
  if (visited.size % 25 === 0) console.log(`Fetched ${visited.size} resources...`);
}
console.log(`Finished: ${visited.size - failures} fetched, ${failures} failed.`);
