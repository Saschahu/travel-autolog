#!/usr/bin/env node

import { readFileSync, existsSync, statSync } from 'fs';
import { writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import path from 'path';

/**
 * Bundle size checker for performance budgets
 * Analyzes Vite manifest to calculate initial JS payload size
 */

const MANIFEST_PATH = './dist/.vite/manifest.json';
const BUDGET_PATH = './perf/performance-budget.json';
const OUTPUT_PATH = './dist/perf-summary.json';

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json not found. Run build with manifest: true first.');
    process.exit(1);
  }
  
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function loadBudget() {
  if (!existsSync(BUDGET_PATH)) {
    console.error('❌ performance-budget.json not found.');
    process.exit(1);
  }
  
  return JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));
}

function getFileSize(filePath) {
  const fullPath = path.join('./dist', filePath);
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${fullPath}`);
    return 0;
  }
  return statSync(fullPath).size;
}

function getGzipSize(filePath) {
  const fullPath = path.join('./dist', filePath);
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${fullPath}`);
    return 0;
  }
  const content = readFileSync(fullPath);
  return gzipSync(content).length;
}

function collectInitialChunks(manifest) {
  const visited = new Set();
  const initialChunks = [];
  
  // Find entry points
  const entries = Object.entries(manifest)
    .filter(([_, chunk]) => chunk.isEntry)
    .map(([key, chunk]) => ({ key, chunk }));
  
  if (entries.length === 0) {
    console.error('❌ No entry chunks found in manifest');
    process.exit(1);
  }
  
  function collectChunk(chunkInfo) {
    if (visited.has(chunkInfo.file)) return;
    visited.add(chunkInfo.file);
    
    if (chunkInfo.file.endsWith('.js')) {
      initialChunks.push(chunkInfo.file);
    }
    
    // Recursively collect eager imports (not dynamic imports)
    if (chunkInfo.imports) {
      chunkInfo.imports.forEach(importFile => {
        const importChunk = Object.values(manifest).find(chunk => chunk.file === importFile);
        if (importChunk) {
          collectChunk(importChunk);
        }
      });
    }
  }
  
  // Collect all entry chunks and their eager dependencies
  entries.forEach(({ chunk }) => collectChunk(chunk));
  
  return {
    entries: entries.map(({ key, chunk }) => ({ key, file: chunk.file })),
    chunks: initialChunks
  };
}

function calculateSizes(chunks) {
  let totalBytes = 0;
  let totalGzipBytes = 0;
  
  chunks.forEach(chunkFile => {
    const size = getFileSize(chunkFile);
    const gzipSize = getGzipSize(chunkFile);
    totalBytes += size;
    totalGzipBytes += gzipSize;
    
    console.log(`📦 ${chunkFile}: ${(size / 1024).toFixed(1)}KB (${(gzipSize / 1024).toFixed(1)}KB gzip)`);
  });
  
  return { totalBytes, totalGzipBytes };
}

function main() {
  console.log('🔍 Analyzing initial bundle size...\n');
  
  const manifest = loadManifest();
  const budget = loadBudget();
  
  const { entries, chunks } = collectInitialChunks(manifest);
  const { totalBytes, totalGzipBytes } = calculateSizes(chunks);
  
  console.log(`\n📊 Initial payload summary:`);
  console.log(`   Entries: ${entries.map(e => e.key).join(', ')}`);
  console.log(`   Chunks: ${chunks.length}`);
  console.log(`   Total: ${(totalBytes / 1024).toFixed(1)}KB (${(totalGzipBytes / 1024).toFixed(1)}KB gzip)`);
  
  const summary = {
    initialBytes: totalBytes,
    initialGzipBytes: totalGzipBytes,
    entries: entries,
    chunks: chunks,
    timestamp: new Date().toISOString(),
    thresholdBytes: budget.initialBytes,
    thresholdGzipBytes: budget.initialGzipBytes
  };
  
  // Write summary
  writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Summary written to ${OUTPUT_PATH}`);
  
  // Check budgets
  let failed = false;
  
  if (totalBytes > budget.initialBytes) {
    console.error(`\n❌ BUDGET EXCEEDED: Initial bytes ${totalBytes} > ${budget.initialBytes} threshold`);
    failed = true;
  } else {
    console.log(`\n✅ Initial bytes budget OK: ${totalBytes} <= ${budget.initialBytes}`);
  }
  
  if (totalGzipBytes > budget.initialGzipBytes) {
    console.error(`❌ BUDGET EXCEEDED: Initial gzip bytes ${totalGzipBytes} > ${budget.initialGzipBytes} threshold`);
    failed = true;
  } else {
    console.log(`✅ Initial gzip bytes budget OK: ${totalGzipBytes} <= ${budget.initialGzipBytes}`);
  }
  
  if (failed) {
    console.error('\n💥 Performance budget check FAILED');
    process.exit(1);
  } else {
    console.log('\n🎉 Performance budget check PASSED');
  }
}

main();