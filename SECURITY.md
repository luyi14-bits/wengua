# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| A 0.5   | ✅ Active          |
| A 0.4   | ❌ EOL             |
| A 0.3   | ❌ EOL             |
| A 0.2   | ❌ EOL             |

## Reporting a Vulnerability

**Do not open a public issue.**

Please report security vulnerabilities via email to the project maintainers.

We aim to acknowledge reports within 72 hours and provide a fix timeline within one week.

## Scope

AskTheOracle is a pure frontend application with zero server-side dependencies. Security concerns are limited to:

- **XSS** — sanitized CSP header in `index.html`
- **Supply chain** — zero npm dependencies by design
- **Data privacy** — no data leaves the browser; no analytics or tracking

## Disclosure Policy

- Vulnerabilities will be disclosed after a fix is released
- Credit will be given to reporters in the release notes (unless anonymity is requested)
