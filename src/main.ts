#!/usr/bin/env node

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import evaluateUrl from './evaluate.js';
import { crawlSite } from './crawler.js';
import { SEOReportGenerator } from './report-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

/**
 * Read URLs from stdin
 */
async function readUrlsFromStdin(): Promise<string[]> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      const urls = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.startsWith('http'));
      resolve(urls);
    });
  });
}

/**
 * Read URLs from a file
 */
function readUrlsFromFile(filePath: string): string[] {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('http'));
}

interface Arguments {
  url?: string;
  crawl?: boolean;
  excludeQueryStrings?: boolean;
  maxUrls?: number;
  file?: string;
  stdin?: boolean;
}

yargs(hideBin(process.argv))
  .scriptName('seo-test')
  .usage('$0 [url] [options]')
  .command(
    '$0 [url]',
    'Analyze SEO for given URL(s)',
    (yargs: Argv) => {
      return yargs
        .positional('url', {
          describe: 'The URL to analyze for SEO issues',
          type: 'string',
        })
        .option('crawl', {
          alias: 'c',
          describe: 'Enable crawling mode to analyze multiple pages',
          type: 'boolean',
          default: false,
        })
        .option('exclude-query-strings', {
          alias: 'q',
          describe: 'Remove query strings from discovered URLs',
          type: 'boolean',
          default: false,
        })
        .option('max-urls', {
          alias: 'm',
          describe: 'Maximum number of URLs to crawl (0 = no limit)',
          type: 'number',
          default: 10,
        })
        .option('file', {
          alias: 'f',
          describe: 'Read URLs from a text file (one URL per line)',
          type: 'string',
        })
        .option('stdin', {
          alias: 's',
          describe: 'Read URLs from stdin (one URL per line)',
          type: 'boolean',
          default: false,
        });
    },
    async (argv: Arguments) => {
      let urls: string[] = [];

      // Determine the source of URLs
      if (argv.stdin) {
        console.log('Reading URLs from stdin...');
        urls = await readUrlsFromStdin();
        if (urls.length === 0) {
          console.error('Error: No valid URLs found in stdin');
          process.exit(1);
        }
      } else if (argv.file) {
        console.log(`Reading URLs from file: ${argv.file}`);
        try {
          urls = readUrlsFromFile(argv.file);
          if (urls.length === 0) {
            console.error(`Error: No valid URLs found in file: ${argv.file}`);
            process.exit(1);
          }
        } catch (error) {
          console.error(`Error reading file: ${error}`);
          process.exit(1);
        }
      } else if (argv.url) {
        console.log(`Starting analysis of: ${argv.url}`);
        urls = [argv.url];

        if (argv.crawl) {
          console.log('Crawling site for additional URLs...');
          if (argv.maxUrls === 0) {
            console.warn(
              'Crawling with no limit may result in excessive resource usage. Consider setting a maximum limit.',
            );
          }
          urls = await crawlSite(argv.url, {
            excludeQueryStrings: argv.excludeQueryStrings,
            maxUrls: argv.maxUrls,
          });
        }
      } else {
        console.error('Error: No URL source specified. Provide a URL, use --file, or --stdin');
        process.exit(1);
      }

      console.log(`\nFound ${urls.length} URL(s) to analyze:`);
      urls.forEach((url, index) => console.log(`  ${index + 1}. ${url}`));

      // Analyze all discovered URLs
      const reportGenerator = new SEOReportGenerator();

      for (const url of urls) {
        console.log(`\n--- Analyzing: ${url} ---`);
        try {
          const result = await evaluateUrl(url);
          reportGenerator.addResult(result);
        } catch (error) {
          console.error(`Error analyzing URL ${url}:`, error);
          reportGenerator.addResult({
            url,
            tests: [
              {
                title: 'Analysis Error',
                state: 'failed',
                error: `Error analyzing URL: ${error}`,
              },
            ],
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Generate the HTML report
      try {
        await reportGenerator.generateReport();
      } catch (error) {
        console.error('Error generating report:', error);
      }
    },
  )
  .help()
  .alias('help', 'h')
  .version(packageJson.version)
  .alias('version', 'v').argv;
