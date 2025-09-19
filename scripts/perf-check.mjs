#!/usr/bin/env node

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { createGzip } from 'zlib';

const BUDGETS = {
  raw: 800 * 1024, // 800KB
  gzip: 600 * 1024 // 600KB
};

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

async function checkPerformanceBudget() {
  const distPath = 'dist';
  
  try {
    const files = await readdir(distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    let totalRawSize = 0;
    let totalGzipSize = 0;
    const fileStats = [];
    
    console.log('📊 Performance Budget Check\n');
    
    for (const file of jsFiles) {
      const filePath = join(distPath, file);
      const stats = await stat(filePath);
      const gzipSize = await getGzipSize(filePath);
      
      totalRawSize += stats.size;
      totalGzipSize += gzipSize;
      
      fileStats.push({
        name: file,
        raw: stats.size,
        gzip: gzipSize
      });
    }
    
    // Sort by raw size descending
    fileStats.sort((a, b) => b.raw - a.raw);
    
    console.log('📦 Bundle Analysis:');
    fileStats.forEach(file => {
      const rawKB = (file.raw / 1024).toFixed(1);
      const gzipKB = (file.gzip / 1024).toFixed(1);
      console.log(`  ${file.name}: ${rawKB} KB raw, ${gzipKB} KB gzip`);
    });
    
    console.log('\n🎯 Budget Results:');
    const rawKB = (totalRawSize / 1024).toFixed(1);
    const gzipKB = (totalGzipSize / 1024).toFixed(1);
    
    console.log(`  Total Raw: ${rawKB} KB (budget: ${BUDGETS.raw / 1024} KB)`);
    console.log(`  Total Gzip: ${gzipKB} KB (budget: ${BUDGETS.gzip / 1024} KB)`);
    
    const rawPass = totalRawSize <= BUDGETS.raw;
    const gzipPass = totalGzipSize <= BUDGETS.gzip;
    
    if (rawPass && gzipPass) {
      console.log('\n✅ Performance budget PASSED!');
      process.exit(0);
    } else {
      console.log('\n❌ Performance budget FAILED!');
      if (!rawPass) {
        const overageKB = ((totalRawSize - BUDGETS.raw) / 1024).toFixed(1);
        console.log(`  Raw size exceeds budget by ${overageKB} KB`);
      }
      if (!gzipPass) {
        const overageKB = ((totalGzipSize - BUDGETS.gzip) / 1024).toFixed(1);
        console.log(`  Gzip size exceeds budget by ${overageKB} KB`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error checking performance budget:', error.message);
    process.exit(1);
  }
}

checkPerformanceBudget();