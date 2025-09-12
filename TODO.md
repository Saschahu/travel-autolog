# TODO - Repository Improvement Tasks

This document lists prioritized tasks to improve the health, maintainability, and stability of the repository, based on the findings in `REPORT.md`.

## P0: Critical Tasks (Must-Fix)

---

### **Task 1: Add Android Platform to Project**

-   **Title**: Restore Android Platform and Build Capability
-   **Location**: Project Root
-   **Solution Idea**: The native `android` directory is missing. It needs to be regenerated using the Capacitor CLI. Any custom native plugin code for `DirectoryPicker` or `EmailSender` must be restored and placed in the correct location within the new `android` directory.
-   **Effort**: **M** (Medium) - The initial step is easy, but recovering/re-implementing native code could be complex.
-   **Acceptance Criteria**:
    -   The `android` directory exists in the project root.
    -   The command `npx cap sync android` completes successfully.
    -   The command `npx cap open android` successfully opens the project in Android Studio.
    -   The app can be built and run on an Android emulator or device.

---

### **Task 2: Establish a Testing Framework and Test Critical Logic**

-   **Title**: Configure Test Runner and Add Tests for Overtime Calculation
-   **Location**: `package.json`, `src/hooks/useOvertimeCalculation.tsx`
-   **Solution Idea**: Add a testing framework like `vitest`. Configure `package.json` with a `test` script. Create a new test file (`useOvertimeCalculation.test.tsx`) and write unit tests covering the core logic and critical edge cases (overnight, weekends, zero hours, etc.).
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   `npm test` command successfully runs the test suite.
    -   `useOvertimeCalculation.tsx` has at least 80% test coverage.
    -   Tests for overnight work, Sunday surcharges, and zero-hour days pass.
    -   The `formatMinutesToHours` rounding issue is tested and addressed.

---

### **Task 3: Resolve Critical Linting Issues (Rules of Hooks)**

-   **Title**: Fix `react-hooks/rules-of-hooks` Violations
-   **Location**: `src/hooks/useGPSTracking.tsx`
-   **Solution Idea**: Refactor the component to avoid calling hooks inside callbacks. The `addEvent` function from `useSupabaseGPS` should be passed down as a prop or the logic needs to be restructured so that `useSupabaseGPS` is called unconditionally at the top level.
-   **Effort**: **S** (Small)
-   **Acceptance Criteria**:
    -   The `react-hooks/rules-of-hooks` error is resolved.
    -   The GPS event tracking functionality still works as expected.
    -   `npm run lint` no longer reports this specific error.

---

## P1: High-Priority Tasks (Should-Fix)

---

### **Task 4: Eliminate `any` Type Usage**

-   **Title**: Gradually Replace `any` with Strict Types
-   **Location**: Entire codebase, starting with "hotspot" files like `fsAccess.ts` and `useOvertimeCalculation.tsx`.
-   **Solution Idea**: Go through the files identified by the linter and define explicit `interface` or `type` definitions for variables and function parameters currently typed as `any`. Start with the most critical areas like financial calculations and file system access.
-   **Effort**: **L** (Large) - This is a significant, project-wide effort.
-   **Acceptance Criteria**:
    -   The number of `@typescript-eslint/no-explicit-any` errors is reduced by at least 50%.
    -   All data models related to Jobs, Times, and Overtime are strictly typed.
    -   New code is written without using `any`.

---

### **Task 5: Fix `exhaustive-deps` Warnings**

-   **Title**: Resolve All `react-hooks/exhaustive-deps` Linting Warnings
-   **Location**: Entire codebase.
-   **Solution Idea**: Review each warning. In most cases, the missing dependency should be added to the dependency array of the `useEffect` or `useCallback`. For functions, they should be wrapped in `useCallback` or moved inside the effect if only used there.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   `npm run lint` reports zero `react-hooks/exhaustive-deps` warnings.
    -   The UI behavior related to the modified hooks remains correct, with no new bugs introduced.

---

### **Task 6: Address Security Vulnerabilities**

-   **Title**: Mitigate Dependency Vulnerabilities
-   **Location**: `package.json`, `package-lock.json`
-   **Solution Idea**: Run `npm update` to try and update packages to versions that resolve the vulnerabilities reported by `npm audit`. For `xlsx`, if an update is not possible, research alternative libraries or mitigation strategies, especially if the app handles user-provided Excel files.
-   **Effort**: **S** (Small)
-   **Acceptance Criteria**:
    -   `npm audit` reports 0 high-severity vulnerabilities.
    -   The application builds and runs correctly after dependency updates.

---

## P2: Low-Priority Tasks (Nice-to-Have)

---

### **Task 7: Internationalize Hardcoded Strings**

-   **Title**: Replace Hardcoded UI Strings with i18n Keys
-   **Location**: `.tsx` files across the `src/components` and `src/pages` directories.
-   **Solution Idea**: Go through the list of hardcoded strings identified in `REPORT.md`. Replace each string with the `t()` function and add a corresponding key-value pair to the translation files in `src/i18n/index.ts`.
-   **Effort**: **M** (Medium)
-   **Acceptance Criteria**:
    -   All user-visible strings in the UI are translated via the `i18n` framework.
    -   Switching the language in the app correctly changes all UI text.
    -   No hardcoded German or English text remains in the JSX.

---

### **Task 8: Refactor `Index.tsx` God Component**

-   **Title**: Break Down `Index.tsx` into Smaller, Reusable Components
-   **Location**: `src/pages/Index.tsx`
-   **Solution Idea**: The `Index.tsx` component is over 900 lines long. Break it down logically. The "edit job" dialog could become its own component (`EditJobDialog.tsx`). The dashboard logic could be extracted into a `Dashboard.tsx` component. State management related to forms could be handled by a dedicated custom hook.
-   **Effort**: **L** (Large)
-   **Acceptance Criteria**:
    -   The line count of `Index.tsx` is reduced by at least 40%.
    -   At least two new components (e.g., `EditJobDialog`, `Dashboard`) are created.
    -   The application's functionality remains identical after the refactor.
