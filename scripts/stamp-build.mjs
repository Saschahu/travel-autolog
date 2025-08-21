import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  
  // Get git SHA
  let sha = 'local';
  try {
    sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn('Could not get git SHA, using "local"');
  }
  
  const mode = process.env.BUILD_TARGET || 'web';
  const buildInfo = {
    version: pkg.version,
    sha,
    target: mode,
    timestamp: new Date().toISOString()
  };
  
  writeFileSync('./src/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log(`Build info stamped: ${mode} v${pkg.version} (${sha})`);
} catch (error) {
  console.error('Error stamping build info:', error);
  // Create fallback build info
  writeFileSync('./src/build-info.json', JSON.stringify({
    version: '0.0.0',
    sha: 'unknown',
    target: 'web',
    timestamp: new Date().toISOString()
  }, null, 2));
}