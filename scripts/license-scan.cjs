#!/usr/bin/env node

const checker = require('license-checker-rseidelsohn');
const fs = require('fs');
const path = require('path');

// Read policy configuration
function readPolicy() {
  try {
    const policyPath = path.join(__dirname, '../licenses/policy.json');
    return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  } catch (error) {
    console.error('❌ Failed to read policy.json:', error.message);
    process.exit(1);
  }
}

// Check if a license is allowed according to policy
function checkLicenseCompliance(license, packageName, policy) {
  const packageKey = `${packageName}@*`;
  
  // Check for explicit exceptions first
  if (policy.exceptions[packageKey] || policy.exceptions[packageName]) {
    return { status: 'exception', reason: policy.exceptions[packageKey] || policy.exceptions[packageName] };
  }

  // Normalize license names and handle SPDX expressions
  const normalizedLicense = license?.replace(/[()]/g, '').split(/\s+(AND|OR)\s+/)[0]?.trim();
  
  if (policy.allow.includes(normalizedLicense)) {
    return { status: 'allowed' };
  } else if (policy.review.includes(normalizedLicense)) {
    return { status: 'review' };
  } else if (policy.deny.includes(normalizedLicense)) {
    return { status: 'denied' };
  } else {
    return { status: 'unknown', license: normalizedLicense };
  }
}

// Format table for console output
function formatTable(data) {
  const maxPackageLength = Math.max(20, ...data.map(row => row.package.length));
  const maxLicenseLength = Math.max(15, ...data.map(row => row.license.length));
  const maxStatusLength = 8;
  
  const header = `| Package${' '.repeat(maxPackageLength - 7)} | License${' '.repeat(maxLicenseLength - 7)} | Status   | Issue`;
  const separator = `|${'-'.repeat(maxPackageLength + 2)}|${'-'.repeat(maxLicenseLength + 2)}|----------|------`;
  
  const rows = data.map(row => {
    const pkg = row.package.padEnd(maxPackageLength);
    const license = row.license.padEnd(maxLicenseLength);
    const status = row.status.padEnd(maxStatusLength);
    return `| ${pkg} | ${license} | ${status} | ${row.issue || ''}`;
  });
  
  return [header, separator, ...rows].join('\n');
}

// Main function
async function scanLicenses() {
  const policy = readPolicy();
  
  return new Promise((resolve, reject) => {
    checker.init({
      start: '.',
      production: true,  // Only production dependencies
      excludePrivatePackages: true,
    }, (err, packages) => {
      if (err) {
        reject(err);
        return;
      }

      const results = [];
      const violations = [];
      const unknownLicenses = [];
      const reviewRequired = [];
      const licenseCounts = {};

      Object.keys(packages).forEach(packageName => {
        const pkg = packages[packageName];
        const license = pkg.licenses || 'UNKNOWN';
        
        // Count licenses
        licenseCounts[license] = (licenseCounts[license] || 0) + 1;
        
        const compliance = checkLicenseCompliance(license, packageName, policy);
        
        results.push({
          package: packageName,
          license: license,
          status: compliance.status,
          reason: compliance.reason,
          repository: pkg.repository,
          licenseFile: pkg.licenseFile
        });

        if (compliance.status === 'denied') {
          violations.push({
            package: packageName,
            license: license,
            status: '❌ DENIED',
            issue: 'License not allowed by policy'
          });
        } else if (compliance.status === 'unknown') {
          unknownLicenses.push({
            package: packageName,
            license: license,
            status: '⚠️ UNKNOWN',
            issue: 'License not in policy - review needed'
          });
        } else if (compliance.status === 'review') {
          reviewRequired.push({
            package: packageName,
            license: license,
            status: '🔍 REVIEW',
            issue: 'Requires manual review'
          });
        }
      });

      // Save detailed results to JSON
      const outputPath = path.join(__dirname, '../licenses/licenses.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          total: Object.keys(packages).length,
          allowed: results.filter(r => r.status === 'allowed').length,
          review: reviewRequired.length,
          denied: violations.length,
          unknown: unknownLicenses.length,
          exceptions: results.filter(r => r.status === 'exception').length
        },
        licenseCounts: licenseCounts,
        packages: results
      }, null, 2));

      console.log('📊 License Scan Results');
      console.log('=======================\n');
      
      console.log(`📦 Total packages: ${Object.keys(packages).length}`);
      console.log(`✅ Allowed: ${results.filter(r => r.status === 'allowed').length}`);
      console.log(`🔍 Review required: ${reviewRequired.length}`);
      console.log(`❌ Policy violations: ${violations.length}`);
      console.log(`⚠️  Unknown licenses: ${unknownLicenses.length}`);
      console.log(`📝 Exceptions: ${results.filter(r => r.status === 'exception').length}\n`);

      // Show top 10 licenses by count
      const sortedLicenses = Object.entries(licenseCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      console.log('🏆 Top 10 Licenses by Package Count:');
      sortedLicenses.forEach(([license, count]) => {
        console.log(`   ${license}: ${count}`);
      });
      console.log('');

      // Show violations and issues
      if (violations.length > 0) {
        console.log('❌ POLICY VIOLATIONS:');
        console.log(formatTable(violations));
        console.log('');
      }

      if (unknownLicenses.length > 0) {
        console.log('⚠️  UNKNOWN LICENSES (require review):');
        console.log(formatTable(unknownLicenses));
        console.log('');
      }

      if (reviewRequired.length > 0) {
        console.log('🔍 LICENSES REQUIRING REVIEW:');
        console.log(formatTable(reviewRequired));
        console.log('');
      }

      if (violations.length > 0) {
        console.log('💡 Remediation:');
        console.log('  - Replace packages with denied licenses');
        console.log('  - Add exceptions to licenses/policy.json if temporarily needed');
        console.log('  - Contact package maintainers about license issues\n');
      }

      console.log(`📁 Detailed results saved to: ${outputPath}`);

      // Exit with appropriate code
      if (violations.length > 0) {
        console.log('\n❌ License policy violations found!');
        process.exit(1);
      } else if (unknownLicenses.length > 0) {
        console.log('\n⚠️  Unknown licenses found - manual review required');
        process.exit(0); // Don't fail CI for unknown licenses, but log them
      } else {
        console.log('\n✅ All licenses comply with policy');
        process.exit(0);
      }
    });
  });
}

// Run the scan
if (require.main === module) {
  scanLicenses().catch(error => {
    console.error('❌ License scan failed:', error);
    process.exit(1);
  });
}

module.exports = { scanLicenses, readPolicy, checkLicenseCompliance };