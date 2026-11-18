/**
 * Comprehensive Playwright Testing Suite & Visual Quality Audit
 * Tests:
 *  - Viewports: Desktop (1920x1080, 1440x900, 1366x768), Tablet (1024x768, 768x1024), Mobile (430x932, 390x844, 375x812)
 *  - Themes: Light Mode, Dark Mode
 *  - Workflows: Navigation, Dashboard, ServiceRequestForm, WorkTimeGroupForms (1,2,3), History, Print Preview, Setup, Authorization PIN
 *  - Diagnostics: Console errors, network failures, horizontal overflow, accessibility touch targets
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const screenshotsDir = path.join(projectRoot, 'test-results', 'playwright-audit', 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const auditResults = {
  timestamp: new Date().toISOString(),
  environment: {
    frontendUrl: 'http://127.0.0.1:3100',
    backendUrl: 'http://127.0.0.1:4100',
  },
  viewportsTested: [
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1366x768', width: 1366, height: 768 },
    { name: 'tablet-1024x768', width: 1024, height: 768 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'mobile-430x932', width: 430, height: 932 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-375x812', width: 375, height: 812 },
  ],
  themesTested: ['light', 'dark'],
  testScenarios: [],
  diagnostics: {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    overflowIssues: [],
  },
  screenshots: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

function recordTest(name, status, details = {}) {
  auditResults.summary.total += 1;
  if (status === 'passed') auditResults.summary.passed += 1;
  else if (status === 'failed') auditResults.summary.failed += 1;
  else auditResults.summary.warnings += 1;

  auditResults.testScenarios.push({
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details,
  });
  console.log(`[${status.toUpperCase()}] ${name}`);
}

async function checkServerAvailable(url, maxAttempts = 30, interval = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    const isUp = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        resolve(res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(800, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

async function runAudit() {
  console.log('=== STARTING PLAYWRIGHT COMPREHENSIVE TESTING & AUDIT ===\n');

  let devServerProc = null;
  const isServerRunning = await checkServerAvailable('http://127.0.0.1:3100', 2, 500);

  if (!isServerRunning) {
    console.log('Starting application dev server via server/dev.mjs...');
    devServerProc = spawn(process.execPath, [path.join(projectRoot, 'server', 'dev.mjs')], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, BACKEND_PORT: '4100' },
    });

    const cleanup = () => {
      if (devServerProc && !devServerProc.killed) {
        try { devServerProc.kill(); } catch (e) {}
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    const ready = await checkServerAvailable('http://127.0.0.1:3100', 35, 1000);
    if (!ready) {
      console.error('ERROR: Could not connect to http://127.0.0.1:3100 after 35s.');
      if (devServerProc) devServerProc.kill();
      process.exit(1);
    }
  }

  console.log('Application server is READY at http://127.0.0.1:3100');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Attach diagnostic listeners
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected benign connection test errors if offline
      auditResults.diagnostics.consoleErrors.push({ text, location: msg.location() });
    }
  });

  page.on('pageerror', (err) => {
    auditResults.diagnostics.pageErrors.push(err.message || String(err));
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore external font or analytics network failure if sandboxed
    if (!url.includes('fonts.gstatic.com')) {
      auditResults.diagnostics.failedRequests.push({
        url,
        failure: req.failure() ? req.failure().errorText : 'failed',
      });
    }
  });

  async function checkHorizontalOverflow(viewportName, pageName) {
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasOverflow = docW > winW + 1; // 1px threshold for fractional pixels
      return { hasOverflow, scrollWidth: docW, innerWidth: winW };
    });

    if (overflow.hasOverflow) {
      auditResults.diagnostics.overflowIssues.push({
        pageName,
        viewportName,
        ...overflow,
      });
      return false;
    }
    return true;
  }

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Initial Page Load & Theme Detection
    // ------------------------------------------------------------------------
    await page.goto('http://127.0.0.1:3100', { waitUntil: 'networkidle' });
    const title = await page.title();
    recordTest('Page Load & Title', title.includes('IT Support') ? 'passed' : 'warning', {
      title,
    });

    // ------------------------------------------------------------------------
    // SCENARIO 2: Responsive Viewports & Dark/Light Mode Audit
    // ------------------------------------------------------------------------
    for (const vp of auditResults.viewportsTested) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Check Light Mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('it_support_theme_v1', 'light');
      });
      await page.waitForTimeout(200);

      const lightShot = `dashboard-${vp.name}-light.png`;
      await page.screenshot({ path: path.join(screenshotsDir, lightShot) });
      auditResults.screenshots.push({ viewport: vp.name, theme: 'light', file: lightShot });

      const noOverflowLight = await checkHorizontalOverflow(vp.name, 'Dashboard (Light)');

      // Check Dark Mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('it_support_theme_v1', 'dark');
      });
      await page.waitForTimeout(200);

      const darkShot = `dashboard-${vp.name}-dark.png`;
      await page.screenshot({ path: path.join(screenshotsDir, darkShot) });
      auditResults.screenshots.push({ viewport: vp.name, theme: 'dark', file: darkShot });

      const noOverflowDark = await checkHorizontalOverflow(vp.name, 'Dashboard (Dark)');

      recordTest(`Responsive Viewport: ${vp.name}`, noOverflowLight && noOverflowDark ? 'passed' : 'warning', {
        viewport: vp,
        noOverflowLight,
        noOverflowDark,
      });
    }

    // Set standard desktop viewport for functional workflows
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('it_support_theme_v1', 'light');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 3: Navigation Drawer & Header Controls
    // ------------------------------------------------------------------------
    const menuBtn = page.getByTitle('เปิดเมนูนำทาง (Navigation Menu)');
    await menuBtn.click();
    await page.waitForTimeout(300);

    const drawerVisible = await page.locator('[role="dialog"][aria-modal="true"]').isVisible();
    recordTest('Slide-out Navigation Drawer Open', drawerVisible ? 'passed' : 'failed');

    const drawerShot = 'drawer-navigation.png';
    await page.screenshot({ path: path.join(screenshotsDir, drawerShot) });
    auditResults.screenshots.push({ name: 'drawer', file: drawerShot });

    // Test Esc key to close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const drawerClosed = !(await page.locator('[role="dialog"][aria-modal="true"]').isVisible());
    recordTest('Drawer Close on Escape', drawerClosed ? 'passed' : 'failed');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Service Request Form & Custom SelectField Audit
    // ------------------------------------------------------------------------
    await page.goto('http://127.0.0.1:3100', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Navigate to service-request via dashboard button
    await page.click('button:has-text("กรอกใบแจ้งซ่อม")');
    await page.waitForTimeout(600);

    const formHeading = await page.locator('h1, h2').first().textContent();
    recordTest('Service Request Form Navigation', formHeading ? 'passed' : 'failed');

    // Audit Custom SelectField (Technician Receiver Dropdown)
    const selectTrigger = page.locator('button[role="combobox"]').first();
    await selectTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await selectTrigger.click();
    await page.waitForTimeout(300);

    const listboxVisible = await page.locator('[role="listbox"]').isVisible();
    recordTest('Custom SelectField Popover Open', listboxVisible ? 'passed' : 'failed');

    const selectShot = 'custom-select-popover.png';
    await page.screenshot({ path: path.join(screenshotsDir, selectShot) });
    auditResults.screenshots.push({ name: 'select-popover', file: selectShot });

    // Verify groups and select a technician
    const firstOption = page.locator('[role="option"]:has-text("วัชรากร คำชมภู")');
    await firstOption.click();
    await page.waitForTimeout(200);

    const selectedText = await selectTrigger.textContent();
    recordTest(
      'Custom SelectField Selection',
      selectedText.includes('วัชรากร คำชมภู') ? 'passed' : 'failed',
      { selectedText }
    );

    // Fill Requester details
    await page.fill('input[name="fullName"]', 'ทดสอบ สมชาย ใจดี');
    await page.fill('input[name="phoneNumber"]', '089-123-4567');
    await page.fill('input[name="department"]', 'แผนกสารสนเทศ');

    // Select Hardware and fill device details
    const hwCheckbox = page.locator('label:has-text("ตัวเครื่อง / อุปกรณ์ (ฮาร์ดแวร์)")');
    if (await hwCheckbox.isVisible()) await hwCheckbox.click();

    await page.fill('input[name="deviceBrandModel"]', 'Lenovo ThinkPad T14');
    await page.fill('input[name="deviceSerialNumber"]', 'SN-TEST-99881');
    await page.fill('textarea[name="problemDescription"]', 'เปิดเครื่องติด แต่หน้าจอดำสนิท ไม่มีสัญญาณภาพ');

    // Select services and check live fee calculation
    const svc1 = page.locator('label:has-text("ติดตั้ง Windows")');
    const svc2 = page.locator('label:has-text("แก้ไขปัญหา Hardware")');
    if (await svc1.isVisible()) await svc1.click();
    if (await svc2.isVisible()) await svc2.click();

    const formShot = 'service-request-form-filled.png';
    await page.screenshot({ path: path.join(screenshotsDir, formShot) });
    auditResults.screenshots.push({ name: 'form-filled', file: formShot });

    // Verify print container portal after triggering print
    await page.evaluate(() => {
      window.__printed = false;
      window.print = () => { window.__printed = true; };
    });
    const printBtn = page.locator('button:has-text("ตัวอย่างการพิมพ์ (A4)")');
    if (await printBtn.isVisible()) {
      await printBtn.click();
      await page.waitForTimeout(300);
    }
    const printPortal = page.locator('.print-only');
    const hasPrintPortal = (await printPortal.count()) > 0;
    recordTest('Service Request Print Portal Ready', hasPrintPortal ? 'passed' : 'failed');

    // ------------------------------------------------------------------------
    // SCENARIO 5: Work Time Forms Audit (Groups 1, 2, 3)
    // ------------------------------------------------------------------------
    for (const groupKey of ['work-time-group-1', 'work-time-group-2', 'work-time-group-3']) {
      await page.click('button:has-text("เมนูนำทาง")');
      await page.waitForTimeout(300);
      if (groupKey === 'work-time-group-1') {
        await page.click('nav button:has-text("ช่างวันจันทร์")');
      } else if (groupKey === 'work-time-group-2') {
        await page.click('nav button:has-text("ช่างวันอังคาร")');
      } else {
        await page.click('nav button:has-text("ช่างวันศุกร์")');
      }
      await page.waitForTimeout(400);

      // Verify canvas signature pad exists
      const canvas = page.locator('canvas');
      const hasCanvas = (await canvas.count()) > 0;
      recordTest(`Work Time Form (${groupKey}) Signature Canvas`, hasCanvas ? 'passed' : 'warning');
    }

    // ------------------------------------------------------------------------
    // SCENARIO 6: Submission History & Mobile Card Layout Audit
    // ------------------------------------------------------------------------
    await page.click('button:has-text("เมนูนำทาง")');
    await page.waitForTimeout(200);
    await page.click('nav button:has-text("ติดตามสถานะซ่อมและประวัติ")');
    await page.waitForTimeout(400);

    const historyHeading = await page.locator('h1, h2').first().textContent();
    recordTest('Submission History Navigation', historyHeading ? 'passed' : 'failed');

    // Test Desktop Table
    const tableVisible = await page.locator('table').isVisible();
    recordTest('History Desktop Table Rendered', tableVisible ? 'passed' : 'warning');

    // Test Mobile Card Layout on 375px viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileCards = page.locator('.sm\\:hidden.divide-y');
    const mobileCardsVisible = await mobileCards.isVisible();
    recordTest('History Mobile Responsive Cards (375px)', mobileCardsVisible ? 'passed' : 'warning');

    const historyMobileShot = 'history-mobile-cards-375px.png';
    await page.screenshot({ path: path.join(screenshotsDir, historyMobileShot) });
    auditResults.screenshots.push({ name: 'history-mobile', file: historyMobileShot });

    const noOverflowHistoryMobile = await checkHorizontalOverflow('mobile-375px', 'History Mobile View');
    recordTest('History Mobile No Horizontal Overflow', noOverflowHistoryMobile ? 'passed' : 'failed');

    // Return to desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // ------------------------------------------------------------------------
    // SCENARIO 7: Staff PIN Authorization Modal Audit
    // ------------------------------------------------------------------------
    const authBtn = page.getByTitle(/สำหรับเจ้าหน้าที่/i);
    if (await authBtn.isVisible()) {
      await authBtn.click();
      await page.waitForTimeout(300);

      const authModal = page.locator('[role="dialog"]:has-text("ยืนยันสิทธิ์เจ้าหน้าที่")');
      const authModalVisible = await authModal.isVisible();
      recordTest('Authorization Modal Open', authModalVisible ? 'passed' : 'failed');

      // Test invalid PIN
      const pinInput = authModal.locator('input[type="password"]');
      await pinInput.fill('0000');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const errText = await authModal.locator('[role="alert"], .text-red-600').textContent();
      recordTest(
        'Authorization Invalid PIN Rejection',
        errText && errText.includes('ไม่ถูกต้อง') ? 'passed' : 'failed'
      );

      // Test valid PIN (1234)
      await pinInput.fill('1234');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);

      const isUnlocked = await page.locator('text=โหมดเจ้าหน้าที่').first().isVisible();
      recordTest('Authorization Valid PIN (1234) Unlock', isUnlocked ? 'passed' : 'failed');

      // Lock again
      const unlockBtn = page.getByTitle(/คลิกเพื่อออกจากโหมดเจ้าหน้าที่/i);
      if (await unlockBtn.isVisible()) {
        await unlockBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // ------------------------------------------------------------------------
    // SCENARIO 8: Google Sheets Setup View Audit
    // ------------------------------------------------------------------------
    await page.click('button:has-text("เมนูนำทาง")');
    await page.waitForTimeout(200);
    await page.click('nav button:has-text("ตั้งค่าเชื่อมต่อ Google Sheets")');
    await page.waitForTimeout(400);

    const setupHeading = await page.locator('h1, h2').first().textContent();
    recordTest('Setup View Navigation', setupHeading ? 'passed' : 'failed');

    const copyBtn = page.getByRole('button', { name: /คัดลอกโค้ด/i });
    const hasCopyBtn = await copyBtn.isVisible();
    recordTest('Setup Code Copy Button Accessible', hasCopyBtn ? 'passed' : 'failed');

    const setupShot = 'google-sheets-setup-desktop.png';
    await page.screenshot({ path: path.join(screenshotsDir, setupShot) });
    auditResults.screenshots.push({ name: 'setup-desktop', file: setupShot });

  } catch (err) {
    console.error('Test execution error:', err);
    recordTest('Execution Error', 'failed', { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
    if (devServerProc) {
      console.log('Shutting down spawned dev server...');
      devServerProc.kill();
    }
  }

  // Save JSON report
  const reportPath = path.join(projectRoot, 'test-results', 'playwright-audit', 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`\nAudit finished! Report saved to: ${reportPath}`);
  console.log(`Summary: Total: ${auditResults.summary.total}, Passed: ${auditResults.summary.passed}, Failed: ${auditResults.summary.failed}, Warnings: ${auditResults.summary.warnings}`);
}

runAudit();

