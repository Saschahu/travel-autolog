# TODO - Repository Improvement Tasks

This document lists prioritized tasks to improve the health, maintainability, and stability of the repository, based on the findings in `REPORT.md`.

## P0: Critical Tasks (Must-Fix)

---

### **Task 1: Add Android Platform to Project (DONE)**

-   **Title**: Restore Android Platform and Build Capability
-   **Location**: Project Root
-   **Solution Idea**: The native `android` directory was regenerated using the Capacitor CLI.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   **DONE**: The `android` directory exists in the project root.
    -   **DONE**: The command `npx cap sync android` completes successfully.

---

### **Task 1.1 (Follow-up): Implement Runtime Permission Flow**

-   **Title**: Implement Runtime Permission Flow (UI) via Capacitor Geolocation
-   **Location**: `src/hooks/useGPSTracking.tsx` or a new dedicated hook.
-   **Solution Idea**: Use the `@capacitor/geolocation` `requestPermissions()` method. Before accessing location, check the permission status. If not granted, show a modal or a toast explaining why the permission is needed and provide a button to trigger the native permission prompt.
-   **Effort**: **S** (Small)
-   **Acceptance Criteria**:
    -   The app does not crash if location permissions are denied.
    -   The user is prompted to grant location permissions before GPS tracking starts.

---

### **Task 2: Establish a Testing Framework and Test Critical Logic (DONE)**

-   **Title**: Configure Test Runner and Add Tests for Overtime Calculation
-   **Location**: `package.json`, `src/hooks/useOvertimeCalculation.tsx`
-   **Solution Idea**: `vitest` has been added. Pure helper functions have been extracted to `src/lib/timeMath.ts` and `src/lib/overtime.ts` and are now fully tested.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   **DONE**: `npm test` command successfully runs the test suite.
    -   **DONE**: `src/lib/timeMath.ts` and `src/lib/overtime.ts` have 100% test coverage.
    -   The `useOvertimeCalculation.tsx` hook still needs integration tests.

---

### **Task 3: Resolve Critical Linting Issues (Rules of Hooks) (DONE)**

-   **Title**: Fix `react-hooks/rules-of-hooks` Violations
-   **Location**: `src/hooks/useGPSTracking.tsx`
-   **Solution Idea**: The `useSupabaseGPS` hook is now called at the top level.
-   **Effort**: **S** (Small)
-   **Acceptance Criteria**:
    -   **DONE**: The `react-hooks/rules-of-hooks` error is resolved.
    -   **DONE**: The `exhaustive-deps` warnings in the same file have also been fixed.

---

## P1: High-Priority Tasks (Should-Fix)

---

### **Task 4: Eliminate `any` Type Usage**

-   **Title**: Gradually Replace `any` with Strict Types
-   **Location**: Entire codebase, starting with "hotspot" files like `fsAccess.ts`.
-   **Solution Idea**: Go through the files identified by the linter and define explicit `interface` or `type` definitions for variables and function parameters currently typed as `any`.
-   **Effort**: **L** (Large)
-   **Acceptance Criteria**:
    -   The number of `@typescript-eslint/no-explicit-any` errors is reduced by at least 50%.
    -   All data models related to Jobs, Times, and Overtime are strictly typed.

---

### **Task 5: Fix `exhaustive-deps` Warnings**

-   **Title**: Resolve All `react-hooks/exhaustive-deps` Linting Warnings
-   **Location**: Entire codebase.
-   **Solution Idea**: Review each warning. In most cases, the missing dependency should be added to the dependency array of the `useEffect` or `useCallback`.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   `npm run lint` reports zero `react-hooks/exhaustive-deps` warnings.

---

### **Task 6: Address Security Vulnerabilities (IN PROGRESS)**

-   **Title**: Mitigate Dependency Vulnerabilities
-   **Location**: `package.json`, `package-lock.json`
-   **Solution Idea**: Update packages to versions that resolve vulnerabilities.
-   **Effort**: **S** (Small)
-   **Acceptance Criteria**:
    -   `npm audit` reports 0 high-severity vulnerabilities.
-   **Status**: `vite` update resolved 3 moderate vulnerabilities. The high-severity vulnerability in `xlsx` remains as the patched version is not on public npm.

---

## P2: Low-Priority Tasks (Nice-to-Have)

---

### **Task 7: Internationalize Hardcoded Strings**

-   **Title**: Replace Hardcoded UI Strings with i18n Keys
-   **Location**: `.tsx` files across the `src/components` and `src/pages` directories.
-   **Solution Idea**: Replace each hardcoded string with the `t()` function and add a corresponding key-value pair to the translation files.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   All user-visible strings in the UI are translated via the `i18n` framework.

---

### **Task 8: Refactor `Index.tsx` God Component**

-   **Title**: Break Down `Index.tsx` into Smaller, Reusable Components
-   **Location**: `src/pages/Index.tsx`
-   **Solution Idea**: Break the component down logically. The "edit job" dialog could become its own component (`EditJobDialog.tsx`).
-   **Effort**: **L** (Large)
-   **Acceptance Criteria**:
    -   The line count of `Index.tsx` is reduced by at least 40%.
    -   At least two new components are created.
