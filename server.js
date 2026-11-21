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
    // Run real GUI Chrome (headless: false) on virtual Xvfb screen
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: false,
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
      timeout: 35000
    });

    // Human mouse moves to gain high reCAPTCHA v3 score
    await page.mouse.move(100, 150);
    await page.mouse.move(250, 320);

    // Enter phone with natural click and typing delay
    await page.waitForSelector('#ph', { timeout: 15000 });
    await page.click('#ph');
    await page.type('#ph', phone, { delay: 90 });
    await new Promise(r => setTimeout(r, 1000));

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
