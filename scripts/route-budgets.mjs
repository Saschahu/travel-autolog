#!/usr/bin/env node

import { readFileSync, statSync, existsSync } from 'fs';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

const DIST_DIR = './dist';
const MANIFEST_PATH = join(DIST_DIR, '.vite', 'manifest.json');
const CONFIG_PATH = './perf/route-budgets.json';
const OUTPUT_PATH = join(DIST_DIR, 'route-perf-summary.json');

async function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (err) {
    console.warn(`Warning: Could not get size for ${filePath}:`, err.message);
    return 0;
  }
}

async function getGzipSize(filePath) {
  try {
    // For .js files, calculate gzip size by reading and compressing
    const content = readFileSync(filePath);
    const { gzipSync } = await import('zlib');
    return gzipSync(content).length;
  } catch (err) {
    console.warn(`Warning: Could not calculate gzip size for ${filePath}:`, err.message);
    return 0;
  }
}

function findManifestEntry(manifest, targetModule) {
  // Look for entry that matches our target module
  for (const [key, entry] of Object.entries(manifest)) {
    if (key === targetModule || key.includes(targetModule) || 
        (entry.src && entry.src.includes(targetModule))) {
      return entry;
    }
  }
  
  // Fallback: for SPA, most routes will be in the main entry
  return manifest['index.html'];
}

function collectRouteFiles(manifest, entry, visited = new Set()) {
  const files = [];
  
  if (!entry || visited.has(entry.file)) {
    return files;
  }
  
  visited.add(entry.file);
  files.push(entry.file);
  
  // Follow eager imports only (not dynamicImports)
  if (entry.imports) {
    for (const importKey of entry.imports) {
      const importEntry = manifest[importKey];
      if (importEntry) {
        files.push(...collectRouteFiles(manifest, importEntry, visited));
      }
    }
  }
  
  // Include CSS files
  if (entry.css) {
    files.push(...entry.css);
  }
  
  return files;
}

async function analyzeRoute(manifest, routeConfig) {
  const entry = findManifestEntry(manifest, routeConfig.module);
  if (!entry) {
    console.warn(`Warning: Could not find manifest entry for ${routeConfig.module}`);
    return {
      name: routeConfig.name,
      initialBytes: 0,
      initialGzipBytes: 0,
      files: [],
      error: `Module ${routeConfig.module} not found in manifest`
    };
  }
  
  const files = collectRouteFiles(manifest, entry);
  let totalBytes = 0;
  let totalGzipBytes = 0;
  const fileDetails = [];
  
  for (const file of files) {
    const filePath = join(DIST_DIR, file);
    if (existsSync(filePath)) {
      const bytes = await getFileSize(filePath);
      const gzipBytes = await getGzipSize(filePath);
      
      totalBytes += bytes;
      totalGzipBytes += gzipBytes;
      fileDetails.push({ file, bytes, gzipBytes });
    }
  }
  
  return {
    name: routeConfig.name,
    initialBytes: totalBytes,
    initialGzipBytes: totalGzipBytes,
    files: fileDetails
  };
}

async function main() {
  try {
    // Read configuration
    if (!existsSync(CONFIG_PATH)) {
      console.error(`Error: Configuration file not found at ${CONFIG_PATH}`);
      process.exit(1);
    }
    
    if (!existsSync(MANIFEST_PATH)) {
      console.error(`Error: Manifest file not found at ${MANIFEST_PATH}`);
      console.error('Make sure to run "npm run build" first with manifest enabled');
      process.exit(1);
    }
    
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    
    console.log('Analyzing route performance budgets...');
    
    // Analyze each route
    const routes = [];
    const thresholds = {};
    let hasFailures = false;
    
    for (const routeConfig of config.routes) {
      console.log(`Analyzing route: ${routeConfig.name}...`);
      const analysis = await analyzeRoute(manifest, routeConfig);
      routes.push(analysis);
      thresholds[routeConfig.name] = routeConfig.gzipBudget;
      
      // Check if route exceeds budget
      if (analysis.initialGzipBytes > routeConfig.gzipBudget) {
        hasFailures = true;
        console.error(`❌ FAIL: Route "${routeConfig.name}" exceeds budget: ${analysis.initialGzipBytes} bytes > ${routeConfig.gzipBudget} bytes (gzip)`);
        
        // Show heaviest files for this route
        const sortedFiles = analysis.files.sort((a, b) => b.gzipBytes - a.gzipBytes);
        console.error('   Heaviest files:');
        sortedFiles.slice(0, 5).forEach(f => {
          console.error(`   - ${f.file}: ${f.gzipBytes} bytes (gzip)`);
        });
      } else {
        console.log(`✅ PASS: Route "${routeConfig.name}": ${analysis.initialGzipBytes} bytes ≤ ${routeConfig.gzipBudget} bytes (gzip)`);
      }
    }
    
    // Find worst route
    const worstRoute = routes.reduce((worst, route) => 
      route.initialGzipBytes > (worst?.initialGzipBytes || 0) ? route : worst, null);
    
    // Create summary
    const summary = {
      routes,
      thresholdGzipBytes: thresholds,
      worstRoute: worstRoute ? { 
        name: worstRoute.name, 
        initialGzipBytes: worstRoute.initialGzipBytes 
      } : null,
      timestamp: new Date().toISOString()
    };
    
    // Write output
    writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
    console.log(`\nSummary written to: ${OUTPUT_PATH}`);
    
    // Print summary table
    console.log('\n=== ROUTE PERFORMANCE SUMMARY ===');
    console.log('Route       | Gzip Size | Budget   | Status');
    console.log('------------|-----------|----------|-------');
    routes.forEach(route => {
      const budget = thresholds[route.name];
      const status = route.initialGzipBytes <= budget ? 'PASS' : 'FAIL';
      const sizeStr = `${route.initialGzipBytes}`.padStart(9);
      const budgetStr = `${budget}`.padStart(8);
      console.log(`${route.name.padEnd(11)} | ${sizeStr} | ${budgetStr} | ${status}`);
    });
    
    if (hasFailures) {
      console.error('\n❌ Some routes exceed their performance budgets!');
      process.exit(1);
    } else {
      console.log('\n✅ All routes pass their performance budgets!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error analyzing route budgets:', error);
    process.exit(1);
  }
}

main().catch(console.error);