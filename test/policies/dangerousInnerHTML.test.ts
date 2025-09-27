import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Security policy test: Prevent raw dangerouslySetInnerHTML usage
 * 
 * This test scans the source code to ensure that dangerouslySetInnerHTML
 * is not used without proper sanitization through our secure helpers.
 */

// Whitelist of files that are allowed to use dangerouslySetInnerHTML
// These should be reviewed and use proper sanitization
const ALLOWED_FILES = [
  'src/components/finish/A4Preview.tsx', // Uses controlled CSS injection
  'src/components/ui/chart.tsx', // Recharts internal usage
];

// Pattern to detect dangerouslySetInnerHTML usage
const DANGEROUS_PATTERN =
  /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*[^}]+\}\s*\}/gs;

function matchesDangerousPattern(value: string): boolean {
  return new RegExp(DANGEROUS_PATTERN.source, DANGEROUS_PATTERN.flags).test(value);
}

// Pattern to detect if file imports our sanitizer
const SANITIZER_IMPORT_PATTERN = /(import.*['"].*sanitizer|sanitizeHtml|toSafeHtml)/;

function getAllTsxFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      getAllTsxFiles(fullPath, files);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkFileForDangerousHTML(filePath: string): {
  hasViolation: boolean;
  hasSanitizer: boolean;
  violations: Array<{
    line: number;
    content: string;
  }>;
} {
  const content = readFileSync(filePath, 'utf-8');
  const violations: Array<{ line: number; content: string }> = [];
  const hasSanitizer = SANITIZER_IMPORT_PATTERN.test(content);

  const matches = [...content.matchAll(DANGEROUS_PATTERN)];

  matches.forEach(match => {
    const index = match.index ?? 0;
    const preceding = content.slice(0, index);
    const line = preceding.split('\n').length;
    const snippet = match[0].split('\n')[0]?.trim() ?? match[0].trim();

    violations.push({
      line,
      content: snippet,
    });
  });
  
  return {
    hasViolation: violations.length > 0,
    hasSanitizer,
    violations,
  };
}

describe('Security Policy: dangerouslySetInnerHTML', () => {
  const srcDir = join(process.cwd(), 'src');
  const tsxFiles = getAllTsxFiles(srcDir);

  it('should not have any raw dangerouslySetInnerHTML usage', () => {
    const violations: Array<{
      file: string;
      violations: Array<{ line: number; content: string }>;
      hasSanitizer: boolean;
    }> = [];

    for (const file of tsxFiles) {
      const relativePath = file.replace(process.cwd() + '/', '');
      
      // Skip whitelisted files
      if (ALLOWED_FILES.includes(relativePath)) {
        continue;
      }

      const result = checkFileForDangerousHTML(file);
      
      if (result.hasViolation) {
        violations.push({
          file: relativePath,
          violations: result.violations,
          hasSanitizer: result.hasSanitizer,
        });
      }
    }

    if (violations.length > 0) {
      const errorMessage = [
        '🚨 SECURITY VIOLATION: Raw dangerouslySetInnerHTML usage detected!',
        '',
        'Files with violations:',
        ...violations.map(v => [
          `  📄 ${v.file}`,
          ...v.violations.map(violation => 
            `    Line ${violation.line}: ${violation.content}`
          ),
          v.hasSanitizer 
            ? '    ✅ Has sanitizer import (please use it!)' 
            : '    ❌ No sanitizer import detected',
          '',
        ].join('\n')),
        '',
        '🛡️  SECURITY GUIDANCE:',
        '',
        '1. NEVER use dangerouslySetInnerHTML with unsanitized content',
        '2. Import and use our secure helpers:',
        '   import { sanitizeHtml, toSafeHtml } from "@/security/htmlSanitizer"',
        '3. Example safe usage:',
        '   const safeHtml = await toSafeHtml(userContent);',
        '   <div dangerouslySetInnerHTML={{ __html: safeHtml }} />',
        '',
        '4. If you need to add an exception, add the file to ALLOWED_FILES',
        '   in test/policies/dangerousInnerHTML.test.ts and document why',
        '',
        '5. For CSS injection, use controlled methods like our A4Preview component',
        '',
        '🔒 This check prevents XSS vulnerabilities. Do not bypass it lightly!',
      ].join('\n');

      throw new Error(errorMessage);
    }
  });

  it('should validate that whitelisted files exist and are documented', () => {
    const missingFiles: string[] = [];
    
    for (const allowedFile of ALLOWED_FILES) {
      try {
        const fullPath = join(process.cwd(), allowedFile);
        readFileSync(fullPath, 'utf-8');
      } catch {
        missingFiles.push(allowedFile);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(
        `Whitelisted files not found: ${missingFiles.join(', ')}\n` +
        'Please update ALLOWED_FILES in test/policies/dangerousInnerHTML.test.ts'
      );
    }
  });

  it('should ensure whitelisted files actually use dangerouslySetInnerHTML', () => {
    const unnecessaryWhitelist: string[] = [];
    
    for (const allowedFile of ALLOWED_FILES) {
      const fullPath = join(process.cwd(), allowedFile);
      const result = checkFileForDangerousHTML(fullPath);
      
      if (!result.hasViolation) {
        unnecessaryWhitelist.push(allowedFile);
      }
    }
    
    if (unnecessaryWhitelist.length > 0) {
      console.warn(
        `⚠️  Files in whitelist don't use dangerouslySetInnerHTML: ${unnecessaryWhitelist.join(', ')}\n` +
        'Consider removing them from ALLOWED_FILES'
      );
    }
  });

  it('should count total TSX/TS files scanned', () => {
    expect(tsxFiles.length).toBeGreaterThan(0);
    console.log(`📊 Scanned ${tsxFiles.length} TypeScript/React files for security violations`);
  });

  describe('Whitelist validation', () => {
    ALLOWED_FILES.forEach(allowedFile => {
      it(`should validate security in whitelisted file: ${allowedFile}`, () => {
        const fullPath = join(process.cwd(), allowedFile);
        const result = checkFileForDangerousHTML(fullPath);
        
        // File should exist and have violations (otherwise why is it whitelisted?)
        expect(result.hasViolation).toBe(true);
        
        // Document what we found for security review
        console.log(`🔍 ${allowedFile}:`);
        result.violations.forEach(v => {
          console.log(`  Line ${v.line}: ${v.content}`);
        });
        console.log(`  Sanitizer import: ${result.hasSanitizer ? '✅' : '❌'}`);
      });
    });
  });

  describe('Security patterns', () => {
    it('should detect various dangerouslySetInnerHTML patterns', () => {
      const testCases = [
        'dangerouslySetInnerHTML={{__html: content}}',
        'dangerouslySetInnerHTML={ {__html: content} }',
        'dangerouslySetInnerHTML = {{ __html: content }}',
        '  dangerouslySetInnerHTML={{__html: userInput}}',
      ];

      testCases.forEach(testCase => {
        DANGEROUS_PATTERN.lastIndex = 0;
        expect(matchesDangerousPattern(testCase)).toBe(true);
      });
    });

    it('should not false positive on safe patterns', () => {
      const safeCases = [
        '// dangerouslySetInnerHTML is dangerous',
        'const prop = "dangerouslySetInnerHTML";',
        '"dangerouslySetInnerHTML"',
      ];

      safeCases.forEach(safeCase => {
        // Reset regex state
        expect(matchesDangerousPattern(safeCase)).toBe(false);
      });
    });

    it('should ignore props that only mention __html in strings or comments', () => {
      const innocuousCases = [
        '<Component /* __html should stay in docs */ prop="value" />',
        "const hint = 'render uses __html internally';",
        '{/* eslint-disable-next-line __html */}\n<Element attr={value} />',
      ];

      innocuousCases.forEach(caseText => {
        expect(matchesDangerousPattern(caseText)).toBe(false);
      });
    });

    it('should detect sanitizer imports', () => {
      const importCases = [
        'import { sanitizeHtml } from "@/security/htmlSanitizer"',
        'import { toSafeHtml } from "../security/htmlSanitizer"',
        'const { sanitizeHtml } = await import("./sanitizer")',
      ];

      importCases.forEach(importCase => {
        expect(SANITIZER_IMPORT_PATTERN.test(importCase)).toBe(true);
      });
    });
  });
});