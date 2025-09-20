import { readFileSync, statSync } from 'fs';
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

function findRouteChunks(distDir, routes) {
  const chunks = glob.sync(join(distDir, 'assets/*.js'));
  const routeChunks = new Map();
  
  // Find chunks by analyzing build output patterns - only include route-specific chunks
  for (const route of routes) {
    const routeName = route.name;
    
    // Look for chunks that specifically belong to this route
    const candidateChunks = chunks.filter(chunk => {
      const chunkName = chunk.toLowerCase();
      return chunkName.includes(`route-${routeName}`) ||
             (routeName === 'home' && chunkName.includes('route-home'));
    });
    
    // If no specific route chunk found, it means the route didn't get its own chunk
    // This indicates an issue with code splitting
    if (candidateChunks.length === 0) {
      console.warn(`Warning: No specific chunk found for route '${routeName}'. Check code splitting.`);
    }
    
    routeChunks.set(routeName, candidateChunks);
  }
  
  return routeChunks;
}

function getSharedChunkDiagnostics(chunks) {
  const sharedFiles = [];
  const chunkCounts = new Map();
  
  for (const [route, routeChunks] of chunks) {
    for (const chunk of routeChunks) {
      const count = chunkCounts.get(chunk) || 0;
      chunkCounts.set(chunk, count + 1);
    }
  }
  
  for (const [chunk, count] of chunkCounts) {
    if (count > 1) {
      const analysis = analyzeChunk(chunk);
      sharedFiles.push({
        file: chunk,
        routes: count,
        gzipSize: analysis.gzipSize
      });
    }
  }
  
  return sharedFiles.sort((a, b) => b.gzipSize - a.gzipSize).slice(0, 5);
}

async function checkRouteBudgets() {
  const distDir = resolve('dist');
  const budgetPath = resolve('perf/route-budgets.json');
  
  let budgets;
  try {
    budgets = JSON.parse(readFileSync(budgetPath, 'utf8'));
  } catch (error) {
    console.error(`${COLORS.red}Error: Could not read budget file: ${budgetPath}${COLORS.reset}`);
    process.exit(1);
  }
  
  const routeChunks = findRouteChunks(distDir, budgets.routes);
  const results = [];
  let allPassed = true;
  
  console.log(`${COLORS.bold}Per-Route Budget Check${COLORS.reset}\n`);
  console.log(`Route      Current    Budget     Status`);
  console.log(`---------  ---------  ---------  ------`);
  
  for (const route of budgets.routes) {
    const chunks = routeChunks.get(route.name) || [];
    let totalGzipSize = 0;
    
    for (const chunk of chunks) {
      const analysis = analyzeChunk(chunk);
      totalGzipSize += analysis.gzipSize;
    }
    
    const budget = route.gzipBudget;
    const passed = totalGzipSize <= budget;
    const status = passed ? `${COLORS.green}PASS${COLORS.reset}` : `${COLORS.red}FAIL${COLORS.reset}`;
    
    if (!passed) allPassed = false;
    
    results.push({
      name: route.name,
      current: totalGzipSize,
      budget,
      passed,
      chunks
    });
    
    console.log(`${route.name.padEnd(10)} ${formatBytes(totalGzipSize).padEnd(10)} ${formatBytes(budget).padEnd(10)} ${status}`);
  }
  
  // Check for shared chunks
  const sharedChunkDiagnostics = getSharedChunkDiagnostics(routeChunks);
  if (sharedChunkDiagnostics.length > 0) {
    console.log(`\n${COLORS.yellow}Shared-chunk diagnostics:${COLORS.reset}`);
    for (const shared of sharedChunkDiagnostics) {
      console.log(`  ${shared.file.split('/').pop()} (${formatBytes(shared.gzipSize)}) used by ${shared.routes} routes`);
    }
  }
  
  console.log(`\n${COLORS.bold}Summary:${COLORS.reset}`);
  const passedCount = results.filter(r => r.passed).length;
  console.log(`${passedCount}/${results.length} routes passed budget checks`);
  
  if (!allPassed) {
    console.log(`\n${COLORS.red}Budget exceeded for some routes. Consider:${COLORS.reset}`);
    console.log('- Moving heavy imports behind user actions (dynamic imports)');
    console.log('- Checking for shared dependencies that should be split');
    console.log('- Using React.lazy() for route-level code splitting');
    process.exit(1);
  }
  
  console.log(`\n${COLORS.green}All route budgets passed!${COLORS.reset}`);
}

checkRouteBudgets().catch(error => {
  console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});