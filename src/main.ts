#!/usr/bin/env node

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import evaluateUrl from './evaluate.js';
import { crawlSite } from './crawler.js';
import { SEOReportGenerator } from './report-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

interface Arguments {
  url: string;
  crawl?: boolean;
  excludeQueryStrings?: boolean;
  maxUrls?: number;
}

yargs(hideBin(process.argv))
  .scriptName('seo-test')
  .usage('$0 <url> [options]')
  .command(
    '$0 <url>',
    'Analyze SEO for a given URL',
    (yargs: Argv) => {
      return yargs
        .positional('url', {
          describe: 'The URL to analyze for SEO issues',
          type: 'string',
          demandOption: true,
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
        });
    },
    async (argv: Arguments) => {
      console.log(`Starting analysis of: ${argv.url}`);
      let urls: string[] = [argv.url];

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

      //Analyze all discovered URLs
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
