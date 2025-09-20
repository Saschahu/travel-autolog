# Licensing Policy

This document outlines the licensing policy for the Travel AutoLog project, including allowed, review-required, and denied licenses for third-party dependencies.

## Policy Overview

Our licensing policy is designed to ensure:
- ✅ Compatibility with our project's license terms
- ✅ Minimal legal and compliance risks
- ✅ Ability to distribute and modify the software freely
- ✅ Protection of intellectual property rights

## License Categories

### ✅ Allowed Licenses
These licenses are pre-approved for use in the project:

- **MIT** - Permissive license allowing commercial use
- **MIT*** - MIT license variant
- **BSD-2-Clause** - Simplified BSD license
- **BSD-3-Clause** - New BSD license
- **Apache-2.0** - Apache Software License 2.0
- **ISC** - Internet Software Consortium license
- **CC0-1.0** - Creative Commons Zero (public domain)
- **0BSD** - Zero-Clause BSD (public domain equivalent)
- **Unlicense** - Public domain dedication
- **BlueOak-1.0.0** - Blue Oak Model License
- **Python-2.0** - Python Software Foundation License
- **(MIT OR Apache-2.0)** - Dual license option

### 🔍 Review Required Licenses
These licenses require manual review and approval before use:

- **MPL-2.0** - Mozilla Public License 2.0
- **LGPL-2.1** - GNU Lesser General Public License 2.1
- **LGPL-3.0** - GNU Lesser General Public License 3.0
- **EPL-2.0** - Eclipse Public License 2.0
- **CDDL-1.0** - Common Development and Distribution License

### ❌ Denied Licenses
These licenses are not permitted in the project:

- **AGPL-3.0** - GNU Affero General Public License (copyleft)
- **GPL-3.0** - GNU General Public License 3.0 (copyleft)
- **GPL-2.0** - GNU General Public License 2.0 (copyleft)
- **SSPL-1.0** - Server Side Public License (restrictive)
- **BUSL-1.1** - Business Source License (time-delayed open source)

## Exception Process

If you need to use a package with a license not in the "allowed" category:

### 1. For Review-Required Licenses
1. Create an issue explaining the business need
2. Include alternative options you've considered
3. Wait for legal/compliance team review
4. Once approved, add to `licenses/policy.json` exceptions

### 2. For Denied Licenses
1. **First, seek alternatives** with allowed licenses
2. If no alternatives exist, create a critical business justification
3. Escalate to project leadership for exception consideration
4. If approved (rare), add to `licenses/policy.json` exceptions

### 3. Adding Exceptions
Edit `licenses/policy.json`:

```json
{
  "exceptions": {
    "package-name@version": "Justification and approval reference (issue #123)",
    "another-package@*": "Approved for all versions - see issue #456"
  }
}
```

## Enforcement

### Automated Checks
- 🔄 **CI/CD Pipeline**: Every PR runs license compliance checks
- ⏰ **Weekly Scans**: Scheduled compliance verification
- 📊 **SBOM Generation**: Software Bill of Materials for transparency

### Manual Review Process
1. **Development**: Engineers check licenses before adding dependencies
2. **PR Review**: Reviewers verify compliance during code review
3. **Release**: Final compliance check before each release

## Tools and Commands

### Local Development
```bash
# Check license compliance
node scripts/license-scan.cjs

# Generate SBOM
npm run sbom:json
npm run sbom:xml

# Generate third-party notices
node scripts/third-party-notices.cjs
```

### Understanding Results
- **Exit Code 0**: All licenses comply or are in review status
- **Exit Code 1**: Policy violations found (blocks CI)
- **Warnings**: Unknown licenses (logged but don't block CI)

## Responsibilities

### Developers
- 🔍 Check license compatibility before adding dependencies
- 📝 Update documentation when adding exceptions
- 🔄 Run compliance checks locally before PR submission

### Reviewers
- ✅ Verify SBOM and license compliance in PR checklist
- 🚫 Block PRs with policy violations
- 📋 Ensure proper documentation for any exceptions

### Project Maintainers
- 📊 Review quarterly compliance reports
- 📝 Update policy as needed
- 🔍 Approve license exceptions

## Resources

- **Policy File**: `licenses/policy.json`
- **License Scanner**: `scripts/license-scan.cjs`
- **SBOM Generator**: Uses CycloneDX standard
- **Third-Party Notices**: `licenses/THIRD_PARTY_NOTICES.md`

## Questions and Support

For questions about licensing policy:
1. Check this documentation first
2. Review existing GitHub issues
3. Create a new issue with the `licensing` label
4. Escalate to project maintainers if needed

---

*Last updated: Generated automatically as part of SBOM and License Compliance implementation (PR #19)*