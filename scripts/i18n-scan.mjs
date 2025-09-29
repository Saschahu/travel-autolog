#!/usr/bin/env node

/**
 * Hard-coded String Scanner for i18n
 * 
 * Scans the codebase for hard-coded strings that should be translated.
 * Detects:
 * - String literals in JSX
 * - Console/alert messages that might be user-facing
 * - Potential missing t() calls
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const reportsDir = join(projectRoot, 'reports');

// File patterns to scan
const SCAN_PATTERNS = [
  'src/**/*.tsx',
  'src/**/*.ts'
];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git', 
  'dist',
  'build',
  'coverage',
  '__tests__',
  'test'
];

// File patterns to exclude
const EXCLUDE_FILES = [
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts', 
  '*.spec.tsx',
  '*.d.ts',
  'vite-env.d.ts'
];

// Patterns that are likely user-facing strings
const USER_FACING_STRING_PATTERNS = [
  // JSX text content
  />\s*(['"'][^'"]+['"])\s*</g,
  // alert/confirm calls
  /alert\s*\(\s*(['"'][^'"]+['"])\s*\)/g,
  /confirm\s*\(\s*(['"'][^'"]+['"])\s*\)/g,
  // Error messages
  /throw new Error\s*\(\s*(['"'][^'"]+['"])\s*\)/g,
  // Console messages that might be user-facing
  /console\.(log|warn|error)\s*\(\s*(['"'][^'"]+['"])/g
];

// Strings to ignore (technical/developer-only)
const IGNORE_PATTERNS = [
  /^console\./,
  /^import\s/,
  /^export\s/,
  /className/,
  /data-testid/,
  /aria-/,
  /^https?:\/\//,
  /^\/[a-zA-Z]/,  // URLs/paths
  /^\w+\.\w+$/,   // CSS classes/properties
  /^[A-Z_]+$/,    // Constants
  /^[a-z]+[A-Z]/  // camelCase identifiers
];

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if a file should be excluded
 */
function shouldExcludeFile(filePath) {
  const relativePath = relative(projectRoot, filePath);
  
  // Check directory exclusions
  for (const excludeDir of EXCLUDE_DIRS) {
    if (relativePath.includes(excludeDir)) {
      return true;
    }
  }
  
  // Check file pattern exclusions
  for (const pattern of EXCLUDE_FILES) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    if (regex.test(relativePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all TypeScript/React files in the project
 */
function getSourceFiles(dir = join(projectRoot, 'src')) {
  const files = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (shouldExcludeFile(fullPath)) {
        continue;
      }
      
      if (stat.isDirectory()) {
        files.push(...getSourceFiles(fullPath));
      } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    log(`Error reading directory ${dir}: ${e.message}`, 'red');
  }
  
  return files;
}

/**
 * Check if a string should be ignored
 */
function shouldIgnoreString(str) {
  // Remove quotes
  const cleanStr = str.replace(/^['"]|['"]$/g, '');
  
  // Very short strings
  if (cleanStr.length < 3) {
    return true;
  }
  
  // Only numbers or symbols
  if (/^[\d\s\-_.\/\\:;,!@#$%^&*()+=<>{}[\]|~`]+$/.test(cleanStr)) {
    return true;
  }
  
  // Check ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(cleanStr)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Scan a file for hard-coded strings
 */
function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const relativePath = relative(projectRoot, filePath);
    const issues = [];
    
    // Check if file already uses i18n
    const hasI18n = content.includes('useTranslation') || content.includes('t(');
    
    // Find all string literals
    const stringLiterals = [];
    
    // Match double-quoted strings
    const doubleQuoteMatches = content.matchAll(/"([^"\\\\]|\\\\.)*"/g);
    for (const match of doubleQuoteMatches) {
      stringLiterals.push({
        value: match[0],
        index: match.index,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Match single-quoted strings  
    const singleQuoteMatches = content.matchAll(/'([^'\\\\]|\\\\.)*'/g);
    for (const match of singleQuoteMatches) {
      stringLiterals.push({
        value: match[0],
        index: match.index,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Template literals
    const templateMatches = content.matchAll(/`([^`\\\\]|\\\\.)*`/g);
    for (const match of templateMatches) {
      // Only flag template literals that don't contain ${} expressions
      if (!match[0].includes('${')) {
        stringLiterals.push({
          value: match[0],
          index: match.index,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    // Analyze each string
    for (const literal of stringLiterals) {
      if (shouldIgnoreString(literal.value)) {
        continue;
      }
      
      // Get context around the string
      const lines = content.split('\n');
      const contextLine = lines[literal.line - 1] || '';
      
      // Skip if it's already in a t() call
      if (contextLine.includes('t(') && contextLine.includes(literal.value)) {
        continue;
      }
      
      // Skip imports and technical strings
      if (contextLine.includes('import') || contextLine.includes('from')) {
        continue;
      }
      
      // Check if it looks user-facing
      const isInJSX = contextLine.includes('<') && contextLine.includes('>');
      const isInAlert = contextLine.includes('alert(') || contextLine.includes('confirm(');
      const isInError = contextLine.includes('Error(') || contextLine.includes('throw');
      const isUserFacing = isInJSX || isInAlert || isInError;
      
      if (isUserFacing) {
        issues.push({
          type: 'hard-coded-string',
          severity: hasI18n ? 'error' : 'warning',
          line: literal.line,
          value: literal.value,
          context: contextLine.trim(),
          message: hasI18n 
            ? 'Hard-coded string found in file that uses i18n'
            : 'Potential user-facing string that should be translated'
        });
      }
    }
    
    return {
      filePath: relativePath,
      hasI18n,
      issues,
      totalStrings: stringLiterals.length
    };
    
  } catch (e) {
    log(`Error scanning ${filePath}: ${e.message}`, 'red');
    return null;
  }
}

/**
 * Generate HTML report
 */
function generateReport(results) {
  const totalFiles = results.length;
  const filesWithIssues = results.filter(r => r.issues.length > 0).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const filesUsingI18n = results.filter(r => r.hasI18n).length;
  
  const report = {
    summary: {
      totalFiles,
      filesWithIssues,
      totalIssues,
      filesUsingI18n,
      scanDate: new Date().toISOString()
    },
    results: results.filter(r => r.issues.length > 0)
  };
  
  // Ensure reports directory exists
  try {
    readdirSync(reportsDir);
  } catch {
    // Directory doesn't exist, will be created by writeFileSync
  }
  
  // Write JSON report
  const jsonPath = join(reportsDir, 'i18n-scan.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Main execution
 */
function main() {
  log('🔍 Scanning for hard-coded strings...', 'bold');
  
  const sourceFiles = getSourceFiles();
  log(`Found ${sourceFiles.length} source files to scan`, 'blue');
  
  const results = [];
  let scannedCount = 0;
  
  for (const filePath of sourceFiles) {
    const result = scanFile(filePath);
    if (result) {
      results.push(result);
      scannedCount++;
      
      if (result.issues.length > 0) {
        log(`⚠️  ${result.filePath}: ${result.issues.length} issues`, 'yellow');
      }
    }
    
    // Progress indicator
    if (scannedCount % 10 === 0) {
      log(`Scanned ${scannedCount}/${sourceFiles.length} files...`, 'blue');
    }
  }
  
  const report = generateReport(results);
  
  // Print summary
  log('\n' + '='.repeat(60), 'bold');
  log('HARD-CODED STRING SCAN REPORT', 'bold');
  log('='.repeat(60), 'bold');
  
  log(`\n📊 Summary:`, 'cyan');
  log(`   Total files scanned: ${report.summary.totalFiles}`);
  log(`   Files using i18n: ${report.summary.filesUsingI18n}`);
  log(`   Files with issues: ${report.summary.filesWithIssues}`);
  log(`   Total issues found: ${report.summary.totalIssues}`);
  
  if (report.summary.totalIssues > 0) {
    log(`\n📝 Detailed report saved to: reports/i18n-scan.json`, 'blue');
    
    // Show top issues
    const topFiles = report.results
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 5);
      
    if (topFiles.length > 0) {
      log(`\n🔥 Files with most issues:`, 'yellow');
      for (const file of topFiles) {
        log(`   ${file.filePath}: ${file.issues.length} issues`);
      }
    }
  } else {
    log(`\n✅ No hard-coded strings found!`, 'green');
  }
  
  // Exit code based on issues found
  const errorIssues = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.severity === 'error').length, 0);
    
  if (errorIssues > 0) {
    log(`\n❌ ${errorIssues} critical issues found`, 'red');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();