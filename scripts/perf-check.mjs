#!/usr/bin/env node

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { createGzip } from 'zlib';

const BUDGETS = {
  raw: 800 * 1024, // 800KB
  gzip: 600 * 1024 // 600KB
};

// Heavy chunks that are loaded on-demand (not part of initial bundle)
const ON_DEMAND_CHUNKS = [
  'maps-', 'excel-', 'pdf-', 'GPSPage-', 'ExportPage-'
];

async function getGzipSize(filePath) {
  return new Promise((resolve, reject) => {
    const gzip = createGzip();
    const stream = createReadStream(filePath);
    let size = 0;
    
    stream.pipe(gzip);
    gzip.on('data', chunk => size += chunk.length);
    gzip.on('end', () => resolve(size));
    gzip.on('error', reject);
  });
}

function isOnDemandChunk(filename) {
  return ON_DEMAND_CHUNKS.some(prefix => filename.startsWith(prefix));
}

async function checkPerformanceBudget() {
  const distPath = 'dist/assets';
  
  try {
    const files = await readdir(distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    console.log(`Found ${jsFiles.length} JS files in ${distPath}`);
    
    let totalRawSize = 0;
    let totalGzipSize = 0;
    let initialRawSize = 0;
    let initialGzipSize = 0;
    const fileStats = [];
    
    console.log('📊 Performance Budget Check\n');
    
    for (const file of jsFiles) {
      const filePath = join(distPath, file);
      const stats = await stat(filePath);
      const gzipSize = await getGzipSize(filePath);
      
      totalRawSize += stats.size;
      totalGzipSize += gzipSize;
      
      const isOnDemand = isOnDemandChunk(file);
      if (!isOnDemand) {
        initialRawSize += stats.size;
        initialGzipSize += gzipSize;
      }
      
      fileStats.push({
        name: file,
        raw: stats.size,
        gzip: gzipSize,
        onDemand: isOnDemand
      });
    }
    
    // Sort by raw size descending
    fileStats.sort((a, b) => b.raw - a.raw);
    
    console.log('📦 Bundle Analysis:');
    fileStats.forEach(file => {
      const rawKB = (file.raw / 1024).toFixed(1);
      const gzipKB = (file.gzip / 1024).toFixed(1);
      const tag = file.onDemand ? ' (on-demand)' : '';
      console.log(`  ${file.name}: ${rawKB} KB raw, ${gzipKB} KB gzip${tag}`);
    });
    
    console.log('\n🎯 Budget Results:');
    const totalRawKB = (totalRawSize / 1024).toFixed(1);
    const totalGzipKB = (totalGzipSize / 1024).toFixed(1);
    const initialRawKB = (initialRawSize / 1024).toFixed(1);
    const initialGzipKB = (initialGzipSize / 1024).toFixed(1);
    
    console.log(`  Total Bundle: ${totalRawKB} KB raw, ${totalGzipKB} KB gzip`);
    console.log(`  Initial Bundle: ${initialRawKB} KB raw, ${initialGzipKB} KB gzip`);
    console.log(`  Budget: ${BUDGETS.raw / 1024} KB raw, ${BUDGETS.gzip / 1024} KB gzip`);
    
    const rawPass = initialRawSize <= BUDGETS.raw;
    const gzipPass = initialGzipSize <= BUDGETS.gzip;
    
    if (rawPass && gzipPass) {
      console.log('\n✅ Performance budget PASSED!');
      console.log('🚀 Heavy features (maps, excel, pdf) load on-demand');
      process.exit(0);
    } else {
      console.log('\n❌ Performance budget FAILED!');
      if (!rawPass) {
        const overageKB = ((initialRawSize - BUDGETS.raw) / 1024).toFixed(1);
        console.log(`  Initial raw size exceeds budget by ${overageKB} KB`);
      }
      if (!gzipPass) {
        const overageKB = ((initialGzipSize - BUDGETS.gzip) / 1024).toFixed(1);
        console.log(`  Initial gzip size exceeds budget by ${overageKB} KB`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error checking performance budget:', error.message);
    process.exit(1);
  }
}

checkPerformanceBudget();