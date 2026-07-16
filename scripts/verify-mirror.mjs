import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('.verify', { recursive: true });
const sample = spawnSync('ffmpeg', [
  '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=320x240:d=1',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', '.verify/sample.mp4'
]);
if (sample.status !== 0) throw new Error('Unable to create the verification video with ffmpeg.');

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const target = process.env.TARGET || 'http://127.0.0.1:4174/zh/video-converter';
const failed = [];
const wasmRequests = [];
const consoleErrors = [];
const badResponses = [];
const pageErrors = [];
page.on('request', request => {
  if (/wasm|worker|ffmpeg/i.test(request.url())) wasmRequests.push(request.url());
});
page.on('requestfailed', request => failed.push(`${request.url()} :: ${request.failure()?.errorText}`));
page.on('response', response => {
  if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
});
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(`${message.location().url || 'inline'} :: ${message.text()}`);
});
page.on('pageerror', error => pageErrors.push(error.stack || error.message));

try {
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 60_000 });
  await page.waitForFunction(() => !document.querySelector('header button[aria-label="Language selector loading"]'), null, { timeout: 90_000 });
  await page.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 90_000 });
  await page.locator('input[type=file]').first().setInputFiles('.verify/sample.mp4');
  await page.waitForTimeout(12_000);
  const startButton = page.getByRole('button', { name: /开始转换/ }).first();
  let conversionStarted = false;
  const enableDeadline = Date.now() + 90_000;
  while (await startButton.count() && !(await startButton.isEnabled()) && Date.now() < enableDeadline) {
    await page.waitForTimeout(1_000);
  }
  if (await startButton.count() && await startButton.isEnabled()) {
    await startButton.click();
    conversionStarted = true;
    await page.waitForFunction(() => document.body.innerText.includes('转换成功'), null, { timeout: 90_000 }).catch(() => {});
  }
  const title = await page.locator('h1').first().textContent();
  const body = await page.locator('body').innerText();
  console.log(JSON.stringify({
    title: title?.trim(),
    target,
    fileInputCount: await page.locator('input[type=file]').count(),
    fileAccepted: body.includes('sample.mp4') || await page.locator('input[type=file]').count() === 0,
    buttons: (await page.getByRole('button').allTextContents()).map(text => text.trim()).filter(Boolean).slice(0, 20),
    conversionStarted,
    conversionSucceeded: body.includes('转换成功'),
    wasmRequests: [...new Set(wasmRequests)],
    failed: failed.filter(item => !/google|doubleclick|adsbygoogle|cloudflare/i.test(item)),
    badResponses: badResponses.filter(item => !/google|doubleclick|adsbygoogle|cloudflare/i.test(item)).slice(0, 20),
    consoleErrors: consoleErrors.filter(item => !/google|doubleclick|adsbygoogle|cloudflare/i.test(item)).slice(0, 10)
    ,pageErrors: pageErrors.slice(0, 10)
  }, null, 2));
} finally {
  await browser.close();
  rmSync('.verify', { recursive: true, force: true });
}
