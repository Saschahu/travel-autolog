# Repository Health Check Report

_Generated on 2025-09-12_

This report provides a neutral assessment of the repository's current state, based on automated checks and manual audits.

## 1. Overview

This is a TypeScript/React project built with Vite and Capacitor, intended for time tracking. While the application has a rich feature set, the codebase suffers from significant technical debt and foundational issues that pose a high risk to maintainability, stability, and security.

-   **Critical Platform Issue**: The native Android project is completely missing, making Android builds impossible.
-   **No Testing Framework**: There is no configured test runner, and critical financial logic (overtime calculation) is entirely untested.
-   **Poor Code Quality**: Static analysis revealed 143 issues, with widespread use of `any` types that negate the benefits of TypeScript.
-   **Security Vulnerabilities**: The project has 4 known dependency vulnerabilities, including one rated as "high".
-   **Incomplete Internationalization (i18n)**: Numerous user-facing strings are hardcoded, making localization difficult and inconsistent.
-   **Complex Components**: Key components like `Index.tsx` are very large and handle too many responsibilities, making them difficult to maintain.

## 2. Build Results

The analysis was performed after a clean installation of dependencies.

-   `npm ci`: **SUCCESS** (Exit Code: 0)
    -   *Log*: Packages installed successfully.
-   `npm run lint`: **FAIL** (Exit Code: 1)
    -   *Log*: Found 143 problems (116 errors, 27 warnings).
-   `npm test`: **FAIL** (Command not found)
    -   *Log*: `npm error Missing script: "test"`.
-   `npm run typecheck`: **FAIL** (Command not found)
    -   *Log*: No `typecheck` script exists in `package.json`.
-   **CI Workflow**: **DONE**
    -   *Note*: A new CI workflow 'CI' has been created. It runs `npm ci`, `lint`, and optionally `typecheck`/`test` on every push and pull request.

## 3. Lint/Static Analysis

Out of 143 issues, the following categories are most critical.

| File:Line | Rule | Why it's a problem | Suggested Fix |
| :--- | :--- | :--- | :--- |
| `src/hooks/useGPSTracking.tsx` | `react-hooks/rules-of-hooks` | **FIXED**. The hook `useSupabaseGPS` is now called at the top level of the `useGPSTracking` hook. | - |
| `src/hooks/useOvertimeCalculation.tsx:48:30` (and many others) | `@typescript-eslint/no-explicit-any` | Using `any` disables TypeScript's type checking for that variable, increasing the risk of runtime errors. | Define a proper type/interface for the `day` object instead of using `any`. |
| `src/hooks/useGPSTracking.tsx` | `react-hooks/exhaustive-deps` | **FIXED**. Missing dependencies have been added to all hooks within the file, and the rule is now enforced as an error. | - |
| `src/components/location/LocationMap.tsx:3:1` | `@typescript-eslint/ban-ts-comment` | **FIXED**. Replaced `//@ts-ignore` with `//@ts-expect-error`. | - |
| `src/lib/emailProviders.ts` | `no-case-declarations` | **FIXED**. The `case` block was wrapped in curly braces. | - |

### Top 5 P0 Issue - Mini-Diffs

**1. P0 - `rules-of-hooks` Violation in `useGPSTracking.tsx` (FIXED)**
```diff
--- a/src/hooks/useGPSTracking.tsx
+++ b/src/hooks/useGPSTracking.tsx
- // This logic was removed and refactored by calling useSupabaseGPS at the top level.
```

**2. P0 - `no-explicit-any` in Overtime Calculation**
```diff
--- a/src/hooks/useOvertimeCalculation.tsx
+++ b/src/hooks/useOvertimeCalculation.tsx
@@ -75,7 +75,17 @@
       travelTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
     } else if (job.days && Array.isArray(job.days)) {
-      job.days.forEach((day: any) => {
+      // Define a proper type for day data
+      interface DayData {
+        travelStart?: string;
+        travelEnd?: string;
+        workStart?: string;
+        workEnd?: string;
+        departureStart?: string;
+        departureEnd?: string;
+      }
+
+      job.days.forEach((day: DayData) => {
         if (day.travelStart && day.travelEnd) {
           const startMinutes = parseTime(day.travelStart);
           const endMinutes = parseTime(day.travelEnd);
```

**3. P0 - `exhaustive-deps` in `useGPSTracking.tsx`**
```diff
--- a/src/hooks/useGPSTracking.tsx
+++ b/src/hooks/useGPSTracking.tsx
@@ -93,7 +93,7 @@
     if (isTrackingActive && !todaysSession) {
       loadTodaysSession();
     }
-  }, [isTrackingActive, todaysSession]);
+  }, [isTrackingActive, todaysSession, loadTodaysSession]);
```

**4. P1 - `@ts-ignore` in `LocationMap.tsx`**
```diff
--- a/src/components/location/LocationMap.tsx
+++ b/src/components/location/LocationMap.tsx
@@ -1,5 +1,5 @@
 import React, { useRef, useEffect, useState } from 'react';
-//@ts-ignore
+//@ts-expect-error - mapbox-gl has no up-to-date type definitions
 import mapboxgl from 'mapbox-gl';
 import { useSettingsStore } from '@/state/settingsStore';
 import { useToast } from '@/hooks/use-toast';
```

**5. P1 - `no-case-declarations` in `emailProviders.ts`**
```diff
--- a/src/lib/emailProviders.ts
+++ b/src/lib/emailProviders.ts
@@ -92,8 +92,10 @@
       const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
       window.open(mailtoLink, '_blank');
       break;
-    case 'custom':
-      const customUrl = provider.url.replace('{to}', to).replace('{subject}', subject).replace('{body}', body);
-      window.open(customUrl, '_blank');
+    case 'custom': {
+      const customUrl = provider.url.replace('{to}', to).replace('{subject}', subject).replace('{body}', body);
+      window.open(customUrl, '_blank');
       break;
+    }
     default:
       // Fallback to mailto for unknown or default
       const fallbackLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
```

## 4. Tests

-   **Test Runner**: **DONE**. `vitest` is configured and `npm test` works.
-   **Test Files**: **16 tests** now exist. The new `src/lib/timeMath.ts` and `src/lib/overtime.ts` modules are fully tested. Core application logic and UI components remain untested.
-   **Coverage**: **100%** for `src/lib/timeMath.ts` and `src/lib/overtime.ts`. Overall coverage is low, but critical pure logic is now covered. The full report is at `coverage/lcov-report/index.html`.
-   **Missing Tests**:
    -   The entire overtime calculation logic in `useOvertimeCalculation.tsx` is untested.
    -   Edge cases like overnight work, Sunday surcharges, and behavior around midnight are not verified.
    -   There are no tests for component rendering, user interactions, or state management.

## 5. Permissions / i18n Spot-Check

-   **Android Permissions**:
-   **Finding**: **FIXED**. The native `android` directory has been generated using `npx cap add android`.
-   **Impact**: The project can now be opened and built for the Android platform.
-   **Permissions**: The following permissions have been added to `android/app/src/main/AndroidManifest.xml`:
    -   `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`
    -   `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`
-   **i18n Hardcoded Strings**:
    -   **Finding**: Numerous UI strings are hardcoded in both English and German directly in `.tsx` files.
    -   **Impact**: This makes the application difficult to translate and maintain. It leads to an inconsistent user experience if the app language is changed.
    -   **Examples**:
        -   `src/components/finish/TimeEntriesTable.tsx:14:19`: `<TableHead>Datum</TableHead>`
        -   `src/components/gps/GPSStatus.tsx:12:32`: `<h4 className="font-medium">Aktueller Zustand</h4>`
        -   `src/pages/Auth.tsx:16:29`: `<h1 className="text-2xl font-bold">Travel AutoLog</h1>`

## 6. Dependencies

-   **Security**: `npm audit` reported **4 vulnerabilities (1 high, 3 moderate)**.
    -   **High**: `xlsx` is vulnerable to Prototype Pollution and ReDoS. This is critical if the app handles untrusted Excel files.
    -   **Moderate**: `vite` (via `esbuild`) has a vulnerability that could allow a malicious website to make requests to the dev server.
-   **Outdated Packages**: No check was performed for outdated packages, but the vulnerabilities suggest that dependencies are not being kept up-to-date.

## 7. Known Hotspots

-   `src/hooks/useOvertimeCalculation.tsx`: Critical, untested financial logic.
-   `src/pages/Index.tsx`: A "god component" with over 900 lines, managing state for many different features. It is extremely difficult to read and maintain.
-   `src/lib/fsAccess.ts`: Contains a high number of `any` types.

## 8. Reproduce

To reproduce these findings locally:
1.  `npm ci`
2.  `npm run lint`
3.  `npm test`
4.  `npm audit`
5.  `grep -rE '>([A-Z][a-z]+(\s[a-zA-Z]+){0,5})<' src/ | grep .tsx`
