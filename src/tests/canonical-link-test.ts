import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { SEOTest } from '../report-generator.js';

interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

export async function testCanonicalLink(page: Page, $: cheerio.CheerioAPI, logger?: Logger): Promise<SEOTest[]> {
  const tests: SEOTest[] = [];

  // Check for canonical tag
  const canonicalLink = await page.$('link[rel="canonical"]');
  if (!canonicalLink) {
    tests.push({
      title: 'Canonical Link Present',
      state: 'failed',
      error: 'No canonical link found on the page',
    });
    const message = 'Error: No canonical link found on the page.';
    if (logger) logger.error(message);
    else console.error(message);
  } else {
    const canonicalHref = await page.evaluate(el => el.href, canonicalLink);
    tests.push({
      title: 'Canonical Link Present',
      state: 'passed',
    });
    const message = `Canonical link found: ${canonicalHref}`;
    if (logger) logger.log(message);
    else console.log(message);
  }

  // Check for absolute canonical
  const canonicalHref = $('link[rel="canonical"]').attr('href');
  if (canonicalHref && !(canonicalHref?.startsWith('http://') || canonicalHref?.startsWith('https://'))) {
    tests.push({
      title: 'Canonical Link Absolute',
      state: 'failed',
      error: `Canonical link is not absolute: ${canonicalHref}`,
    });
    const message = `Error: Canonical link is not absolute: ${canonicalHref}`;
    if (logger) logger.error(message);
    else console.error(message);
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
    const message = `Error: Canonical link is using http instead of https: ${canonicalHref}`;
    if (logger) logger.error(message);
    else console.error(message);
  } else if (canonicalHref) {
    tests.push({
      title: 'Canonical Link HTTPS',
      state: 'passed',
    });
  }

  const message = `Canonical link: ${canonicalHref}`;
  if (logger) logger.log(message);
  else console.log(message);

  return tests;
}
