import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { gzipSync } from 'zlib';
import { glob } from 'glob';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const GLOBAL_GZIP_BUDGET = 1500000; // 1.5MB - realistic for this feature-rich app

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function analyzeChunk(chunkPath) {
  try {
    const content = readFileSync(chunkPath);
    const gzipped = gzipSync(content);
    return {
      size: content.length,
      gzipSize: gzipped.length
    };
  } catch (error) {
    console.warn(`Warning: Could not analyze chunk ${chunkPath}: ${error.message}`);
    return { size: 0, gzipSize: 0 };
  }
}

async function checkGlobalBudget() {
  const distDir = resolve('dist');
  const chunks = glob.sync(join(distDir, 'assets/*.js'));
  
  let totalGzipSize = 0;
  const chunkAnalysis = [];
  
  console.log(`${COLORS.bold}Global Bundle Budget Check${COLORS.reset}\n`);
  
  for (const chunk of chunks) {
    const analysis = analyzeChunk(chunk);
    totalGzipSize += analysis.gzipSize;
    chunkAnalysis.push({
      name: chunk.split('/').pop(),
      ...analysis
    });
  }
  
  // Sort by gzip size descending
  chunkAnalysis.sort((a, b) => b.gzipSize - a.gzipSize);
  
  console.log('Largest chunks:');
  chunkAnalysis.slice(0, 5).forEach(chunk => {
    console.log(`  ${chunk.name}: ${formatBytes(chunk.gzipSize)} gzipped`);
  });
  
  const passed = totalGzipSize <= GLOBAL_GZIP_BUDGET;
  const status = passed ? `${COLORS.green}PASS${COLORS.reset}` : `${COLORS.red}FAIL${COLORS.reset}`;
  
  console.log(`\nTotal gzipped size: ${formatBytes(totalGzipSize)} / ${formatBytes(GLOBAL_GZIP_BUDGET)} - ${status}`);
  
  if (!passed) {
    console.log(`\n${COLORS.red}Global budget exceeded by ${formatBytes(totalGzipSize - GLOBAL_GZIP_BUDGET)}${COLORS.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${COLORS.green}Global budget passed!${COLORS.reset}`);
}

checkGlobalBudget().catch(error => {
  console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});