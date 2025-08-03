# misresultados-helper Development Guide

Firefox WebExtension (Manifest V3) for auto-filling patient forms on misresultados.com and e-labresults.com.

## Commands

- `pnpm install` - Install dependencies
- `pnpm start` - Run extension in Firefox (auto-detect)
- `pnpm run start:dev` - Run in Firefox Developer Edition
- `pnpm format` - Format all code with Prettier
- `pnpm run lint` - Validate extension with web-ext
- `pnpm run build` - Build extension for distribution

## Architecture

### Folder Structure

```
extension/
├── manifest.json          # Manifest V3 configuration
├── popup/                 # Extension popup interface
│   ├── popup.html        # Settings form UI
│   ├── popup.js          # Configuration management
│   └── popup.css         # Popup styles
├── content/              # Content scripts
│   ├── autofill.js      # Main auto-fill logic
│   └── styles.css       # Injected styles
├── icons/               # Extension icons
│   └── icon.svg         # Scalable vector icon
└── package.json         # Dev dependencies and scripts
```

### Key Design Patterns

**1. Firefox-First Approach**

- Uses `browser.*` APIs (Firefox standard)
- Manifest V3 with Firefox-specific settings
- `browser_specific_settings.gecko.id` for Firefox store
- Chrome compatibility planned for future

**2. User-Initiated Actions**

- No automatic form filling
- Shows "Fill Form" button when compatible page detected
- User must click button to trigger auto-fill
- Follows Mozilla review guidelines for user consent

**3. Minimal Permissions**

- Only requests `storage` permission
- Host permissions limited to specific sites
- No background scripts or broad permissions
- Privacy-focused design

**4. Smart Detection**

- Only activates on URLs with control/license parameters
- Validates form fields exist before showing button
- Works identically on misresultados.com and e-labresults.com
- Graceful fallback when forms change

## Implementation Details

### Content Script Logic

The main auto-fill logic in `content/autofill.js`:

```javascript
// 1. Parameter Detection
const urlParams = new URLSearchParams(window.location.search);
const hasControlParam = urlParams.has('controlnumber');
const hasLicenseParam = urlParams.has('lablicense');

// 2. Button Creation (only if parameters present)
if (hasControlParam && hasLicenseParam) {
  showFillButton(); // Creates button near form
}

// 3. Form Filling (on button click)
async function performAutoFill() {
  // Gets data from browser.storage.local
  // Fills form fields with proper zero-padding
  // Shows success/error status
}
```

### Field Mapping

Both sites use identical field names:

```javascript
// Patient name
input[name="patientLastName"]

// Birth date (with zero-padding)
select[name="birthDateDia"]   // "01", "02", ... "31"
select[name="birthDateMes"]   // "01", "02", ... "12" 
select[name="birthDateAnio"]  // "1990", "1991", etc.

// Privacy checkbox (detected by text content)
input[type="checkbox"] // Contains "privacy", "privacidad", "acepto"
```

### Browser Storage

Simple key-value storage using `browser.storage.local`:

```javascript
{
  "patientName": "Juan Pérez",
  "birthDay": "15",
  "birthMonth": "7", 
  "birthYear": "1985"
}
```

### Button Positioning

Button is inserted **before** the form (not inside) to avoid event propagation issues:

```javascript
// Find form container
const form = nameField.closest('form') || nameField.closest('.container');

// Insert button before form (avoids form event conflicts)
form.parentNode.insertBefore(fillButton, form);
```

## Code Style

### Modern JavaScript

- ES6+ features throughout
- Async/await for storage operations
- Arrow functions and destructuring
- Template literals for strings
- No external libraries or frameworks

### DOM Best Practices

- Proper event listeners with `addEventListener`
- Namespace CSS classes (`.mrh-*` prefix)
- Cleanup existing elements before creating new ones
- Check `parentNode` before removing elements
- Use `display: inline-block` over `float` for buttons

### Event Handling

```javascript
// Proper button event handling
fillButton.addEventListener('click', function(event) {
  event.preventDefault();
  event.stopPropagation();
  performAutoFill();
});

// Avoid form conflicts by placing button outside form
form.parentNode.insertBefore(fillButton, form);
```

### UI/UX Guidelines

- Smooth hover states without transforms (prevents jitter)
- Keyboard accessibility with focus indicators
- Color-coded status messages (success/warning/error)
- Non-intrusive button placement
- Clear visual feedback for user actions

## Browser Extension Specifics

### Manifest V3 Structure

```json
{
  "manifest_version": 3,
  "permissions": ["storage"],
  "host_permissions": [
    "*://misresultados.com/*",
    "*://e-labresults.com/*"
  ],
  "content_scripts": [{
    "matches": [
      "*://misresultados.com/soy-un-paciente/*",
      "*://e-labresults.com/im-a-patient/*"
    ],
    "js": ["content/autofill.js"],
    "css": ["content/styles.css"]
  }]
}
```

### Content Script Injection

- Only runs on specific patient form pages
- CSS and JS injected together
- No background scripts needed
- Minimal footprint and fast loading

### Storage API Usage

```javascript
// Save configuration
await browser.storage.local.set({
  patientName: "Juan Pérez",
  birthDay: "15",
  birthMonth: "7",
  birthYear: "1985"
});

// Load configuration
const data = await browser.storage.local.get([
  'patientName', 'birthDay', 'birthMonth', 'birthYear'
]);

// Clear all data
await browser.storage.local.clear();
```

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Run in Firefox (auto-detect)
pnpm start

# Run in specific Firefox version
pnpm run start:dev  # Firefox Developer Edition

# Validate extension
pnpm run lint
```

### Testing Process

1. **Manual Testing**: Primary testing method
2. **Load extension** in Firefox via `pnpm start`
3. **Configure settings** via extension popup
4. **Test on actual sites** with valid control/license URLs
5. **Verify form filling** works correctly
6. **Check error handling** with invalid/missing data

### Code Quality

- **Prettier formatting**: Run `pnpm format` before commits
- **Web-ext validation**: Run `pnpm run lint` to catch issues
- **Mozilla compliance**: Follows extension review guidelines
- **No external dependencies**: Only `prettier` and `web-ext` for dev

## Security & Privacy

### Privacy by Design

- **Local storage only**: Data never leaves user's browser
- **No telemetry**: No analytics, tracking, or external requests
- **Minimal permissions**: Only storage + specific host permissions
- **User control**: Easy to clear data via popup interface

### Mozilla Review Compliance

- **User-initiated actions**: Button click required (no auto-fill)
- **Clear purpose**: Extension behavior is transparent
- **Minimal scope**: Limited to specific pages with parameters
- **No eval()**: Static JavaScript throughout
- **Content Security Policy**: Compliant with CSP requirements

### Data Handling

```javascript
// Only stores essential form data
const userData = {
  patientName: string,    // Patient's full name
  birthDay: string,      // Day (1-31, zero-padded)
  birthMonth: string,    // Month (1-12, zero-padded)  
  birthYear: string      // Year (1900-present)
};

// No sensitive data stored:
// ❌ Control numbers, license numbers
// ❌ Medical information  
// ❌ URLs visited or browsing history
// ❌ Timestamps or usage analytics
```

## Future Roadmap

### Phase 1: Firefox Store (Current)
- Mozilla Add-ons (AMO) submission
- Community feedback and bug fixes
- Documentation improvements

### Phase 2: Chrome Compatibility  
- Add webextension-polyfill for cross-browser APIs
- Test and fix Chrome-specific quirks
- Chrome Web Store submission

### Phase 3: Enhanced Features
- Multiple patient profiles
- Export/import settings
- Advanced form detection
- Keyboard shortcuts

## Release Process

### Building for Distribution

```bash
# Build extension package
pnpm run build

# Output: web-ext-artifacts/misresultados_helper-1.0.0.zip
```

### Firefox Add-ons Submission

1. Run `pnpm run build` to create `.zip` file
2. Upload to [addons.mozilla.org](https://addons.mozilla.org)
3. Mozilla automatically signs during review
4. Extension distributed through official store

### Version Management

```bash
# Update version in manifest.json and package.json
# Follow semantic versioning (1.0.0 -> 1.0.1)
```

## Important Reminders

- **Firefox-first development** - Chrome compatibility is secondary
- **User privacy** - No data collection or external requests
- **Manual testing** - Extension requires real-world validation
- **Mozilla guidelines** - Follow review requirements strictly
- **Spanish documentation** - README in Spanish for target users
- **Defensive security only** - Tool for legitimate form assistance
- **Open source transparency** - All code reviewable by users

## Internationalization (i18n)

### WebExtension i18n API Implementation

The extension uses the standard WebExtension i18n API for localization:

```javascript
// _locales/es/messages.json (default)
{
  "extensionName": { "message": "MisResultados Helper" },
  "fillButton": { "message": "Completar Formulario" },
  "autoFilled": { "message": "Formulario completado" },
  "monthJanuary": { "message": "Enero" }
}

// _locales/en/messages.json  
{
  "extensionName": { "message": "MisResultados Helper" },
  "fillButton": { "message": "Fill Form" },
  "autoFilled": { "message": "Form filled" },
  "monthJanuary": { "message": "January" }
}

// Usage in JavaScript
const buttonText = browser.i18n.getMessage('fillButton');
const statusText = browser.i18n.getMessage('autoFilled');

// Manifest.json uses i18n keys
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "es"
}
```

### Automatic Language Detection

- **Browser Locale**: Extension automatically detects user's browser language
- **Spanish Default**: Falls back to Spanish if locale not supported
- **No User Configuration**: No manual language switching required
- **Supported Languages**: Spanish (es), English (en)

### Localized Content

- **All UI Strings**: Buttons, labels, status messages, error messages
- **Month Names**: Localized month names in date selectors  
- **Extension Metadata**: Name and description in manifest
- **Clean Implementation**: No custom localization code needed

## Troubleshooting

### Common Issues

**Button doesn't appear:**
- Check URL has `controlnumber` and `lablicense` parameters
- Verify patient data is saved in extension popup
- Check browser console for JavaScript errors

**Button doesn't respond to clicks:**
- Ensure button is placed outside form element
- Check for event propagation conflicts
- Verify `addEventListener` vs `onclick` usage

**Form fields not filling:**
- Confirm field selectors match current site HTML
- Check zero-padding for day/month values
- Validate data types and format

**Extension won't load:**
- Run `pnpm run lint` to check for manifest errors
- Verify Firefox version compatibility
- Check console for loading errors