import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('site-source');
const injection = '<link rel="stylesheet" href="/zipimg-custom.css"/><script defer src="/zipimg-custom.js"></script>';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function rebrand(text) {
  return text
    .replaceAll('imkelen009@gmail.com', '1653440843@qq.com')
    .replaceAll('ZipPic', 'ZipImg')
    .replaceAll('ZIPPIC', 'ZIPIMG')
    .replace(/(?<![\/@])zippic(?![.\-/])/g, 'zipimg');
}

const allFiles = await walk(root);
const headerFiles = allFiles.filter(file => file.endsWith('.headers.json'));
let changed = 0;

for (const headerFile of headerFiles) {
  const target = headerFile.slice(0, -'.headers.json'.length);
  if (target.endsWith('zipimg-custom.js') || target.endsWith('zipimg-custom.css')) continue;
  const metadata = JSON.parse(await readFile(headerFile, 'utf8'));
  if (!/(text|javascript|json|xml)/i.test(metadata.contentType || '')) continue;
  let text = await readFile(target, 'utf8');
  const original = text;
  text = rebrand(text);
  if (/text\/html/i.test(metadata.contentType) && !text.includes('/zipimg-custom.css')) {
    text = text.replace('</head>', `${injection}</head>`);
  }
  if (text !== original) {
    await writeFile(target, text, 'utf8');
    changed += 1;
  }
}

console.log(`Customized ${changed} cached text responses.`);
