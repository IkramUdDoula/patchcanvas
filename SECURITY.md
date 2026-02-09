# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The PatchCanvas team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@patchcanvas.dev**.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include in Your Report

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

After you submit a report, here's what will happen:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
2. **Investigation**: We'll investigate and validate the issue
3. **Updates**: We'll keep you informed about our progress
4. **Fix**: We'll work on a fix and prepare a security advisory
5. **Disclosure**: We'll coordinate with you on the disclosure timeline
6. **Credit**: We'll publicly credit you for the discovery (unless you prefer to remain anonymous)

### Preferred Languages

We prefer all communications to be in English.

## Security Best Practices for Users

### Environment Variables

- Never commit `.env.local` or any file containing secrets to version control
- Use strong, unique values for all secret keys
- Rotate credentials regularly
- Use environment-specific credentials (dev, staging, production)

### Authentication

- Always use HTTPS in production
- Keep Clerk SDK and dependencies up to date
- Review OAuth scopes and only request what's necessary
- Implement proper session management

### API Security

- Never expose API keys in client-side code
- Use API routes as a proxy to protect sensitive operations
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

### Dependencies

- Regularly update dependencies to patch known vulnerabilities
- Use `npm audit` to check for security issues
- Review dependency licenses and security advisories

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

### Docker Security

- Don't run containers as root (we use a non-root user by default)
- Keep base images updated
- Scan images for vulnerabilities
- Use secrets management for sensitive data

```bash
# Scan Docker image for vulnerabilities
docker scan patchcanvas:latest
```

## Security Features

PatchCanvas implements several security features:

### Authentication & Authorization

- OAuth 2.0 via Clerk for secure authentication
- JWT-based session management
- Protected API routes with middleware
- Automatic token refresh

### Data Protection

- HTTPS enforcement in production
- Secure cookie settings
- CSRF protection
- XSS prevention through React's built-in escaping

### API Security

- Rate limiting on API endpoints
- Input validation and sanitization
- Secure headers (CSP, HSTS, etc.)
- API route protection with authentication

### Client-Side Security

- Content Security Policy (CSP)
- Subresource Integrity (SRI) for CDN resources
- Secure localStorage usage
- IndexedDB encryption for sensitive data

## Known Security Considerations

### GitHub Token Storage

- OAuth tokens are managed by Clerk and stored securely
- Tokens are never exposed to client-side JavaScript
- Tokens are scoped to minimum required permissions

### Client-Side Caching

- IndexedDB is used for caching non-sensitive data
- Sensitive data is never cached client-side
- Cache is cleared on logout

### Third-Party Dependencies

We regularly monitor and update dependencies. Key security-related dependencies:

- `@clerk/nextjs` - Authentication
- `@octokit/rest` - GitHub API client
- `next` - Framework with built-in security features

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. Updates will be announced via:

- GitHub Security Advisories
- Release notes
- Email to security mailing list (coming soon)

## Bug Bounty Program

We currently do not have a bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities. We will publicly acknowledge your contribution (with your permission).

## Contact

For security concerns, please email: **security@patchcanvas.dev**

For general questions: **hello@patchcanvas.dev**

---

**Thank you for helping keep PatchCanvas and our users safe!** 🔒
