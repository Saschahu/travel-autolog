# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions of Travel AutoLog:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Travel AutoLog, please report it responsibly:

### Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately via:

1. **Email**: Contact the repository owner [@Saschahu](https://github.com/Saschahu)
2. **GitHub Security Advisories**: Use the [Security tab](https://github.com/Saschahu/travel-autolog/security) to report vulnerabilities privately

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Reproduction Steps**: Step-by-step instructions to reproduce the issue
- **Proof of Concept**: Code or screenshots demonstrating the vulnerability (if applicable)
- **Suggested Fix**: If you have ideas for how to fix the issue (optional)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Assessment**: Within 5 business days
- **Fix & Disclosure**: Coordinated disclosure after fix is implemented

## Security Features & Monitoring

Travel AutoLog implements several security measures:

### Automated Security Monitoring

- **Weekly Security Audits**: Automated npm audit scans for known vulnerabilities
- **Dependency Updates**: Dependabot monitors and updates dependencies with security patches
- **Pull Request Security Checks**: All PRs undergo security scanning

**Workflow Links:**
- [Security Audit Workflow](.github/workflows/security-audit.yml)
- [Dependabot Configuration](.github/dependabot.yml)

### Application Security

- **Input Sanitization**: All user inputs are validated and sanitized
- **Secure Dependencies**: Regular security audits of third-party packages
- **Content Security**: No unsafe `dangerouslySetInnerHTML` usage without proper sanitization
- **Authentication**: Secure authentication via Supabase
- **Data Protection**: Sensitive data handling follows best practices

### Mobile Security (Android/iOS)

- **Secure Communication**: HTTPS-only communication
- **Local Storage**: Secure handling of locally stored data
- **Permissions**: Minimal required permissions requested

## Security Best Practices for Contributors

When contributing to Travel AutoLog:

1. **Never commit secrets** (API keys, passwords, tokens)
2. **Validate all inputs** from users or external sources  
3. **Use secure dependencies** - check for known vulnerabilities
4. **Follow secure coding practices** - sanitize data, validate permissions
5. **Test security features** thoroughly before submitting PRs

## Acknowledgments

We appreciate the security research community and responsible disclosure of vulnerabilities. Contributors who report valid security issues will be acknowledged (with their permission) in our security documentation.