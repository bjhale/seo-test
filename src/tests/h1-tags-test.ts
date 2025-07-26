import { Page } from 'puppeteer';
import { SEOTest } from '../report-generator.js';
import { takeElementScreenshot } from '../utilities/screenshot.js';
import { HeadingStructure } from './types.js';

export async function testMultipleH1Tags(page: Page, headingStructure: HeadingStructure[]): Promise<SEOTest[]> {
  const tests: SEOTest[] = [];

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
        title: `H1 Tag ${i + 1} of ${h1Count}: "${h1Element.text || ''}"`,
        state: 'failed',
        error: `Multiple H1 tags found. This is H1 #${i + 1}: "${h1Element.text || ''}". There should only be one H1 tag per page.`,
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
      h1Tags.map(h => h.text || ''),
    );
  } else {
    tests.push({
      title: 'Single H1 Tag',
      state: 'passed',
    });
  }

  return tests;
}
