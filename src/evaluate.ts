import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SEOTest } from './report-generator.js';
import { takeElementScreenshot, takeFullPageScreenshot } from './utilities/screenshot.js';
import { testMultipleH1Tags, testHeadingOrder, testCanonicalLink } from './tests/index.js';
import { HeadingStructure } from './tests/types.js';

interface EvaluationResult {
  url: string;
  tests: SEOTest[];
  screenshot?: string;
  timestamp: string;
}

export default async function evaluateUrl(url: string, browser: Browser): Promise<EvaluationResult> {
  const tests: SEOTest[] = [];
  const timestamp = new Date().toISOString();

  const page = await browser.newPage();

  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  if (!response || !response.ok()) {
    console.error(`Failed to load page: ${url}`);
    await page.close();
    return {
      url,
      tests: [
        {
          title: 'Page Load',
          state: 'failed',
          error: `Failed to load page: ${url}`,
        },
      ],
      timestamp,
    };
  }

  // Take screenshot as base64
  const screenshotDataUrl = await takeFullPageScreenshot(page);

  const $ = cheerio.load(await response?.text());

  const headings = await page.$$('h1, h2, h3, h4, h5, h6');

  const headingStructure: HeadingStructure[] = await Promise.all(
    headings.map(async heading => {
      return {
        tag: await page.evaluate(el => el.tagName, heading),
        text: await page.evaluate(el => el.textContent?.trim(), heading),
        element: heading,
      };
    }),
  );

  // Run all SEO tests
  const h1Tests = await testMultipleH1Tags(page, headingStructure);
  tests.push(...h1Tests);

  const headingOrderTests = await testHeadingOrder(page, headingStructure);
  tests.push(...headingOrderTests);

  const canonicalTests = await testCanonicalLink(page, $);
  tests.push(...canonicalTests);

  await page.close();

  return {
    url,
    tests,
    screenshot: screenshotDataUrl,
    timestamp,
  };
}
