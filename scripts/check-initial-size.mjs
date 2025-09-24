#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import path from 'path';

const DIST_DIR = './dist';
const MANIFEST_PATH = path.join(DIST_DIR, '.vite/manifest.json');
const BUDGET_PATH = './perf/performance-budget.json';
const OUTPUT_PATH = path.join(DIST_DIR, 'perf-summary.json');

// Parse command line arguments
const args = process.argv.slice(2);
const entryFilter = args.find(arg => arg.startsWith('--entry='))?.split('=')[1];
const includeCss = args.includes('--include-css');

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found at ${MANIFEST_PATH}`);
    console.error('Ensure you run the build with manifest: true in vite.config.ts');
    process.exit(1);
  }
  
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    console.error(`❌ Failed to parse manifest: ${error.message}`);
    process.exit(1);
  }
}

function loadBudget() {
  if (!existsSync(BUDGET_PATH)) {
    console.error(`❌ Budget file not found at ${BUDGET_PATH}`);
    process.exit(1);
  }
  
  try {
    return JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));
  } catch (error) {
    console.error(`❌ Failed to parse budget: ${error.message}`);
    process.exit(1);
  }
}

function getFileSize(filePath) {
  const fullPath = path.join(DIST_DIR, filePath);
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${fullPath}`);
    return { bytes: 0, gzipBytes: 0 };
  }
  
  const content = readFileSync(fullPath);
  const bytes = content.length;
  const gzipBytes = gzipSync(content).length;
  
  return { bytes, gzipBytes };
}

function isJavaScriptFile(file) {
  return file.endsWith('.js') || file.endsWith('.mjs');
}

function isCssFile(file) {
  return file.endsWith('.css');
}

function buildInitialGraph(entryChunk, manifest, visited = new Set()) {
  if (visited.has(entryChunk.file)) {
    return { files: [], bytes: 0, gzipBytes: 0 };
  }
  
  visited.add(entryChunk.file);
  
  let files = [];
  let totalBytes = 0;
  let totalGzipBytes = 0;
  
  // Add the entry file itself if it's JS (or CSS if includeCss is true)
  if (isJavaScriptFile(entryChunk.file) || (includeCss && isCssFile(entryChunk.file))) {
    const size = getFileSize(entryChunk.file);
    files.push({
      file: entryChunk.file,
      bytes: size.bytes,
      gzipBytes: size.gzipBytes
    });
    totalBytes += size.bytes;
    totalGzipBytes += size.gzipBytes;
  }
  
  // Add CSS files if includeCss is enabled
  if (includeCss && entryChunk.css) {
    for (const cssFile of entryChunk.css) {
      if (!visited.has(cssFile)) {
        visited.add(cssFile);
        const size = getFileSize(cssFile);
        files.push({
          file: cssFile,
          bytes: size.bytes,
          gzipBytes: size.gzipBytes
        });
        totalBytes += size.bytes;
        totalGzipBytes += size.gzipBytes;
      }
    }
  }
  
  // Traverse static imports (NOT dynamic imports)
  if (entryChunk.imports) {
    for (const importFile of entryChunk.imports) {
      const importChunk = manifest[importFile];
      if (importChunk) {
        const subGraph = buildInitialGraph(importChunk, manifest, visited);
        files.push(...subGraph.files);
        totalBytes += subGraph.bytes;
        totalGzipBytes += subGraph.gzipBytes;
      }
    }
  }
  
  return { files, bytes: totalBytes, gzipBytes: totalGzipBytes };
}

function analyzeEntries(manifest) {
  const entries = [];
  
  // Find all entry chunks
  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk.isEntry && isJavaScriptFile(chunk.file)) {
      // Skip if filtering by specific entry
      if (entryFilter && !key.includes(entryFilter)) {
        continue;
      }
      
      console.log(`📊 Analyzing entry: ${key} -> ${chunk.file}`);
      
      const initialGraph = buildInitialGraph(chunk, manifest);
      
      entries.push({
        name: key,
        initialBytes: initialGraph.bytes,
        initialGzipBytes: initialGraph.gzipBytes,
        files: initialGraph.files
      });
    }
  }
  
  if (entries.length === 0) {
    console.error('❌ No entry chunks found in manifest');
    process.exit(1);
  }
  
  return entries;
}

function findWorstCase(entries) {
  let worstCase = entries[0];
  
  for (const entry of entries) {
    if (entry.initialBytes > worstCase.initialBytes) {
      worstCase = entry;
    }
  }
  
  return {
    entry: worstCase.name,
    initialBytes: worstCase.initialBytes,
    initialGzipBytes: worstCase.initialGzipBytes
  };
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function checkBudget(worstCase, budget) {
  const bytesExceeded = worstCase.initialBytes > budget.initialBytes;
  const gzipExceeded = worstCase.initialGzipBytes > budget.initialGzipBytes;
  
  if (bytesExceeded || gzipExceeded) {
    console.log('\n❌ BUDGET EXCEEDED:');
    console.log(`   Worst case entry: ${worstCase.entry}`);
    
    if (bytesExceeded) {
      console.log(`   Raw bytes: ${formatBytes(worstCase.initialBytes)} > ${formatBytes(budget.initialBytes)} (threshold)`);
      console.log(`   Overage: +${formatBytes(worstCase.initialBytes - budget.initialBytes)}`);
    }
    
    if (gzipExceeded) {
      console.log(`   Gzipped bytes: ${formatBytes(worstCase.initialGzipBytes)} > ${formatBytes(budget.initialGzipBytes)} (threshold)`);
      console.log(`   Overage: +${formatBytes(worstCase.initialGzipBytes - budget.initialGzipBytes)}`);
    }
    
    return false;
  }
  
  console.log('\n✅ BUDGET PASSED:');
  console.log(`   Worst case entry: ${worstCase.entry}`);
  console.log(`   Raw bytes: ${formatBytes(worstCase.initialBytes)} ≤ ${formatBytes(budget.initialBytes)} (threshold)`);
  console.log(`   Gzipped bytes: ${formatBytes(worstCase.initialGzipBytes)} ≤ ${formatBytes(budget.initialGzipBytes)} (threshold)`);
  
  return true;
}

function main() {
  console.log('🚀 Checking initial payload size...');
  
  const manifest = loadManifest();
  const budget = loadBudget();
  
  console.log(`📋 Using budget: ${formatBytes(budget.initialBytes)} raw, ${formatBytes(budget.initialGzipBytes)} gzipped`);
  
  if (entryFilter) {
    console.log(`🎯 Filtering entries by: ${entryFilter}`);
  }
  
  if (includeCss) {
    console.log('🎨 Including CSS files in analysis');
  }
  
  const entries = analyzeEntries(manifest);
  const worstCase = findWorstCase(entries);
  
  // Create output summary
  const summary = {
    entries,
    worstCase,
    timestamp: new Date().toISOString(),
    thresholdBytes: budget.initialBytes,
    thresholdGzipBytes: budget.initialGzipBytes
  };
  
  // Write summary to output file
  writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
  console.log(`📄 Performance summary written to ${OUTPUT_PATH}`);
  
  // Display results
  console.log('\n📊 ENTRY ANALYSIS:');
  for (const entry of entries) {
    console.log(`   ${entry.name}: ${formatBytes(entry.initialBytes)} raw, ${formatBytes(entry.initialGzipBytes)} gzipped (${entry.files.length} files)`);
  }
  
  // Check budget and exit with appropriate code
  const passed = checkBudget(worstCase, budget);
  process.exit(passed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}