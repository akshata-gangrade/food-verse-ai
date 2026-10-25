const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Ak\\.gemini\\antigravity\\brain\\447df249-ac0a-47b2-8198-ce9f75e4a342\\screenshots';
const BASE_URL = 'http://127.0.0.1:5173';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching Chrome for Food Verse AI Walkthrough...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  try {
    // 1. Landing Page
    console.log('Step 1: Visiting Landing Page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing.png') });
    console.log('✓ Captured 01_landing.png');

    // 2. Login Page
    console.log('Step 2: Visiting Login Page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login.png') });
    console.log('✓ Captured 02_login.png');

    // 3. 1-Click Demo Login
    console.log('Step 3: Performing 1-Click Demo Login...');
    await page.waitForFunction(() => document.querySelectorAll('button').length > 0);
    const clickedText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoB = btns.find((b) => b.innerText.includes('Demo'));
      if (demoB) {
        demoB.click();
        return demoB.innerText;
      }
      return null;
    });
    console.log('Clicked button:', clickedText);

    // Wait for Dashboard to load
    await sleep(3000);
    console.log('Current URL after click:', page.url());
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text snippet:', bodyText.substring(0, 300));
    await page.waitForFunction(() => document.body.innerText.includes('Dashboard') || document.body.innerText.includes('Welcome'), { timeout: 10000 });
    await sleep(1500);

    // 4. Dashboard
    console.log('Step 4: Verifying Dashboard with charts...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard.png') });
    console.log('✓ Captured 03_dashboard.png');

    // 5. Food Recognition & Nutrition
    console.log('Step 5: Testing Food Recognition & Nutrition...');
    await page.goto(`${BASE_URL}/food-analyzer`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    const foodInput = await page.$('input[type="file"]');
    const foodPath = path.resolve(__dirname, 'sample_food.png');
    await foodInput.uploadFile(foodPath);
    await sleep(800);

    // Enter note
    const noteInput = await page.$('input[placeholder*="Homemade"]');
    if (noteInput) {
      await noteInput.type('Organic quinoa salad bowl with avocado');
    }
    await sleep(400);

    // Click Analyze Food button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = btns.find((b) => b.innerText.includes('Analyze Food'));
      if (analyzeBtn) analyzeBtn.click();
    });

    console.log('Waiting for food analysis result...');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('macronutrient ratio'), { timeout: 12000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_food_analyzer.png') });
    console.log('✓ Captured 04_food_analyzer.png');

    // 6. Food Freshness Detection
    console.log('Step 6: Testing Food Freshness Detection...');
    await page.goto(`${BASE_URL}/freshness`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    const freshInput = await page.$('input[type="file"]');
    const producePath = path.resolve(__dirname, 'sample_produce.png');
    await freshInput.uploadFile(producePath);
    await sleep(800);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Evaluate Freshness'));
      if (btn) btn.click();
    });

    console.log('Waiting for freshness result...');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('visual surface observations'), { timeout: 12000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_freshness_check.png') });
    console.log('✓ Captured 05_freshness_check.png');

    // 7. Restaurant Hygiene Monitoring
    console.log('Step 7: Testing Restaurant Hygiene Monitoring...');
    await page.goto(`${BASE_URL}/hygiene`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    const hygieneInput = await page.$('input[type="file"]');
    const kitchenPath = path.resolve(__dirname, 'sample_kitchen.png');
    await hygieneInput.uploadFile(kitchenPath);
    await sleep(800);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Run Hygiene Inspection'));
      if (btn) btn.click();
    });

    console.log('Waiting for hygiene inspection result...');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('visual risk score'), { timeout: 12000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_hygiene_monitor.png') });
    console.log('✓ Captured 06_hygiene_monitor.png');

    // 8. Smart Cooking Assistant
    console.log('Step 8: Testing Cooking Assistant & Guided Timers...');
    await page.goto(`${BASE_URL}/assistant`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    const chatInput = await page.$('input[placeholder*="Ask about cooking"]');
    if (chatInput) {
      await chatInput.type('Please give me a recipe for coconut lime chickpea curry');
    }
    await sleep(400);

    // Click send
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sendBtn = btns[btns.length - 1];
      if (sendBtn) sendBtn.click();
    });

    console.log('Waiting for culinary assistant reply & recipe card...');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('start guided cooking mode'), { timeout: 12000 });
    await sleep(2000);

    // Save recipe first
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.innerText.includes('Save Recipe'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(1000);

    // Open Guided Cooking Mode modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const guidedBtn = btns.find((b) => b.innerText.includes('Start Guided Cooking Mode'));
      if (guidedBtn) guidedBtn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_guided_cooking.png') });
    console.log('✓ Captured 07_guided_cooking.png');

    // Close guided cooking modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[class*="hover:bg-white/10"]');
      if (closeBtn) closeBtn.click();
    });
    await sleep(800);

    // 9. Personalized Meal Planner
    console.log('Step 9: Testing Meal Planner & Allergy Checks...');
    await page.goto(`${BASE_URL}/meal-planner`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Click Generate Meal Plan
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const genBtn = btns.find((b) => b.innerText.includes('Generate Personalized Meal'));
      if (genBtn) genBtn.click();
    });

    console.log('Waiting for meal plan generation...');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('consolidated grocery checklist'), { timeout: 15000 });
    await sleep(2000);

    // Click Day 2 Tab if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const day2 = btns.find((b) => b.innerText.includes('Day 2'));
      if (day2) day2.click();
    });
    await sleep(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_meal_planner.png') });
    console.log('✓ Captured 08_meal_planner.png');

    // 10. Saved Recipes
    console.log('Step 10: Checking Saved Recipes...');
    await page.goto(`${BASE_URL}/recipes`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_saved_recipes.png') });
    console.log('✓ Captured 09_saved_recipes.png');

    // 11. History
    console.log('Step 11: Checking Analysis History...');
    await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_history.png') });
    console.log('✓ Captured 10_history.png');

    // 12. Settings & System Status
    console.log('Step 12: Checking Profile & System Settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_settings.png') });
    console.log('✓ Captured 11_settings.png');

    // 13. Mobile Viewport Test (375x812)
    console.log('Step 13: Testing Mobile Viewport...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Open mobile sidebar
    await page.evaluate(() => {
      const hamburger = document.querySelector('button[aria-label="Toggle navigation menu"]');
      if (hamburger) hamburger.click();
    });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_viewport.png') });
    console.log('✓ Captured 12_mobile_viewport.png');

    // 14. Invalid Upload Error Handling
    console.log('Step 14: Testing Invalid Upload Error Handling...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto(`${BASE_URL}/food-analyzer`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    const badFileInput = await page.$('input[type="file"]');
    const badFilePath = path.resolve(__dirname, 'sample_bad_file.txt');
    await badFileInput.uploadFile(badFilePath);
    await sleep(500);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = btns.find((b) => b.innerText.includes('Analyze Food'));
      if (analyzeBtn) analyzeBtn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_invalid_upload_error.png') });
    console.log('✓ Captured 13_invalid_upload_error.png');

    // 15. Logout Flow
    console.log('Step 15: Testing Logout Flow...');
    await page.evaluate(() => {
      const headerBtns = Array.from(document.querySelectorAll('header button'));
      if (headerBtns.length > 0) {
        headerBtns[headerBtns.length - 1].click();
      }
    });
    await sleep(600);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logoutBtn = btns.find((b) => b.innerText.includes('Sign Out'));
      if (logoutBtn) logoutBtn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_logout.png') });
    console.log('✓ Captured 14_logout.png');

    // 16. API Docs (/docs)
    console.log('Step 16: Testing Swagger UI Docs Page (/docs)...');
    await page.goto('http://127.0.0.1:8000/docs', { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_api_docs.png') });
    console.log('✓ Captured 15_api_docs.png');

    console.log('=== All 16 walkthrough verification steps completed successfully! ===');
  } catch (err) {
    console.error('Walkthrough error:', err);
  } finally {
    await browser.close();
  }
}

run();
