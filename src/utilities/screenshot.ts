import { Page, ElementHandle } from 'puppeteer';

interface ScreenshotOptions {
  scrollBehavior?: 'smooth' | 'auto';
  scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
  waitTime?: number;
  padding?: number;
}

/**
 * Takes a screenshot of a specific element on the page with visual context
 * @param page - The Puppeteer page instance
 * @param element - The element to screenshot
 * @param options - Screenshot options including padding for visual context
 * @returns Base64 data URL of the screenshot or null if failed
 */
export async function takeElementScreenshot(
  page: Page,
  element: ElementHandle,
  options: ScreenshotOptions = {},
): Promise<string | null> {
  const { scrollBehavior = 'smooth', scrollBlock = 'center', waitTime = 500, padding = 100 } = options;

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

    // Get element's position and create a clip region manually
    const elementInfo = await page.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    }, element);

    // Create clip region with padding, but ensure it doesn't go negative
    const clip = {
      x: Math.max(0, elementInfo.x - padding),
      y: Math.max(0, elementInfo.y - padding),
      width: elementInfo.width + padding * 2,
      height: elementInfo.height + padding * 2,
    };

    // Take screenshot with the calculated clip region
    const screenshot = await page.screenshot({
      encoding: 'base64',
      type: 'png',
      clip,
    });

    return `data:image/png;base64,${screenshot}`;
  } catch (error) {
    console.warn(`Could not take element screenshot: ${error}`);
    // Fallback to element screenshot without context
    try {
      const fallbackScreenshot = await element.screenshot({
        encoding: 'base64',
        type: 'png',
      });
      return `data:image/png;base64,${fallbackScreenshot}`;
    } catch (fallbackError) {
      console.warn(`Fallback element screenshot also failed: ${fallbackError}`);
      return null;
    }
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
