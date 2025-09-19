import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Setting up global E2E test configuration...');
  
  // This setup ensures all tests will have offline network blocking by default
  // The actual network blocking is implemented per-test via the network utility
  console.log('Global offline E2E setup complete');
  
  return () => {
    console.log('Tearing down global E2E test configuration...');
  };
}

export default globalSetup;