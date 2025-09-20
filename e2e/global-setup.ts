import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Set up network blocking rules
  await context.route('**/*', (route) => {
    const url = route.request().url();
    
    // Allow localhost variants
    const ALLOW = /^(http:\/\/localhost:4173|http:\/\/127\.0\.0\.1:4173|http:\/\/\[::1\]:4173)/;
    
    if (ALLOW.test(url)) {
      return route.continue();
    }
    
    // Block WebSocket connections
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return route.fulfill({ 
        status: 451, 
        contentType: 'text/plain', 
        body: 'WS BLOCKED BY TEST' 
      });
    }
    
    // Block all other external requests
    return route.fulfill({ 
      status: 451, 
      contentType: 'text/plain', 
      body: 'NETWORK BLOCKED BY TEST' 
    });
  });

  await context.close();
  await browser.close();
}

export default globalSetup;