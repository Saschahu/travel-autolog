# Changelog

All notable changes to this project will be documented in this file.

## [Security] - 2024-12-27

### Security Fixes

- **Dependency Updates**: Upgraded vulnerable dependencies
  - Upgraded `vite` from 5.4.20 to 7.1.6 (fixes esbuild vulnerability)
  - Upgraded `jspdf` to latest stable version (3.0.3)
  - Added explicit `esbuild` dependency at 0.25.10 (fixes moderate severity vulnerability)
  
- **XLSX Security Isolation**: Created XLSX adapter to mitigate prototype pollution risks
  - Added `src/lib/xlsxAdapter.ts` with dynamic imports and input sanitization
  - Implemented deep cloning and prototype freezing for XLSX operations
  - Updated `useExcelUpload` to use secure XLSX adapter
  - **Note**: XLSX still present but isolated; migration to `exceljs` planned for PR2
  
- **Token Storage Hardening**: Implemented secure storage wrapper
  - Added `src/security/storage.ts` wrapper for token operations
  - Replaced direct `localStorage` token access with validated wrapper functions
  - Added input validation and sanitization for Mapbox tokens
  - Updated components: `LocationMap`, `GPSSettingsComponent`, `GPSMap`, `mapboxToken`

### Infrastructure

- **Package Manager**: Migrated from npm to pnpm for deterministic dependency resolution
- **Build System**: Verified compatibility with upgraded dependencies

### Remaining Security Tasks (for future PRs)

- **PR2**: Complete migration from `xlsx` to `exceljs` for Excel operations
- **PR3**: Implement Content Security Policy (CSP) and migrate tokens to HttpOnly cookies/IndexedDB