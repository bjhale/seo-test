# SEO Test Tool 🔍

A powerful, automated SEO analysis tool that helps you identify and fix common SEO issues across your website. Built with TypeScript and Puppeteer for reliable, parallel web page analysis.

## ✨ Features

- **🚀 Fast Parallel Processing**: Analyze multiple URLs simultaneously with configurable concurrency
- **📊 Comprehensive SEO Tests**:
  - Multiple H1 tag detection
  - Heading hierarchy validation (H1 → H2 → H3 order)
  - Canonical link presence and validation
  - HTTPS canonical link enforcement
- **📸 Visual Evidence**: Screenshots of problematic elements for easy debugging
- **📄 Multiple Input Methods**: Single URL, file input, or stdin pipe
- **🌐 Site Crawling**: Automatically discover and analyze multiple pages
- **📋 Rich HTML Reports**: Beautiful, detailed reports with visual feedback
- **🎯 Flexible Output**: Clean, buffered console output and structured JSON reports

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/bjhale/seo-test.git
cd seo-test

# Install dependencies
npm install

# Build the project
npm run build

# Or run directly in development mode
npm run start:dev -- --help
```

### Basic Usage

```bash
# Analyze a single URL
npm run start:dev -- https://example.com

# Analyze multiple URLs from a file
npm run start:dev -- -f urls.txt

# Crawl a site and analyze discovered pages
npm run start:dev -- https://example.com --crawl --max-urls 20

# Control parallel execution (default: 5)
npm run start:dev -- -f urls.txt --concurrency 3

# Read URLs from stdin
echo "https://example.com" | npm run start:dev -- --stdin
```

## 📖 Command Line Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--file` | `-f` | Read URLs from a text file (one URL per line) |
| `--stdin` | `-s` | Read URLs from stdin |
| `--crawl` | `-c` | Enable crawling mode to discover additional pages |
| `--max-urls` | `-m` | Maximum number of URLs to crawl (default: 10) |
| `--concurrency` | `-p` | Maximum number of parallel executions (default: 5) |
| `--exclude-query-strings` | `-q` | Remove query strings from discovered URLs |
| `--help` | `-h` | Show help information |
| `--version` | `-v` | Show version number |

## 📋 SEO Tests Included

### 🏷️ H1 Tag Analysis

- **Multiple H1 Detection**: Identifies pages with more than one H1 tag
- **Visual Screenshots**: Captures images of each problematic H1 tag
- **Best Practice**: Ensures each page has exactly one H1 tag

### 📑 Heading Hierarchy

- **Structure Validation**: Checks that headings follow proper order (H1 → H2 → H3)
- **Skip Detection**: Identifies headings that skip levels (e.g., H1 directly to H3)
- **Visual Evidence**: Screenshots of out-of-order headings

### 🔗 Canonical Link Validation

- **Presence Check**: Ensures canonical links are present
- **Absolute URL Validation**: Verifies canonical URLs are absolute, not relative
- **HTTPS Enforcement**: Checks that canonical links use HTTPS protocol

## 📊 Output Examples

### Console Output

```text
--- Analysis Results for: https://example.com ---
[ERROR] Error: Found 3 H1 tags on the page. There should only be one.
[ERROR] H1 tags found: ["Main Title","Secondary Title","Footer Title"]
[LOG] Canonical link found: https://example.com/page
[ERROR] Error: Canonical link is not absolute: /page
```

### HTML Report

The tool generates a comprehensive HTML report at `reports/seo-report.html` with:

- ✅ Pass/fail status for each test
- 📸 Screenshots of problematic elements  
- 📈 Summary statistics
- 🎨 Clean, professional styling

## 🔧 Development

### Project Structure

```text
src/
├── main.ts              # CLI entry point
├── evaluate.ts          # Main evaluation logic
├── crawler.ts           # Site crawling functionality
├── report-generator.ts  # HTML report generation
├── tests/              # Modular SEO test implementations
│   ├── h1-tags-test.ts
│   ├── heading-order-test.ts
│   ├── canonical-link-test.ts
│   └── types.ts
└── utilities/
    └── screenshot.ts    # Screenshot capture utilities
```

### Available Scripts

```bash
# Development
npm run start:dev        # Run in development mode with tsx
npm run build           # Build the TypeScript project
npm run build:clean     # Clean build artifacts

# Testing
npm run test            # Run test suite
npm run test:coverage   # Run tests with coverage
npm run test:ci         # Run tests in CI mode

# Code Quality
npm run lint            # Lint code with ESLint
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

## 🏗️ Architecture

### Modular Design

- **Separation of Concerns**: Each SEO test is in its own module
- **Extensible**: Easy to add new SEO tests
- **Maintainable**: Clear interfaces and type definitions

### Performance Optimized

- **Shared Browser Instance**: Single Puppeteer browser for all URLs
- **Configurable Concurrency**: Control parallel execution load
- **Efficient Resource Management**: Proper cleanup and memory management

### Clean Output

- **Buffered Logging**: No interleaved output from parallel executions
- **Structured Results**: Clear, organized reporting
- **Multiple Formats**: Console, HTML, and JSON output

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📧 Email: [bjhale@example.com](mailto:bjhale@example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/bjhale/seo-test/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/bjhale/seo-test/discussions)

---

*Built with ❤️ using TypeScript, Puppeteer, and modern web technologies.*
