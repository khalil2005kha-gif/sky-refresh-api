# 🚀 Sky Telecom Auto-Refresh API (خادم التحديث الآلي لسكاي)

خدمة خلفية (Backend Micro-service) مبنية بـ Node.js و Puppeteer لأتمتة عملية تحديث أرقام Sky Telecom عبر موقع `refreshsims.net` بشكل صامت وسريع في الخلفية مع اجتياز أنظمة الحماية وإرجاع النتيجة مباشرة إلى موقعك على GitHub Pages.

---

## 📁 محتويات المجلد:
- `server.js`: خادم Express يوفر نقطة اتصال `POST /api/refresh` لاستقبال الرقم وتحديثه وإرجاع النتيجة.
- `Dockerfile`: ملف ضبط الحاوية لتثبيت متصفح Google Chrome الرسمي وحزم الخطوط العربية للعمل على السيرفرات السحابية.
- `render.yaml`: ملف الإعداد السريع لمنصة Render.com.
- `package.json`: تبعيات المشروع.

---

## ⚡ خطوات الرفع المجاني على Render.com (يعمل 24/7 مجاناً مع HTTPS):

1. **رفع مجلد المشروع إلى GitHub:**
   - قم بإنشاء مستودع (Repository) جديد على حسابك في GitHub (مثلاً باسم: `sky-refresh-api`).
   - ارفع محتويات هذا المجلد (`backend-sky-refresh`) إلى المستودع.

2. **الربط مع Render.com:**
   - ادخل إلى موقع [https://render.com](https://render.com) وسجّل الدخول مجاناً بحساب GitHub.
   - اضغط على زر **New +** ثم اختر **Web Service**.
   - اختر مستودع `sky-refresh-api` الذي رفعته للتو.
   - في خانة **Runtime / Environment**: اختر **Docker** (سيتعرف عليه تلقائياً).
   - في خانة **Plan Type**: اختر **Free** (مجاني).
   - اضغط على **Create Web Service**.

3. **الحصول على الرابط ووضعه في موقعك:**
   - انتظر دقيقة حتى يكتمل البناء وتظهر رسالة `Live`.
   - انسخ الرابط الخاص بك الذي يوفره Render (مثال: `https://sky-refresh-xxxx.onrender.com`).
   - افتح ملف `index.html` في موقعك وابحث عن السطر:
     ```javascript
     const SKY_REFRESH_API_URL = 'http://localhost:3000/api/refresh';
     ```
   - استبدله برابطك الجديد مع إضافة `/api/refresh`:
     ```javascript
     const SKY_REFRESH_API_URL = 'https://sky-refresh-xxxx.onrender.com/api/refresh';
     ```
   - ارفع التحديث إلى GitHub Pages... **وانتهى كل شيء!** 🎉
