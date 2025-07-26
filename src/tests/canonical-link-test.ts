import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { SEOTest } from '../report-generator.js';

export async function testCanonicalLink(page: Page, $: cheerio.CheerioAPI): Promise<SEOTest[]> {
  const tests: SEOTest[] = [];

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

  return tests;
}
