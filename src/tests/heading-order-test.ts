import { Page } from 'puppeteer';
import { SEOTest } from '../report-generator.js';
import { takeElementScreenshot } from '../utilities/screenshot.js';
import { HeadingStructure } from './types.js';

export async function testHeadingOrder(page: Page, headingStructure: HeadingStructure[]): Promise<SEOTest[]> {
  const tests: SEOTest[] = [];

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
        title: `Out of Order Heading ${i + 1} of ${outOfOrder.length}: ${outOfOrderHeading.tag} "${outOfOrderHeading.text || ''}"`,
        state: 'failed',
        error: `Out of order heading found: ${outOfOrderHeading.tag} "${outOfOrderHeading.text || ''}". Headings should follow a logical hierarchy (H1 > H2 > H3, etc.) without skipping levels.`,
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
      outOfOrder.map(h => `${h.tag}: "${h.text || ''}"`),
    );
  } else {
    tests.push({
      title: 'Heading Order',
      state: 'passed',
    });
  }

  return tests;
}
