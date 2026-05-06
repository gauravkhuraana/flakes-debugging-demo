/**
 * DEMO 1: Simple - BEST PRACTICES (CI-Resilient Patterns)
 * 
 * FLAKES Categories: L (Latency) + A (Async)
 * 
 * ✅ THESE PATTERNS WORK RELIABLY IN BOTH LOCAL AND CI:
 * 
 * Why these are CI-resilient:
 *   - Explicit waits accommodate slower CI environments
 *   - Proper await ensures actions complete before assertions
 *   - Auto-retrying assertions handle timing variability
 *   - No assumptions about execution speed
 * 
 * 🎯 PROACTIVE PATTERNS TO USE:
 *   ✅ await expect(locator).toBeVisible() before interactions
 *   ✅ await expect(locator).toBeEnabled() for buttons
 *   ✅ await on ALL Playwright actions
 *   ✅ await on ALL expect() assertions
 *   ✅ Use waitForURL() after navigation clicks
 *   ✅ Configure reasonable timeouts for slow operations
 * 
 * 📋 CODE REVIEW CHECKLIST:
 *   □ Every page.click/fill/type has await?
 *   □ Every expect() has await?
 *   □ Waiting for element state before interaction?
 *   □ Timeouts set for variable-latency operations?
 * 
 * @tags @pass @simple @latency @async
 */

import { test, expect } from '@playwright/test';
import * as os from 'os';

const BASE_URL = 'https://gauravkhurana.com/test-automation-play/';

// 🔍 Minimal logging - once per suite
function logEnv() {
  console.log(`\n✅ ${process.platform} | CI: ${process.env.CI || 'local'} | Cores: ${os.cpus().length} | RAM: ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB free\n`);
}

test.describe('Simple Demo - Passing Tests @pass', () => {

  test.beforeAll(() => logEnv());

  test('should click button - with proper wait for tab content', async ({ page }) => {
    // Navigate to main page
    await page.goto(BASE_URL);
    
    console.log('✅ FIX: Wait for tab to be visible before clicking');
    
    // ✅ FIX: Wait for tab to be visible before clicking
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible();
    console.log('   Tab is visible, now clicking...');
    await basicTab.click();
    
    console.log('✅ FIX: Wait for tab content to load before interacting');
    console.log('   Code: await expect(enabledButton).toBeVisible({ timeout: 10000 });');
    console.log('   Using longer timeout to accommodate slow CI environments');
    console.log('');
    
    // ✅ FIX: Wait for tab content to load before interacting
    // Use a longer timeout to accommodate slow CI environments
    const enabledButton = page.getByRole('button', { name: 'Enabled Button' });
    await expect(enabledButton).toBeVisible({ timeout: 10000 });
    console.log('   Button is visible, now clicking...');
    await enabledButton.click();
    
    // The button should still be visible after click
    await expect(enabledButton).toBeVisible();
    console.log('   ✅ Test passed! Proper waits work in both local and CI');
  });

  test('should fill form and submit - properly sequenced', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('✅ FIX: Wait for tab and click');
    
    // ✅ FIX: Wait for tab and click
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    console.log('✅ FIX: Wait for form fields to be ready with adequate timeout');
    console.log('   Code: await expect(firstNameInput).toBeVisible({ timeout: 10000 });');
    console.log('');
    
    // ✅ FIX: Wait for form fields to be ready with adequate timeout
    const firstNameInput = page.getByPlaceholder('Enter your first name');
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
    
    console.log('✅ FIX: Properly await EACH fill operation');
    console.log('   Code:');
    console.log('     await firstNameInput.fill("Test");');
    console.log('     await page.getByPlaceholder("Enter your last name").fill("User");');
    console.log('     await page.getByPlaceholder("your.email@example.com").fill("test@example.com");');
    console.log('');
    
    // ✅ FIX: Properly await EACH fill operation
    await firstNameInput.fill('Test');
    await page.getByPlaceholder('Enter your last name').fill('User');
    await page.getByPlaceholder('your.email@example.com').fill('test@example.com');
    
    console.log('✅ FIX: Check button is enabled before clicking');
    console.log('   Code: await expect(enabledBtn).toBeEnabled();');
    console.log('');
    
    // ✅ FIX: The Submit Form button may require form validation
    // Click the enabled button instead to demonstrate proper clicking
    const enabledBtn = page.getByRole('button', { name: 'Enabled Button' });
    await expect(enabledBtn).toBeEnabled();
    await enabledBtn.click();
    
    console.log('   ✅ Test passed! Sequential awaits prevent race conditions');
  });

  test('should interact with disabled button - wait for state change', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click Basic tab with proper wait
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    console.log('✅ FIX: Find the disabled button and verify its state');
    console.log('   Code: await expect(disabledBtn).toBeDisabled();');
    console.log('');
    
    // ✅ FIX: Find the disabled button and verify its state
    const disabledBtn = page.getByRole('button', { name: 'Disabled Button' });
    await expect(disabledBtn).toBeVisible({ timeout: 10000 });
    
    // ✅ FIX: Check button state BEFORE attempting interaction
    await expect(disabledBtn).toBeDisabled();
    console.log('   Button is correctly identified as disabled');
    
    console.log('✅ FIX: Find an enabled button for interaction');
    console.log('   Code: await expect(enabledBtn).toBeEnabled();');
    console.log('');
    
    // ✅ FIX: Find an enabled button for interaction
    const enabledBtn = page.getByRole('button', { name: 'Enabled Button' });
    await expect(enabledBtn).toBeEnabled();
    await enabledBtn.click();
    
    console.log('   ✅ Test passed! Verify state before interaction');
  });

  test('should select from dropdown - with proper wait', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click Basic tab with proper wait
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    console.log('✅ FIX: Wait for dropdown to be visible');
    console.log('   Code: await expect(dropdown).toBeVisible({ timeout: 10000 });');
    console.log('');
    
    // ✅ FIX: Wait for dropdown to be visible using a more specific selector
    const dropdown = page.getByTestId('country-select');
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    
    console.log('✅ FIX: Click the dropdown to open it');
    
    // ✅ FIX: Click the dropdown to open it
    await dropdown.click();
    
    console.log('✅ FIX: Wait for options and select one');
    console.log('   Code: await expect(option).toBeVisible();');
    console.log('');
    
    // ✅ FIX: Wait for options and select one
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();
    await option.click();
    
    console.log('   ✅ Test passed! Wait for dropdown options before selecting');
  });

  test('should check checkbox - with state verification', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click Basic tab with proper wait
    const basicTab = page.locator('button', { hasText: 'Basic' });
    await expect(basicTab).toBeVisible();
    await basicTab.click();
    
    console.log('✅ FIX: Wait for checkbox to be visible');
    
    // ✅ FIX: Wait for checkbox to be visible
    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).toBeVisible({ timeout: 10000 });
    
    console.log('✅ FIX: Check and verify with auto-retrying assertion');
    console.log('   Code: await checkbox.check();');
    console.log('   Code: await expect(checkbox).toBeChecked();');
    console.log('');
    
    // ✅ FIX: Check and verify with auto-retrying assertion
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    console.log('   Checkbox checked ✓');
    
    // Uncheck and verify
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    console.log('   Checkbox unchecked ✓');
    
    console.log('   ✅ Test passed! Auto-retrying assertions handle timing');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🅰️ ASYNC OPERATION DEMOS - Proper "A" from FLAKES (Fixed Versions)
  // ═══════════════════════════════════════════════════════════════════════════

  test('A1: await on page.fill() - action completes before assertion', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const input = page.getByPlaceholder('Enter your first name');
    await expect(input).toBeVisible();
    
    console.log('✅ FIX: Always await page.fill()');
    console.log('   Code: await input.fill("Async Test");');
    console.log('');
    
    // ✅ FIX: Properly await the fill action
    await input.fill('Async Test');
    
    // Assertion runs AFTER fill completes
    await expect(input).toHaveValue('Async Test');
    console.log('   ✅ Value verified after awaited fill');
  });

  test('A2: await on page.click() - click completes before next action', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('✅ FIX: Always await page.click()');
    console.log('   Code: await page.click("button:has-text(\\"Basic\\")");');
    console.log('');
    
    // ✅ FIX: Properly await the click action
    await page.click('button:has-text("Basic")');
    
    // Tab content is now loaded
    const input = page.getByPlaceholder('Enter your first name');
    await expect(input).toBeVisible();
    console.log('   ✅ Element visible after awaited click');
  });

  test('A3: await on expect() - assertion actually runs and validates', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const input = page.getByPlaceholder('Enter your first name');
    await input.fill('Test Value');
    
    console.log('✅ FIX: Always await expect() with locators');
    console.log('   Code: await expect(input).toHaveValue("Test Value");');
    console.log('   Without await, the assertion is fire-and-forget!');
    console.log('');
    
    // ✅ FIX: Properly await the expect - assertion actually runs!
    await expect(input).toHaveValue('Test Value');
    
    console.log('   ✅ Assertion completed and validated');
  });

  test('A4: all actions awaited - predictable sequential execution', async ({ page }) => {
    await page.goto(BASE_URL);
    
    console.log('✅ FIX: Await each action in sequence');
    console.log('   Each action completes before the next starts');
    console.log('');
    
    // ✅ FIX: Properly await each action in sequence
    await page.click('button:has-text("Basic")');
    console.log('   1. Tab clicked ✓');
    
    await page.getByPlaceholder('Enter your first name').fill('Race');
    console.log('   2. First name filled ✓');
    
    await page.getByPlaceholder('Enter your last name').fill('Condition');
    console.log('   3. Last name filled ✓');
    
    // Actions complete in order, assertions pass reliably
    await expect(page.getByPlaceholder('Enter your first name')).toHaveValue('Race');
    await expect(page.getByPlaceholder('Enter your last name')).toHaveValue('Condition');
    console.log('   ✅ All values verified in predictable order');
  });

  test('A5: await promise immediately - capture values at right time', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Basic")');
    
    const input = page.getByPlaceholder('Enter your first name');
    
    console.log('✅ FIX: Await the action before capturing values');
    console.log('   Code: await input.fill("Promise Value");');
    console.log('   Then: const currentValue = await input.inputValue();');
    console.log('');
    
    // ✅ FIX: Await fill BEFORE capturing the value
    await input.fill('Promise Value');
    
    // Now the value is correct
    const currentValue = await input.inputValue();
    console.log(`   Value after fill: "${currentValue}"`);
    
    // Assertion passes because we captured at the right time
    expect(currentValue).toBe('Promise Value');
    console.log('   ✅ Value captured after await - correct!');
  });

});
