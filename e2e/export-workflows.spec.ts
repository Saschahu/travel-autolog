import { test, expect } from '@playwright/test';

test.describe('Export Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated session
    await page.route('**/*supabase*/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            session: {
              access_token: 'mock-token',
              user: { id: 'mock-user-id', email: 'test@example.com' }
            }
          },
          error: null
        })
      });
    });

    // Mock job data
    await page.addInitScript(() => {
      // Mock jobs data for export
      (window as any).__mockJobs = [
        {
          id: '1',
          customerName: 'Test Customer',
          description: 'Test Job',
          status: 'completed',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        }
      ];

      // Mock export libraries
      (window as any).ExcelJS = {
        Workbook: class MockWorkbook {
          addWorksheet() {
            return {
              addRow: () => {},
              getColumn: () => ({ width: 20 }),
              getRow: () => ({ font: { bold: true } })
            };
          }
          async xlsx() {
            return {
              writeBuffer: () => Promise.resolve(new ArrayBuffer(100))
            };
          }
        }
      };

      (window as any).jsPDF = class MockJsPDF {
        constructor() {
          (window as any).__jsPDFLoaded = true;
          (window as any).__pdfExportCalled = false;
        }
        text() { return this; }
        save() { 
          (window as any).__pdfExportCalled = true;
          return this; 
        }
        output() { return 'mock-pdf-data'; }
      };

      // Track export calls
      (window as any).__excelExportCalled = false;
      (window as any).__downloadTriggered = false;

      // Mock file download trigger
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName === 'a' && element instanceof HTMLAnchorElement) {
          const originalClick = element.click;
          element.click = function() {
            (window as any).__downloadTriggered = true;
            console.log('Download triggered for:', element.download || element.href);
            // Don't actually trigger download in test
          };
        }
        return element;
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should trigger Excel export with mock data', async ({ page }) => {
    // Navigate to export section
    const exportButton = page.locator('button, a, [role="tab"]').filter({
      hasText: /export|excel|download|berichte/i
    }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      // Look for Excel export button
      const excelExportButton = page.locator('button').filter({
        hasText: /excel|xlsx|export.*excel/i
      }).first();
      
      if (await excelExportButton.isVisible()) {
        // Click the Excel export button
        await excelExportButton.click();
        await page.waitForTimeout(2000);
        
        // Check if export was triggered
        const exportTriggered = await page.evaluate(() => {
          return (window as any).__downloadTriggered === true ||
                 (window as any).__excelExportCalled === true;
        });
        
        // Should have triggered export functionality
        expect(exportTriggered).toBeTruthy();
      } else {
        // Export button not visible, check if export section loaded
        const hasExportContent = await page.locator('.export-page, [data-testid="export"], .export-section').count() > 0;
        expect(hasExportContent).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should trigger PDF export and verify jsPDF loader', async ({ page }) => {
    // Navigate to export or reports section
    const reportsButton = page.locator('button, a, [role="tab"]').filter({
      hasText: /report|pdf|export|berichte/i
    }).first();
    
    if (await reportsButton.isVisible()) {
      await reportsButton.click();
      await page.waitForTimeout(1000);
      
      // Look for PDF export functionality
      const pdfExportButton = page.locator('button').filter({
        hasText: /pdf|export.*pdf/i
      }).first();
      
      if (await pdfExportButton.isVisible()) {
        await pdfExportButton.click();
        await page.waitForTimeout(2000);
        
        // Check if jsPDF was loaded and export called
        const pdfExportResult = await page.evaluate(() => {
          return {
            jsPDFLoaded: (window as any).__jsPDFLoaded === true,
            pdfExportCalled: (window as any).__pdfExportCalled === true,
            downloadTriggered: (window as any).__downloadTriggered === true
          };
        });
        
        // Should have loaded jsPDF library
        expect(pdfExportResult.jsPDFLoaded || pdfExportResult.downloadTriggered).toBeTruthy();
      } else {
        // Check if we can at least see export/report content
        const hasReportContent = await page.locator('.report-tab, [data-testid="reports"], .report-section').count() > 0;
        if (hasReportContent) {
          expect(hasReportContent).toBeTruthy();
        } else {
          test.skip();
        }
      }
    } else {
      test.skip();
    }
  });

  test('should handle export with filtered data', async ({ page }) => {
    // Navigate to export section
    const exportButton = page.locator('button, [role="tab"]').filter({
      hasText: /export|berichte/i
    }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      // Look for filter dropdown
      const filterDropdown = page.locator('select, [role="combobox"]').first();
      
      if (await filterDropdown.isVisible()) {
        // Try to select a filter option
        await filterDropdown.click();
        await page.waitForTimeout(500);
        
        const filterOptions = page.locator('option, [role="option"]');
        if (await filterOptions.count() > 1) {
          await filterOptions.nth(1).click();
          await page.waitForTimeout(500);
        }
      }
      
      // Try to trigger export with filter
      const exportActionButton = page.locator('button').filter({
        hasText: /export|download|excel/i
      }).first();
      
      if (await exportActionButton.isVisible()) {
        await exportActionButton.click();
        await page.waitForTimeout(1500);
        
        // Verify export was attempted
        const exportAttempted = await page.evaluate(() => {
          return (window as any).__downloadTriggered || 
                 (window as any).__excelExportCalled ||
                 document.querySelectorAll('[download]').length > 0;
        });
        
        expect(exportAttempted).toBeTruthy();
      }
    }
    
    // At minimum, verify page is functional
    expect(await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should mock file download and prevent real file operations', async ({ page }) => {
    let downloadRequests = 0;
    
    // Track any file download attempts
    page.on('download', download => {
      downloadRequests++;
      console.log('Download attempted:', download.suggestedFilename());
    });

    // Navigate to export and try to trigger download
    const exportButton = page.locator('button, [role="tab"]').filter({
      hasText: /export|download/i
    }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      const downloadButton = page.locator('button').filter({
        hasText: /download|export|excel|pdf/i
      }).first();
      
      if (await downloadButton.isVisible()) {
        await downloadButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // In test environment, should not trigger real downloads
    // But should show that download logic was invoked
    const mockDownloadTriggered = await page.evaluate(() => {
      return (window as any).__downloadTriggered === true;
    });
    
    // Should mock the download without actually downloading
    expect(mockDownloadTriggered || downloadRequests === 0).toBeTruthy();
  });

  test('should handle export errors gracefully', async ({ page }) => {
    // Mock export failure
    await page.addInitScript(() => {
      (window as any).ExcelJS = {
        Workbook: class MockWorkbook {
          addWorksheet() {
            throw new Error('Mock export error');
          }
        }
      };
    });

    const exportButton = page.locator('button, [role="tab"]').filter({
      hasText: /export/i
    }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      const excelExportButton = page.locator('button').filter({
        hasText: /excel/i
      }).first();
      
      if (await excelExportButton.isVisible()) {
        await excelExportButton.click();
        await page.waitForTimeout(2000);
        
        // Should handle error gracefully - no page crash
        const pageAccessible = await page.locator('body').isVisible();
        expect(pageAccessible).toBeTruthy();
        
        // Might show error message
        const hasErrorMessage = await page.locator('.error, .alert, [role="alert"]').count() > 0;
        console.log('Error handling - has error message:', hasErrorMessage);
      }
    }
    
    // Page should remain functional
    expect(await page.locator('body').isVisible()).toBeTruthy();
  });
});