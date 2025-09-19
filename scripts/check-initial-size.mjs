#!/usr/bin/env node

import { readFileSync, statSync, writeFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import path from 'path';

// Read the build manifest and budget
const manifestPath = 'dist/.vite/manifest.json';
const budgetPath = 'perf/performance-budget.json';

if (!existsSync(manifestPath)) {
  console.error('❌ Build manifest not found. Run `npm run build:ci` first.');
  process.exit(1);
}

if (!existsSync(budgetPath)) {
  console.error('❌ Performance budget not found at:', budgetPath);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

// Find all entry points
const entryPoints = Object.entries(manifest).filter(([key, chunk]) => chunk.isEntry);

if (entryPoints.length === 0) {
  console.error('❌ No entry points found in manifest');
  process.exit(1);
}

console.log(`📊 Found ${entryPoints.length} entry point(s):`);

let totalBytes = 0;
let totalGzipBytes = 0;
const processedFiles = new Set();
const entries = [];

// Process each entry point and collect its dependencies
for (const [key, chunk] of entryPoints) {
  console.log(`\n🔍 Processing entry: ${key}`);
  
  const entryFiles = [];
  const visited = new Set();
  
  // Collect all eager imports (recursive)
  function collectFiles(chunkKey) {
    if (visited.has(chunkKey)) return;
    visited.add(chunkKey);
    
    const chunkData = manifest[chunkKey];
    if (!chunkData) return;
    
    // Add main file
    if (chunkData.file && !processedFiles.has(chunkData.file)) {
      const filePath = path.join('dist', chunkData.file);
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        const content = readFileSync(filePath);
        const gzipSize = gzipSync(content).length;
        
        entryFiles.push({
          file: chunkData.file,
          bytes: stats.size,
          gzipBytes: gzipSize
        });
        
        totalBytes += stats.size;
        totalGzipBytes += gzipSize;
        processedFiles.add(chunkData.file);
        
        console.log(`  ✓ ${chunkData.file}: ${formatBytes(stats.size)} (${formatBytes(gzipSize)} gzipped)`);
      }
    }
    
    // Add CSS files
    if (chunkData.css) {
      for (const cssFile of chunkData.css) {
        if (!processedFiles.has(cssFile)) {
          const filePath = path.join('dist', cssFile);
          if (existsSync(filePath)) {
            const stats = statSync(filePath);
            const content = readFileSync(filePath);
            const gzipSize = gzipSync(content).length;
            
            entryFiles.push({
              file: cssFile,
              bytes: stats.size,
              gzipBytes: gzipSize
            });
            
            totalBytes += stats.size;
            totalGzipBytes += gzipSize;
            processedFiles.add(cssFile);
            
            console.log(`  ✓ ${cssFile}: ${formatBytes(stats.size)} (${formatBytes(gzipSize)} gzipped)`);
          }
        }
      }
    }
    
    // Recursively process eager imports (not dynamic imports)
    if (chunkData.imports) {
      for (const importKey of chunkData.imports) {
        collectFiles(importKey);
      }
    }
  }
  
  collectFiles(key);
  
  entries.push({
    key,
    files: entryFiles,
    bytes: entryFiles.reduce((sum, f) => sum + f.bytes, 0),
    gzipBytes: entryFiles.reduce((sum, f) => sum + f.gzipBytes, 0)
  });
}

console.log(`\n📈 Initial Bundle Analysis:`);
console.log(`Total Size: ${formatBytes(totalBytes)}`);
console.log(`Gzipped Size: ${formatBytes(totalGzipBytes)}`);
console.log(`Budget: ${formatBytes(budget.initialBytes)} (${formatBytes(budget.initialGzipBytes)} gzipped)`);

// Check thresholds
const bytesExceeded = totalBytes > budget.initialBytes;
const gzipExceeded = totalGzipBytes > budget.initialGzipBytes;

if (bytesExceeded || gzipExceeded) {
  console.log(`\n❌ Performance Budget Exceeded:`);
  if (bytesExceeded) {
    const over = totalBytes - budget.initialBytes;
    console.log(`  Raw size: ${formatBytes(totalBytes)} > ${formatBytes(budget.initialBytes)} (+${formatBytes(over)})`);
  }
  if (gzipExceeded) {
    const over = totalGzipBytes - budget.initialGzipBytes;
    console.log(`  Gzipped: ${formatBytes(totalGzipBytes)} > ${formatBytes(budget.initialGzipBytes)} (+${formatBytes(over)})`);
  }
} else {
  console.log(`\n✅ Performance Budget: PASSED`);
}

// Generate performance summary
const summary = {
  initialBytes: totalBytes,
  initialGzipBytes: totalGzipBytes,
  entries,
  timestamp: new Date().toISOString(),
  thresholdBytes: budget.initialBytes,
  thresholdGzipBytes: budget.initialGzipBytes,
  passed: !bytesExceeded && !gzipExceeded
};

writeFileSync('dist/perf-summary.json', JSON.stringify(summary, null, 2));
console.log(`\n📄 Performance summary written to: dist/perf-summary.json`);

// Exit with error code if budget exceeded
if (bytesExceeded || gzipExceeded) {
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}