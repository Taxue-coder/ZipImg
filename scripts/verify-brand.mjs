import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const output = '.verify-brand';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto('http://127.0.0.1:4174/zh', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(7_000);
  const homeText = await page.locator('body').innerText();
  const background = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  const buttonColor = await page.locator('.bg-main').first().evaluate(element => getComputedStyle(element).backgroundColor);
  const logoLoaded = await page.locator('header img').first().evaluate(image => image.complete && image.naturalWidth > 0);
  const comparisonLoaded = await page.locator('img[alt="压缩前"]').evaluate(image => image.complete && image.naturalWidth > 0);
  await page.screenshot({ path: `${output}/home.png`, fullPage: true });

  await page.goto('http://127.0.0.1:4174/zh/privacy', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(5_000);
  const privacyText = await page.locator('body').innerText();

  const result = {
    brandUpdated: homeText.includes('ZipImg') && !homeText.includes('ZipPic'),
    friendLinksRemoved: !homeText.includes('友情链接'),
    blogRemoved: !homeText.includes('博客') && await page.locator('header a[href*="/blog"]').count() === 0,
    emailUpdated: privacyText.includes('1653440843@qq.com') && !privacyText.includes('imkelen009@gmail.com'),
    background,
    buttonColor,
    logoLoaded,
    comparisonLoaded,
    screenshot: `${output}/home.png`
  };
  console.log(JSON.stringify(result, null, 2));
  if (Object.entries(result).some(([key, value]) => key !== 'screenshot' && (value === false || value == null))) process.exitCode = 1;
} finally {
  await browser.close();
}
