import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const marge = require('mochawesome-report-generator');

export interface SEOTest {
  title: string;
  state: 'passed' | 'failed';
  error?: string;
  screenshot?: string;
}

export interface SEOResult {
  url: string;
  tests: SEOTest[];
  screenshot?: string;
  timestamp: string;
}

export class SEOReportGenerator {
  private results: SEOResult[] = [];
  private reportDir: string;

  constructor(reportDir: string = 'reports') {
    this.reportDir = reportDir;

    // Create reports directory if it doesn't exist
    try {
      mkdirSync(this.reportDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  addResult(result: SEOResult) {
    this.results.push(result);
  }

  private generateMochawesomeJson() {
    const stats = {
      suites: 0,
      tests: 0,
      passes: 0,
      pending: 0,
      failures: 0,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      duration: 0,
      testsRegistered: 0,
      passPercent: 0,
      pendingPercent: 0,
      other: 0,
      hasOther: false,
      skipped: 0,
      hasSkipped: false,
    };

    const suites = this.results.map((result, index) => {
      const tests = result.tests.map((test, testIndex) => ({
        uuid: `${index}-${testIndex}`,
        title: test.title,
        fullTitle: `${result.url} ${test.title}`,
        timedOut: false,
        duration: 100,
        state: test.state,
        speed: test.state === 'passed' ? 'fast' : undefined,
        pass: test.state === 'passed',
        fail: test.state === 'failed',
        pending: false,
        context: test.screenshot
          ? JSON.stringify({
              title: 'Screenshot',
              value: test.screenshot,
            })
          : undefined,
        code: '',
        err: test.error
          ? {
              message: test.error,
              estack: test.error,
              diff: null,
            }
          : {},
        isRoot: false,
        parentUUID: `${index}`,
        isHook: false,
        skipped: false,
      }));

      stats.tests += tests.length;
      stats.passes += tests.filter(t => t.state === 'passed').length;
      stats.failures += tests.filter(t => t.state === 'failed').length;

      return {
        uuid: `${index}`,
        title: result.url,
        fullFile: '',
        file: '',
        beforeHooks: [],
        afterHooks: [],
        tests: tests,
        suites: [],
        passes: tests.filter(t => t.state === 'passed'),
        failures: tests.filter(t => t.state === 'failed'),
        pending: [],
        skipped: [],
        duration: tests.length * 100,
        root: false,
        rootEmpty: false,
        _timeout: 30000,
      };
    });

    stats.suites = suites.length;
    stats.testsRegistered = stats.tests;
    stats.passPercent = stats.tests > 0 ? Math.round((stats.passes / stats.tests) * 100) : 0;
    stats.pendingPercent = 0;

    return {
      stats,
      results: [
        {
          uuid: 'root',
          title: '',
          fullFile: '',
          file: '',
          beforeHooks: [],
          afterHooks: [],
          tests: [],
          suites: suites,
          passes: [],
          failures: [],
          pending: [],
          skipped: [],
          duration: 0,
          root: true,
          rootEmpty: true,
          _timeout: 30000,
        },
      ],
      meta: {
        mocha: {
          version: '10.0.0',
        },
        mochawesome: {
          options: {
            quiet: false,
            reportFilename: 'seo-report',
            saveHtml: true,
            saveJson: true,
            consoleReporter: 'spec',
            useInlineDiffs: false,
            code: true,
          },
          version: '7.1.3',
        },
        marge: {
          options: {
            reportDir: this.reportDir,
            reportFilename: 'seo-report',
            reportTitle: 'SEO Analysis Report',
            reportPageTitle: 'SEO Test Results',
            inline: false,
            inlineAssets: false,
            cdn: false,
            charts: true,
            enableCharts: true,
            code: true,
            enableCode: true,
            autoOpen: false,
            overwrite: true,
            timestamp: false,
            ts: false,
            showPassed: true,
            showFailed: true,
            showPending: true,
            showSkipped: false,
            showHooks: 'failed',
            saveJson: true,
            saveHtml: true,
            dev: false,
            assetsDir: this.reportDir,
          },
          version: '6.2.0',
        },
      },
    };
  }

  async generateReport(): Promise<string> {
    const mochawesomeData = this.generateMochawesomeJson();
    const jsonPath = join(this.reportDir, 'seo-report.json');

    // Save the JSON file
    writeFileSync(jsonPath, JSON.stringify(mochawesomeData, null, 2));

    // Generate HTML report
    const options = {
      reportDir: this.reportDir,
      reportFilename: 'seo-report',
      reportTitle: 'SEO Analysis Report',
      reportPageTitle: 'SEO Test Results',
      inline: true,
      inlineAssets: true,
      cdn: false,
      charts: true,
      enableCharts: true,
      code: true,
      enableCode: true,
      autoOpen: false,
      overwrite: true,
      timestamp: false,
      showPassed: true,
      showFailed: true,
      showPending: true,
      showSkipped: false,
      showHooks: 'failed',
      saveJson: true,
      saveHtml: true,
    };

    try {
      // Use the required marge module
      await marge.create(mochawesomeData, options);
      const htmlPath = join(this.reportDir, 'seo-report.html');
      console.log(`\n📊 SEO Report generated: ${htmlPath}`);
      return htmlPath;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
}
