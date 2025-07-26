import Crawler from 'simplecrawler';

interface CrawlOptions {
  excludeQueryStrings?: boolean;
  maxUrls?: number;
}

export async function crawlSite(startUrl: string, options: CrawlOptions = {}): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const urls = new Set<string>();
    const maxUrls = options.maxUrls === 0 ? Infinity : options.maxUrls || 10;

    // Add the start URL, optionally removing query string
    const cleanStartUrl = options.excludeQueryStrings ? startUrl.split('?')[0] : startUrl;
    urls.add(cleanStartUrl);

    const crawler = new Crawler(startUrl);

    // Set max concurrent requests to 1 to better control the crawling
    crawler.maxConcurrency = 1;

    crawler.addFetchCondition(queueItem => {
      const filteredExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.js',
        '.xml',
        '.css',
        '.js',
      ];

      // Return false if the url ends with any of the filtered extensions
      return !filteredExtensions.some(ext => queueItem.url.endsWith(ext));
    });

    crawler.on('fetchcomplete', (queueItem, data, res) => {
      // Add the URL if its html
      if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
        let urlToAdd = queueItem.url;

        // Remove query string if option is enabled
        if (options.excludeQueryStrings) {
          urlToAdd = urlToAdd.split('?')[0];
        }

        console.log(`Found URL: ${urlToAdd}`);
        urls.add(urlToAdd);

        // Stop crawling if we've reached the maximum number of URLs (unless maxUrls is Infinity)
        if (maxUrls !== Infinity && urls.size >= maxUrls) {
          console.log(`Reached maximum URL limit of ${maxUrls}. Stopping crawler.`);
          crawler.stop();
          resolve(Array.from(urls));
          return;
        }
      }
    });
    crawler.on('complete', () => {
      console.log('Crawling complete.');
      resolve(Array.from(urls));
    });

    crawler.on('fetcherror', (queueItem, response) => {
      console.error(`Error crawling ${queueItem.url}:`, response);
      // Don't reject on individual fetch errors, just continue
    });

    crawler.start();
  });
}
