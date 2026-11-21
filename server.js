const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Determine Chrome / Chromium executable path
function getExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const linuxPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }
  const winPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of winPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Sky Telecom Refresh API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Refresh endpoint
app.post('/api/refresh', async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^0\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      title: 'خطأ في الإدخال',
      message: 'الرجاء إدخال رقم هاتف صحيح مكون من 10 أرقام ويبدأ بـ 0'
    });
  }

  const execPath = getExecutablePath();
  if (!execPath) {
    return res.status(500).json({
      success: false,
      title: 'خطأ بالخادم',
      message: 'لم يتم العثور على متصفح Chrome/Chromium على الخادم'
    });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,800'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to refreshsims.net
    await page.goto('https://www.refreshsims.net/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for Google reCAPTCHA to be initialized
    try {
      await page.waitForFunction(
        () => typeof window.grecaptcha !== 'undefined' && typeof window.grecaptcha.execute === 'function',
        { timeout: 15000 }
      );
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.warn('reCAPTCHA wait warning:', e.message);
    }

    // Enter phone with natural delay
    await page.waitForSelector('#ph', { timeout: 10000 });
    await page.type('#ph', phone, { delay: 80 });
    await new Promise(r => setTimeout(r, 500));

    // Submit form
    await page.click('#b');

    // Wait for final response: #r with class .s (success) or .e (error)
    await page.waitForSelector('#r.s, #r.e', { timeout: 75000 });

    const result = await page.evaluate(() => {
      const r = document.getElementById('r');
      const isSuccess = r ? r.classList.contains('s') : false;
      const title = document.getElementById('rt')?.textContent?.trim() || '';
      const message = document.getElementById('rm')?.textContent?.trim() || '';
      return { success: isSuccess, title, message };
    });

    return res.json({
      success: result.success,
      title: result.title || (result.success ? 'تم التحديث بنجاح' : 'فشل التحديث'),
      message: result.message || ''
    });

  } catch (err) {
    console.error('Refresh Error:', err);
    return res.status(500).json({
      success: false,
      title: 'خطأ في الاتصال',
      message: 'تعذر إتمام عملية التحديث حالياً، يرجى المحاولة لاحقاً أو التواصل معنا.'
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) { /* ignore */ }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Sky Refresh API Server listening on port ${PORT}`);
});
