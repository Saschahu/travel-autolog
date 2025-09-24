## Description
Brief description of the changes made in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality) 
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Dependency update
- [ ] Refactoring (no functional changes)

## Quality Checklist
- [ ] **Typecheck/Lint/Test pass** - Code passes all static analysis checks
- [ ] **Performance budgets PASS** - `npm run perf:check` and per-route budgets maintained
- [ ] **LHCI PASS** - Lighthouse CI passes for desktop + mobile
- [ ] **No new `dangerouslySetInnerHTML`** - If used, proper sanitizer is implemented
- [ ] **No heavy libs in initial route** - Large dependencies are lazy-loaded

## Security Checklist
- [ ] No sensitive data (credentials, tokens, keys) exposed
- [ ] Input validation implemented where applicable
- [ ] XSS prevention measures in place
- [ ] Dependencies scanned for known vulnerabilities

## Testing
- [ ] Unit tests added/updated for new functionality
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)
- [ ] Mobile responsiveness verified (if applicable)

## Dependencies
- [ ] New dependencies justified and documented
- [ ] Package versions pinned appropriately
- [ ] License compatibility verified

## Documentation
- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Comments added for complex logic

## Additional Notes
Any additional context, screenshots, or information that would be helpful for reviewers.