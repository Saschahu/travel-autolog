/**
 * Lighthouse CI Puppeteer script for SPA tab navigation
 * Navigates through different tabs/views in the Travel AutoLog SPA
 * and sets virtual routes for each view to enable distinct URL auditing
 */

// Utility function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (browser, context) => {
  const { url } = context;
  console.log(`🎭 LHCI Puppeteer: Processing ${url}`);
  
  const page = await browser.newPage();
  
  // Set up basic page behavior
  await page.setDefaultNavigationTimeout(30000);
  
  // Block external resources to prevent firewall noise
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const requestUrl = request.url();
    
    // Block external domains but allow localhost
    if (requestUrl.includes('mapbox.com') || 
        requestUrl.includes('supabase.co') || 
        requestUrl.includes('/fonts/') ||
        requestUrl.includes('/analytics/') ||
        (!requestUrl.includes('localhost') && !requestUrl.startsWith('data:') && !requestUrl.startsWith('blob:'))) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  // Navigate to base URL first
  await page.goto('http://localhost:4173/', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  // Wait for React app to initialize
  await page.waitForFunction(() => {
    return document.querySelector('[data-value="dashboard"]') ||
           document.querySelector('header') ||
           document.body.textContent.includes('Travel AutoLog');
  }, { timeout: 15000 });
  
  // Additional wait for app to fully load
  await wait(3000);
  
  // Determine which view to navigate to based on URL
  const urlObj = new URL(url);
  const view = urlObj.searchParams.get('view');
  
  try {
    if (view === 'gps') {
      console.log('🎭 Navigating to GPS/Location tab');
      
      // Click the location/GPS tab
      await page.waitForSelector('[data-value="location"]', { timeout: 10000 });
      await page.click('[data-value="location"]');
      
      // Wait for GPS content to load
      await wait(3000);
      
      // Set virtual route
      await page.evaluate(() => {
        window.history.replaceState({}, '', '/?view=gps');
      });
      
    } else if (view === 'export') {
      console.log('🎭 Navigating to Export tab');
      
      // Click the export tab
      await page.waitForSelector('[data-value="export"]', { timeout: 10000 });
      await page.click('[data-value="export"]');
      
      // Wait for export content to load
      await wait(3000);
      
      // Set virtual route
      await page.evaluate(() => {
        window.history.replaceState({}, '', '/?view=export');
      });
      
    } else if (view === 'settings') {
      console.log('🎭 Navigating to Settings');
      
      try {
        // Wait for and click the user dropdown trigger button
        await page.waitForSelector('button', { timeout: 10000 });
        const buttons = await page.$$('button');
        
        // Find button with user icon (usually the last button in header)
        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click();
        }
        
        // Wait for dropdown menu to appear and click settings
        await wait(1000);
        const menuItems = await page.$$('[role="menuitem"]');
        if (menuItems.length > 0) {
          await menuItems[0].click(); // First item should be settings
        }
        
        // Wait for settings dialog to open
        await wait(2000);
        
      } catch (error) {
        console.log('🎭 Settings navigation fallback - using timeout');
        await wait(3000);
      }
      
      // Set virtual route
      await page.evaluate(() => {
        window.history.replaceState({}, '', '/?view=settings');
      });
      
    } else {
      console.log('🎭 On Home/Dashboard view');
      
      // For home view, ensure we're on the dashboard tab
      try {
        await page.waitForSelector('[data-value="dashboard"]', { timeout: 5000 });
        await page.click('[data-value="dashboard"]');
        await wait(1000);
      } catch (error) {
        console.log('🎭 Dashboard tab not found, staying on current view');
      }
      
      // Set virtual route (clean URL)
      await page.evaluate(() => {
        window.history.replaceState({}, '', '/');
      });
    }
  } catch (error) {
    console.log(`🎭 Navigation error for ${view}:`, error.message);
    // Continue with audit even if navigation partially fails
  }
  
  // Final wait for content to be fully rendered
  await wait(2000);

  console.log(`🎭 LHCI Puppeteer: Ready for audit of ${url}`);
  
  // Return the page for lighthouse to use
  return page;
};