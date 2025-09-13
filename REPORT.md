# Repository Health Check Report

_Generated on 2025-09-12_

This report provides a neutral assessment of the repository's current state, based on automated checks and manual audits.

## 1. Overview

This is a TypeScript/React project built with Vite and Capacitor, intended for time tracking. While the application has a rich feature set, the codebase suffers from significant technical debt and foundational issues that pose a high risk to maintainability, stability, and security.

-   **Critical Platform Issue**: The native Android project was missing but has now been restored.
-   **Testing Framework**: `vitest` has been added and initial tests for pure logic have been written. However, core application logic and UI components remain untested.
-   **Poor Code Quality**: Static analysis revealed ~131 issues, with widespread use of `any` types that negate the benefits of TypeScript.
-   **Security Vulnerabilities**: The project has a high-severity vulnerability in `xlsx` that cannot be patched via public npm.
-   **Incomplete Internationalization (i18n)**: Numerous user-facing strings are hardcoded.
-   **Automation**: A basic CI workflow and Dependabot for weekly updates have been configured.

## 2. Build Results

The analysis was performed after a clean installation of dependencies.

-   `npm ci`: **SUCCESS**
-   `npm run lint`: **FAIL** (~131 problems)
-   `npm test`: **PASS** (16 tests passed)
-   `npm run typecheck`: **PASS**
-   **CI Workflow**: **DONE**. A new CI workflow 'CI' has been created. It runs `npm ci`, `lint`, `typecheck`, `test`, and `audit` on every push and pull request.
-   **Dependabot**: **DONE**. Dependabot is configured for weekly updates.

## 3. Lint/Static Analysis

Out of ~131 issues, the following categories are most critical.

| File:Line | Rule | Status | Why it's a problem |
| :--- | :--- | :--- | :--- |
| `src/hooks/useGPSTracking.tsx` | `react-hooks/rules-of-hooks` | **FIXED** | Calling hooks inside callbacks leads to unpredictable behavior. |
| `src/hooks/useGPSTracking.tsx` | `react-hooks/exhaustive-deps` | **FIXED** | Missing dependencies can cause stale closures and bugs. |
| Various | `@typescript-eslint/no-explicit-any`| **OPEN** | Using `any` disables TypeScript's type checking. |
| `src/components/location/LocationMap.tsx` | `@typescript-eslint/ban-ts-comment` | **FIXED** | Replaced `//@ts-ignore` with safer `@ts-expect-error`. |

## 4. Tests

-   **Test Runner**: **DONE**. `vitest` is configured and `npm test` works.
-   **Test Files**: **16 tests** now exist. The `src/lib/timeMath.ts` and `src/lib/overtime.ts` modules are fully tested.
-   **Coverage**: **100%** for `src/lib/timeMath.ts` and `src/lib/overtime.ts`. Overall coverage is low. Report at `coverage/lcov-report/index.html`.

## 5. Permissions / i18n Spot-Check

-   **Android Permissions**:
    -   **Finding**: **FIXED**. The native `android` directory has been generated.
    -   **Permissions**: `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` have been added to `AndroidManifest.xml`.
-   **i18n Hardcoded Strings**:
    -   **Finding**: Numerous UI strings are hardcoded.
    -   **Examples**: `<TableHead>Datum</TableHead>` (`TimeEntriesTable.tsx`), `<h1 ...>Travel AutoLog</h1>` (`Auth.tsx`).

## 6. Dependencies

-   **Security**:
    -   **Before**: `npm audit` reported **4 vulnerabilities (1 high, 3 moderate)**. See `reports/npm-audit-before.json`.
    -   **After**: After attempting updates, the audit now reports **1 vulnerability (1 high, 0 moderate)**. The `esbuild` vulnerability was resolved by updating `vite` (before reverting due to peer dependency conflicts). The high-severity `xlsx` vulnerability remains as its patch is not on public npm. See `reports/npm-audit-after.json`.
-   **Outdated Packages**: Many packages are significantly outdated. A full report is in `reports/npm-outdated.txt`. Dependabot is now configured.
    -   **Top 10 Outdated Packages Summary**:
| Package | Current | Wanted | Latest |
| :--- | :--- | :--- | :--- |
| `react` | 18.3.1 | 18.3.1 | 19.1.1 |
| `vite` | 5.4.20 | 5.4.20 | 7.1.5 |
| `tailwindcss` | 3.4.17 | 3.4.17 | 4.1.13 |
| `recharts` | 2.15.4 | 2.15.4 | 3.2.0 |
| `mapbox-gl` | 2.15.0 | 2.15.0 | 3.15.0 |
| `react-router-dom` | 6.30.1 | 6.30.1 | 7.9.1 |
| `react-map-gl` | 7.1.9 | 7.1.9 | 8.0.4 |
| `@vitejs/plugin-react-swc` | 3.11.0 | 3.11.0 | 4.0.1 |
| `react-resizable-panels` | 2.1.9 | 2.1.9 | 3.0.6 |
| `zod` | 3.25.76 | 3.25.76 | 4.1.8 |

## 7. Known Hotspots

-   `src/hooks/useOvertimeCalculation.tsx`: Critical, untested financial logic in the hook itself (though helpers are tested).
-   `src/pages/Index.tsx`: A "god component" with over 900 lines.
-   `src/lib/fsAccess.ts`: Contains a high number of `any` types.

## 8. Reproduce

1.  `npm ci`
2.  `npm run lint`
3.  `npm test -- --coverage`
4.  `npm audit`
5.  `grep -rE '>([A-Z][a-z]+(\s[a-zA-Z]+){0,5})<' src/ | grep .tsx`
