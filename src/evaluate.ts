import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SEOTest } from './report-generator.js';
import { takeElementScreenshot, takeFullPageScreenshot } from './utilities/screenshot.js';

interface EvaluationResult {
  url: string;
  tests: SEOTest[];
  screenshot?: string;
  timestamp: string;
}

export default async function evaluateUrl(url: string): Promise<EvaluationResult> {
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

  // Take screenshot as base64
  const screenshotDataUrl = await takeFullPageScreenshot(page);

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

  // Check for multiple H1 tags
  const h1Count = headingStructure.filter(h => h.tag === 'H1').length;
  if (h1Count > 1) {
    const h1Tags = headingStructure.filter(h => h.tag === 'H1');

    // Take individual screenshots of each H1 tag
    for (let i = 0; i < h1Tags.length; i++) {
      const h1Element = h1Tags[i];

      // Take screenshot of the H1 element
      const elementScreenshotDataUrl = await takeElementScreenshot(page, h1Element.element);

      const testResult: any = {
        title: `H1 Tag ${i + 1} of ${h1Count}: "${h1Element.text}"`,
        state: 'failed',
        error: `Multiple H1 tags found. This is H1 #${i + 1}: "${h1Element.text}". There should only be one H1 tag per page.`,
      };

      // Only add screenshot if we successfully captured one
      if (elementScreenshotDataUrl) {
        testResult.screenshot = elementScreenshotDataUrl;
      } else {
        testResult.error += ' No screenshot available for this H1 tag.';
      }

      tests.push(testResult);
    }

    console.error(`Error: Found ${h1Count} H1 tags on the page. There should only be one.`);
    console.error(
      'H1 tags found:',
      h1Tags.map(h => h.text),
    );
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
    // Take individual screenshots of each out of order heading
    for (let i = 0; i < outOfOrder.length; i++) {
      const outOfOrderHeading = outOfOrder[i];

      // Take screenshot of the out of order heading element
      const elementScreenshotDataUrl = await takeElementScreenshot(page, outOfOrderHeading.element);

      const testResult: any = {
        title: `Out of Order Heading ${i + 1} of ${outOfOrder.length}: ${outOfOrderHeading.tag} "${outOfOrderHeading.text}"`,
        state: 'failed',
        error: `Out of order heading found: ${outOfOrderHeading.tag} "${outOfOrderHeading.text}". Headings should follow a logical hierarchy (H1 > H2 > H3, etc.) without skipping levels.`,
      };

      // Only add screenshot if we successfully captured one
      if (elementScreenshotDataUrl) {
        testResult.screenshot = elementScreenshotDataUrl;
      }

      tests.push(testResult);
    }

    console.error('Error: Found out of order headings.');
    console.error(
      'Out of Order Headings:',
      outOfOrder.map(h => `${h.tag}: "${h.text}"`),
    );
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
    screenshot: screenshotDataUrl,
    timestamp,
  };
}
