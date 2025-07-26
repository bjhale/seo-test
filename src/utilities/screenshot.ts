import { Page, ElementHandle } from 'puppeteer';

interface ScreenshotOptions {
  scrollBehavior?: 'smooth' | 'auto';
  scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
  waitTime?: number;
}

/**
 * Takes a screenshot of a specific element on the page
 * @param page - The Puppeteer page instance
 * @param element - The element to screenshot
 * @param options - Screenshot options
 * @returns Base64 data URL of the screenshot or null if failed
 */
export async function takeElementScreenshot(
  page: Page,
  element: ElementHandle,
  options: ScreenshotOptions = {},
): Promise<string | null> {
  const { scrollBehavior = 'smooth', scrollBlock = 'center', waitTime = 500 } = options;

  try {
    // Scroll the element into view
    await page.evaluate(
      (el, behavior, block) => {
        el.scrollIntoView({ behavior, block });
      },
      element,
      scrollBehavior,
      scrollBlock,
    );

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Take screenshot of the element
    const elementScreenshot = await element.screenshot({
      encoding: 'base64',
      type: 'png',
    });

    return `data:image/png;base64,${elementScreenshot}`;
  } catch (error) {
    console.warn(`Could not take element screenshot: ${error}`);
    return null;
  }
}

/**
 * Takes a full page screenshot
 * @param page - The Puppeteer page instance
 * @returns Base64 data URL of the screenshot
 */
export async function takeFullPageScreenshot(page: Page): Promise<string> {
  const screenshotBase64 = await page.screenshot({
    encoding: 'base64',
    fullPage: true,
    type: 'png',
  });

  return `data:image/png;base64,${screenshotBase64}`;
}
