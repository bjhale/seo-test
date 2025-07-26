import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SEOTest } from './report-generator.js';

interface EvaluationResult {
  url: string;
  tests: SEOTest[];
  screenshot?: string;
  timestamp: string;
}

export default async function evaluateUrl(
  url: string,
  screenshotDir: string = 'reports/screenshots',
): Promise<EvaluationResult> {
  const tests: SEOTest[] = [];
  const timestamp = new Date().toISOString();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  if (!response || !response.ok()) {
    console.error(`Failed to load page: ${url}`);
    await browser.close();
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

  // Take screenshot for the page
  const screenshotPath = `${screenshotDir}/${encodeURIComponent(url)}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath as `${string}.png`, fullPage: true });

  const $ = cheerio.load(await response?.text());

  const headings = await page.$$('h1, h2, h3, h4, h5, h6');

  const headingStructure = await Promise.all(
    headings.map(async heading => {
      return {
        tag: await page.evaluate(el => el.tagName, heading),
        text: await page.evaluate(el => el.textContent?.trim(), heading),
        element: heading,
      };
    }),
  );

  console.log('Heading Structure:', headingStructure);

  // Check for multiple H1 tags
  const h1Count = headingStructure.filter(h => h.tag === 'H1').length;
  if (h1Count > 1) {
    const h1Tags = headingStructure.filter(h => h.tag === 'H1').map(h => h.text);
    tests.push({
      title: 'Single H1 Tag',
      state: 'failed',
      error: `Found ${h1Count} H1 tags on the page. There should only be one. H1 tags found: ${h1Tags.join(', ')}`,
      screenshot: screenshotPath,
    });
    console.error(`Error: Found ${h1Count} H1 tags on the page. There should only be one.`);
    console.error('H1 tags found:', h1Tags);
  } else {
    tests.push({
      title: 'Single H1 Tag',
      state: 'passed',
    });
  }

  // Check for out of order headings
  let lastLevel = 0;
  const outOfOrder = headingStructure.filter(heading => {
    const headingLevel = parseInt(heading.tag.replace('H', ''), 10);
    const isOutOfOrder = headingLevel > lastLevel + 1;
    lastLevel = headingLevel;
    return isOutOfOrder;
  });

  if (outOfOrder.length > 0) {
    const outOfOrderTitles = outOfOrder.map(h => `${h.tag}: ${h.text}`);
    tests.push({
      title: 'Heading Order',
      state: 'failed',
      error: `Found out of order headings: ${outOfOrderTitles.join(', ')}`,
      screenshot: screenshotPath,
    });
    console.error('Error: Found out of order headings.');
    console.error('Out of Order Headings:', outOfOrder);
  } else {
    tests.push({
      title: 'Heading Order',
      state: 'passed',
    });
  }

  // Check for canonical tag
  const canonicalLink = await page.$('link[rel="canonical"]');
  if (!canonicalLink) {
    tests.push({
      title: 'Canonical Link Present',
      state: 'failed',
      error: 'No canonical link found on the page',
      screenshot: screenshotPath,
    });
    console.error('Error: No canonical link found on the page.');
  } else {
    const canonicalHref = await page.evaluate(el => el.href, canonicalLink);
    tests.push({
      title: 'Canonical Link Present',
      state: 'passed',
    });
    console.log('Canonical link found:', canonicalHref);
  }

  // Check for absolute canonical
  const canonicalHref = $('link[rel="canonical"]').attr('href');
  if (canonicalHref && !(canonicalHref?.startsWith('http://') || canonicalHref?.startsWith('https://'))) {
    tests.push({
      title: 'Canonical Link Absolute',
      state: 'failed',
      error: `Canonical link is not absolute: ${canonicalHref}`,
      screenshot: screenshotPath,
    });
    console.error('Error: Canonical link is not absolute:', canonicalHref);
  } else if (canonicalHref) {
    tests.push({
      title: 'Canonical Link Absolute',
      state: 'passed',
    });
  }

  // Check for canonical not using https
  if (canonicalHref?.startsWith('http://')) {
    tests.push({
      title: 'Canonical Link HTTPS',
      state: 'failed',
      error: `Canonical link is using http instead of https: ${canonicalHref}`,
      screenshot: screenshotPath,
    });
    console.error('Error: Canonical link is using http instead of https:', canonicalHref);
  } else if (canonicalHref) {
    tests.push({
      title: 'Canonical Link HTTPS',
      state: 'passed',
    });
  }

  console.log('Canonical link: ', canonicalHref);

  await browser.close();

  return {
    url,
    tests,
    screenshot: screenshotPath,
    timestamp,
  };
}
