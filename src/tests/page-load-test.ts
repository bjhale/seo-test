import { Page } from 'puppeteer';
import { SEOTest } from '../report-generator.js';

export async function testPageLoad(page: Page, url: string, response: any): Promise<SEOTest[]> {
  const tests: SEOTest[] = [];

  if (!response || !response.ok()) {
    console.error(`Failed to load page: ${url}`);
    tests.push({
      title: 'Page Load',
      state: 'failed',
      error: `Failed to load page: ${url}`,
    });
  } else {
    tests.push({
      title: 'Page Load',
      state: 'passed',
    });
  }

  return tests;
}
