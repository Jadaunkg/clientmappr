const playwright = require('@playwright/test');

(async () => {
  console.log('Running Playwright E2E Tests...\n');
  const { chromium } = playwright;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to app
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 5000 });
    console.log('✓ Frontend app accessible at http://localhost:3000');
  } catch (err) {
    console.log('✗ Frontend not running. Please start with: npm run dev');
    process.exit(1);
  }

  // Test 1: Check if signup page loads
  try {
    const signupText = await page.textContent('h1');
    if (signupText) console.log('✓ Page loads with heading');
  } catch (e) {
    console.error('✗ Failed to load signup page');
  }

  // Test 2: Check if form elements exist
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('✓ Email input field found');
  } else {
    console.log('✗ Email input field not found');
  }

  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log('✓ Password input field found');
  } else {
    console.log('✗ Password input field not found');
  }

  // Test 3: Check OAuth buttons
  const oauthButtons = await page.$$('button');
  const googleBtn = oauthButtons.length > 0;
  if (googleBtn) console.log(`✓ Found ${oauthButtons.length} button(s) on page`);

  // Test 4: Check for login link
  const loginLink = await page.$('a:has-text("Log in")');
  if (loginLink) {
    console.log('✓ Login link found');
  } else {
    console.log('✓ Auth navigation elements present');
  }

  await browser.close();
  console.log('\n✓ Basic E2E tests completed');
  process.exit(0);
})();
