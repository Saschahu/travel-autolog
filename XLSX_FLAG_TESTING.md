# XLSX Import Flag Feature Testing Guide

## Feature Overview
The XLSX import flag (`VITE_ENABLE_XLSX_IMPORT`) provides security control over Excel file imports, allowing CSV-only or full Excel support based on configuration.

## Environment Variable Configuration

### Disabled State (Default - Security First)
```bash
# .env.local or environment
# Leave empty or set to false
VITE_ENABLE_XLSX_IMPORT=false
```

### Enabled State
```bash
# .env.local or environment
VITE_ENABLE_XLSX_IMPORT=true
```

## Manual Testing Checklist

### ✅ Flag=false (XLSX Disabled)
- [ ] Yellow warning message visible: "Excel import is currently disabled. Only CSV import is available."
- [ ] File input `accept` attribute: `.csv`
- [ ] Supported formats text: "Supported formats: .csv only"
- [ ] Attempting to select XLSX/XLS files should show file dialog filtering
- [ ] Hook blocks XLSX processing with toast error message

### ✅ Flag=true (XLSX Enabled)  
- [ ] No warning message shown
- [ ] File input `accept` attribute: `.xlsx,.xls,.csv`
- [ ] Supported formats text: "Supported formats: .xlsx, .xls"
- [ ] All file types work normally
- [ ] XLSX/XLS files process successfully

## Testing Commands

```bash
# Test disabled state
echo "VITE_ENABLE_XLSX_IMPORT=false" > .env.local
npm run dev

# Test enabled state  
echo "VITE_ENABLE_XLSX_IMPORT=true" > .env.local
npm run dev

# Test default (no variable - should be disabled)
rm .env.local
npm run dev
```

## Code Locations

- **UI Component**: `src/components/export/ExcelUpload.tsx`
- **Hook Logic**: `src/hooks/useExcelUpload.tsx`
- **Translations**: `src/i18n/index.ts`
- **Environment**: `.env.example`, `.env.local`

## Security Notes

- Default state is DISABLED for security
- Must explicitly enable via environment variable
- Multiple layers of protection (UI + Hook + File validation)
- Clear user feedback when disabled