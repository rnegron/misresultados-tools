# misresultados-cli Development Guide

Node.js CLI tool for programmatically accessing health records from misresultados.com.

## Commands

- `pnpm install` - Install dependencies
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm format` - Format all code with Prettier
- `pnpm format:check` - Check code formatting without changes
- `pnpm link --global` - Install CLI globally for testing

## Architecture

### Folder Structure

```
├── bin/resultados.js      # CLI entry point
├── lib/
│   ├── constants.js       # URLs, patterns, configuration constants
│   ├── config.js          # User configuration management
│   ├── http.js            # HTTP client and session management
│   ├── parser.js          # HTML parsing and result display
│   ├── services.js        # Business logic and workflows
│   └── ui.js              # Spinner animations and graceful shutdown
├── tests/
│   ├── unit/              # Unit tests for individual modules
│   ├── integration/       # Integration tests with HTTP mocking
│   └── fixtures/          # Test fixtures with anonymized data
└── package.json           # ESM project with minimal dependencies
```

### Key Design Patterns

**1. Modular Architecture**

- Each module has a single responsibility
- Clean separation between HTTP, parsing, config, and business logic
- All exports use named exports (no default exports)

**2. Constants-Driven Configuration**

- All URLs, form fields, patterns centralized in `constants.js`
- Regex patterns defined once and reused
- Makes the codebase maintainable and testable

**3. Session Management**

- Automatic PHPSESSID cookie extraction and reuse
- Headers properly configured for form submission
- Session cookies passed to PDF downloads

**4. Error Handling**

- Graceful error handling with informative messages
- Process.exit(1) for CLI error scenarios
- HTTP error status validation

## Code style

### ESM Modules

- Use `type: "module"` in package.json
- Import/export syntax throughout
- No CommonJS require() statements

### Dependencies

- **Minimal dependencies policy**: Only `commander`, `picocolors`, `ora`, and `debug`
- No heavy frameworks or HTTP libraries
- Use Node.js built-in `https` module for HTTP requests
- No external HTML parsers - use regex patterns
- `ora` for spinner animations and user feedback
- Debug logging with the `debug` package for troubleshooting
- `prettier` for consistent code formatting (dev dependency only)

### Console Output Styling

- Use `picocolors` for all console output styling
- `ora` spinners for network operations and progress feedback
- Consistent emoji usage: 🔍 🎉 ✅ ❌ ⚠️ 📋 📄 🔗
- Color scheme:
  - Blue: Process indicators and info
  - Green: Success messages and positive values
  - Red: Errors and failures
  - Yellow: Warnings and headers
  - Cyan: Headers and links
  - Gray: Separators and secondary info

### Code Formatting

- **Prettier**: All code is formatted with Prettier using semi-standard style
- **Configuration**: `.prettierrc` with semicolons, single quotes, no trailing commas
- **CI/CD Integration**: Format checking enforced in GitHub Actions
- **Commands**: Use `pnpm format` to format code, `pnpm format:check` to validate

### Function Design

- Pure functions where possible
- Async/await for all asynchronous operations
- Clear parameter validation and error messages
- Functions return structured data objects

### Testing

- Comprehensive test coverage with Vitest
- HTTP mocking with Nock
- Anonymized test fixtures
- Test error conditions and edge cases

## Data Privacy & Security

### Anonymization Requirements

- All real patient data must be scrambled in fixtures
- Use "Del Pueblo" as test patient surname
- Replace real base64 IDs with fake ones
- Change real control/license numbers to test values
- No real dates or personal information in test data

### Security Practices

- User-Agent headers mimic real browser
- Proper session cookie handling
- Validate PDF responses before saving
- No hardcoded credentials or sensitive data

## CLI Patterns

### Command Structure

```bash
misresultados config --apellidos "..." --fecha YYYY-MM-DD
misresultados fetch --control N --licencia N [--apellidos "..."] [--fecha YYYY-MM-DD] [--format json]
misresultados download --control N --licencia N [options] [--output DIR]
```

### Configuration Management

- Store user config in `~/.misresultados-cli/config.json`
- Allow CLI options to override saved config
- Validate date format (YYYY-MM-DD)
- Clear error messages for missing required data

### Output Formats

- Default: Styled table with colors and formatting (Orden, Licencia, Transmitido)
- JSON: Clean JSON output for programmatic use (includes sessionId)
- Curl commands displayed for manual PDF downloads
- Progress indicators with spinners for network operations
- File path confirmation for saved PDFs

## Workflow

### Development Process

1. **Always read existing code first** to understand patterns
2. **Follow the established architecture** - don't create new patterns
3. **Maintain minimal dependencies** - prefer Node.js built-ins
4. **Format code with Prettier** - run `pnpm format` before committing
5. **Test thoroughly** - especially HTTP interactions and error cases
6. **Use anonymized data** in all tests and examples

### Adding New Features

1. Update constants.js if new URLs/patterns needed
2. Add business logic to services.js
3. Update CLI commands in bin/resultados.js
4. Format code with `pnpm format`
5. Add comprehensive tests with mocked HTTP
6. Update README.md with usage examples

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Multi-Node Testing**: Tests on Node.js 18.x, 20.x, and 22.x
2. **Code Formatting**: Enforces Prettier formatting with `pnpm format:check`
3. **Testing**: Runs full test suite with `pnpm test`
4. **Coverage**: Generates coverage reports and uploads to Codecov
5. **Dependency Management**: Uses pnpm for faster, reliable builds


### HTTP Implementation Notes

- Use Node.js built-in `https` module
- Handle both string and binary responses (PDFs)
- Extract and reuse session cookies
- Validate response content types
- Proper error handling for network issues

## Important Reminders

- **Defensive security only** - This tool is for legitimate health record access
- **Data privacy** - Never commit real patient data or credentials
- **ESM modules** - All imports/exports use ESM syntax
- **Minimal footprint** - Prefer built-in Node.js modules over external dependencies
- **Spanish language** - CLI messages and help text in Spanish for target users
- **User responsibility** - Tool includes clear terms about data privacy and cleanup
