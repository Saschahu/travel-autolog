# Dependency Health & Security Monitoring Setup (PR18)

**Implementation Date**: 2024-09-20  
**Repository**: Travel AutoLog (Service Tracker for Technicians)  
**Branch**: `ops/dependency-health-pr18`

## Overview

This document outlines the comprehensive dependency health and security monitoring system implemented for the Travel AutoLog project. The system provides automated dependency updates, security vulnerability scanning, and repository guardrails to maintain code quality and security.

## What Was Added

### 1. Dependabot Configuration (`.github/dependabot.yml`)

Automated dependency management with:

- **NPM Ecosystem**: Weekly updates for all npm dependencies
- **GitHub Actions**: Weekly updates for workflow actions
- **Grouping Strategy**:
  - `minor-and-patch`: Groups non-breaking updates together (except heavy libs)
  - `security`: Groups security updates for priority handling
- **Heavy Library Exclusions**: `mapbox-gl`, `exceljs`, `jspdf` get separate PRs
- **Configuration**:
  - 5 PR limit to prevent spam
  - Versioning strategy: `increase` (allows major updates)
  - Auto-labeling: `deps`, `automated`
  - Auto-reviewer assignment

### 2. Security Audit Workflow (`.github/workflows/security-audit.yml`)

Comprehensive security monitoring:

- **Triggers**:
  - Weekly scheduled runs (Mondays 6 AM UTC)
  - PRs affecting `package.json` or `package-lock.json`
  - Manual dispatch
- **Audit Process**:
  - Runs `npm audit --audit-level=high` 
  - Fails on high/critical vulnerabilities
  - Generates summary table with vulnerability counts
  - Uploads detailed audit JSON as artifact
- **Reporting**: Creates GitHub step summary with vulnerability breakdown

### 3. Lockfile Integrity Workflow (`.github/workflows/lockfile-integrity.yml`)

Ensures package-lock.json consistency:

- **Triggers**: PRs affecting dependency files
- **Validation Process**:
  - Verifies lockfile matches package.json
  - Regenerates lockfile and compares with committed version
  - Installs dependencies with `npm ci` (frozen lockfile)
  - Caches node_modules for performance
- **Failure Handling**: Provides clear instructions for fixing drift

### 4. Repository Guardrails

#### PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)
Comprehensive checklist covering:
- Quality checks (typecheck, lint, test, performance budgets, LHCI)
- Security checks (no dangerouslySetInnerHTML, input validation)
- Performance requirements (no heavy libs in initial route)
- Documentation and testing requirements

#### Issue Templates
- **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.md`): Structured bug reporting with environment details
- **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.md`): Feature suggestions with impact assessment

#### Security Policy (`SECURITY.md`)
- Supported versions and vulnerability reporting process
- Links to automated security workflows
- Security best practices for contributors
- Response timeline commitments

#### Code Ownership (`CODEOWNERS`)
- Global ownership for all files
- Extra scrutiny for security/dependency files
- Ensures automated PR reviews

### 5. Dependencies Auto-merge (`.github/workflows/deps-automerge.yml`)

Safe automation for low-risk updates:

- **Eligibility Criteria**:
  - Only patch-level updates
  - Not on `main` branch (safety first)
  - All CI checks must pass
  - Must be from Dependabot with `deps` label
- **Merge Strategy**: Squash merge with descriptive commit message
- **Fallback**: Comments on ineligible PRs explaining why auto-merge didn't apply

## How Updates Flow

### Weekly Dependency Updates

1. **Monday 6 AM UTC**: Dependabot scans for updates
2. **Grouping**: Minor/patch updates grouped (except heavy libs)
3. **PR Creation**: Up to 5 PRs created with labels and reviewer assignment
4. **CI Pipeline**: Each PR triggers:
   - Lockfile integrity check
   - Security audit (if dependency files changed)
   - Existing Android build workflow
5. **Auto-merge**: Patch updates on non-main branches auto-merge if all checks pass
6. **Manual Review**: Major updates and updates on main require manual review

### Security Updates

1. **Detection**: Dependabot creates security update PRs (separate group)
2. **Priority Handling**: Security updates get immediate attention
3. **Audit Verification**: Security audit workflow validates the fix
4. **Manual Review**: Security updates always require manual review (no auto-merge)

### Pull Request Flow

1. **PR Created**: Template ensures comprehensive checklist completion
2. **Automated Checks**: 
   - Lockfile integrity (if deps changed)
   - Security audit (if deps changed)
   - Existing build/test workflows
3. **Code Review**: CODEOWNERS ensures proper review assignment
4. **Merge Decision**: Manual or automated based on criteria

## Operational Procedures

### Temporarily Pausing Dependency Updates

If a dependency is causing issues:

1. **Individual Package**: Add to Dependabot ignore list in `.github/dependabot.yml`:
   ```yaml
   ignore:
     - dependency-name: "problematic-package"
       versions: ["2.x"]
   ```

2. **All Updates**: Comment on Dependabot PR: `@dependabot pause`

3. **Resume**: Comment: `@dependabot unpause`

### Rebasing a Noisy Dependency

For dependencies with frequent updates:

1. **Comment on PR**: `@dependabot rebase`
2. **Recreate PR**: `@dependabot recreate`
3. **Ignore Version**: `@dependabot ignore this major version`

### Handling False Positive Security Alerts

1. **Verify**: Check if vulnerability actually affects your usage
2. **Document**: Add comment in PR explaining why it's safe
3. **Temporary Ignore**: Use `npm audit --audit-level=critical` temporarily
4. **Track**: Create issue to monitor for proper fix

## Playbook: Merging Security PRs Safely

### 1. Initial Assessment
- [ ] Review the CVE details and severity
- [ ] Check if the vulnerability affects our usage patterns
- [ ] Verify the fix doesn't introduce breaking changes

### 2. Testing Protocol
```bash
# Local testing
git checkout security-pr-branch
npm ci
npm run lint
npm run build
npm run verify:local  # Travel AutoLog specific check

# Android build test (if applicable)
npm run android:prep
```

### 3. Security Validation
- [ ] Run security audit: `npm audit`
- [ ] Check for new vulnerabilities introduced
- [ ] Verify the specific CVE is resolved

### 4. Deployment Strategy
- [ ] Deploy to staging/dev environment first
- [ ] Monitor for runtime issues
- [ ] Check mobile app functionality if Capacitor deps affected
- [ ] Verify Mapbox integration if map-related deps updated

### 5. Post-Merge Monitoring
- [ ] Monitor error rates for 24 hours
- [ ] Check mobile app store compatibility
- [ ] Verify all CI workflows pass

## Performance Budget Integration

The PR template includes performance budget checks:

- **Bundle Size**: Monitor impact of dependency updates on bundle size
- **Route Performance**: Ensure no heavy libs added to initial routes
- **Lighthouse CI**: Automated performance regression detection

Implementation note: The specific `pnpm perf:check` command mentioned in the template should be implemented based on project needs.

## Monitoring and Alerts

### GitHub Notifications
- **Security PRs**: Immediately notify via GitHub notifications
- **Failed Audits**: Weekly digest of audit failures
- **Auto-merge Activity**: Summary of automated merges

### Artifact Storage
- Security audit results stored for 30 days
- Historical trend analysis possible via artifact comparison

## Next Steps (Optional Enhancements)

### Renovate Migration
For more advanced dependency management:
- Renovate offers more sophisticated grouping and scheduling
- Better handling of monorepo scenarios
- More flexible auto-merge rules

### SBOM Generation
Software Bill of Materials for compliance:
- Generate SBOM artifacts during build
- Track dependency licenses and vulnerabilities
- Integration with security scanning tools

### Advanced Security Scanning
- CodeQL integration for static analysis
- Snyk or similar for deeper vulnerability analysis
- Container scanning if Docker is added

## Implementation Notes

**Package Manager**: This setup uses npm (not pnpm as originally specified) to match the existing project configuration.

**Heavy Libraries Identified**:
- `mapbox-gl`: Large mapping library, separate PRs prevent overwhelming changes
- `exceljs`: Excel generation library, complex updates need individual attention  
- `jspdf`: PDF generation library, potential breaking changes need careful review

**Android Build Integration**: All dependency updates are validated against the existing Android build workflow to ensure mobile compatibility.

## Troubleshooting

### Common Issues

1. **Lockfile Drift**: Run `npm install` locally and commit the updated lockfile
2. **Security Audit Failures**: Check if vulnerabilities are actually exploitable in your context
3. **Auto-merge Not Working**: Verify PR is patch-level, not on main branch, and all checks pass
4. **Dependabot Not Creating PRs**: Check ignore list and rate limits

### Support Contacts

- **Repository Owner**: @Saschahu
- **Security Issues**: Use private disclosure via GitHub Security tab
- **General Questions**: Create issue with `question` label

---

*This document should be updated as the dependency management system evolves and new requirements emerge.*