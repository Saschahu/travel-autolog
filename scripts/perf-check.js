#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BUDGET_FILE = path.join(__dirname, '..', 'perf', 'performance-budget.json');

function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

function getGzipSize(filePath) {
  try {
    const compressed = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
    return parseInt(compressed.trim());
  } catch (error) {
    console.warn(`Failed to get gzip size for ${filePath}:`, error.message);
    return 0;
  }
}

function analyzeBuild() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ No dist directory found. Run build first.');
    process.exit(1);
  }

  const budget = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
  
  // Find main JS file (largest non-vendor chunk)
  const jsFiles = fs.readdirSync(path.join(DIST_DIR, 'assets'))
    .filter(f => f.endsWith('.js') && f.includes('index-'))
    .map(f => path.join(DIST_DIR, 'assets', f));

  if (jsFiles.length === 0) {
    console.error('❌ No main JS files found in dist/assets');
    process.exit(1);
  }

  // Find the largest JS file (likely the main bundle)
  const mainBundle = jsFiles.reduce((largest, current) => {
    return getFileSize(current) > getFileSize(largest) ? current : largest;
  });

  const rawSize = getFileSize(mainBundle);
  const gzipSize = getGzipSize(mainBundle);

  console.log('\n📊 Performance Analysis');
  console.log('='.repeat(50));
  console.log(`Main bundle: ${path.basename(mainBundle)}`);
  console.log(`Raw size:    ${(rawSize / 1024).toFixed(2)} KB`);
  console.log(`Gzip size:   ${(gzipSize / 1024).toFixed(2)} KB`);
  console.log('');
  console.log('Budget vs Actual:');
  console.log(`Raw:  ${(budget.initialBytes / 1024).toFixed(0)} KB budget vs ${(rawSize / 1024).toFixed(0)} KB actual`);
  console.log(`Gzip: ${(budget.initialGzipBytes / 1024).toFixed(0)} KB budget vs ${(gzipSize / 1024).toFixed(0)} KB actual`);

  const rawPass = rawSize <= budget.initialBytes;
  const gzipPass = gzipSize <= budget.initialGzipBytes;

  console.log('');
  console.log('Results:');
  console.log(`Raw size:  ${rawPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Gzip size: ${gzipPass ? '✅ PASS' : '❌ FAIL'}`);

  if (!rawPass || !gzipPass) {
    console.log('\n❌ Performance budget exceeded!');
    process.exit(1);
  }

  console.log('\n✅ All performance budgets passed!');
}

analyzeBuild();