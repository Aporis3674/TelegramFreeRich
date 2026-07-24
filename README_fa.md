<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/logo.svg" width="120" alt="TelegramFreeRich">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Editor-TipTap-purple" alt="TipTap">
  <img src="https://img.shields.io/badge/UI-React-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tests-62-passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/%D8%B1%D8%A7%DB%8C%DA%AF%D8%A7%D9%86-success" alt="Free">
</p>

<h1 align="center">تله‌گرام‌فری‌ریچ</h1>

<p align="center"><strong>ویرایشگر متن غنی رایگان برای تلگرام — نسخه دسکتاپ</strong></p>
<p align="center">چون بات‌ها نباید از انسان‌ها حقوق بیشتری داشته باشند.</p>

<p align="center"><a href="README.md">[ English ]</a></p>

<p align="center">
  <a href="#دانلود">دانلود</a> •
  <a href="#قابلیت‌ها">قابلیت‌ها</a> •
  <a href="#معماری">معماری</a> •
  <a href="#نصب">نصب</a> •
  <a href="#نحوه-استفاده">نحوه استفاده</a> •
  <a href="#بیلد">بیلد</a> •
  <a href="#توسعه">توسعه</a>
</p>

---

## دانلود

| پلتفرم | دانلود |
|---------|--------|
| **ویندوز** | [TelegramFreeRich-Setup.exe](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) |

ویندوز ۱۰ یا بالاتر. نیازی به نصب Node.js یا سایر وابستگی‌ها نیست.

---

## این پروژه چیه؟

تلگرام در ژوئن ۲۰۲۶ ویرایشگر متن غنی معرفی کرد (Bot API 10.1)، اما فقط برای کاربران Premium. در حالی که دقیقاً همان API به بات‌ها همان قابلیت‌ها را به صورت رایگان می‌دهد.

این اپ دسکتاپ به هر کسی اجازه می‌دهد -- نه فقط مشترکین Premium -- پیام‌های حرفه‌ای و قالب‌بندی شده از طریق Bot API تلگرام ارسال کند.

بدون نیاز به کدنویسی. بدون نیاز به Premium. بدون نیاز به سرور.

---

## قابلیت‌ها

### قالب‌بندی درون‌خطی
- پررنگ، کج، زیرخط، خط‌خورده
- اسپویلر، هایلایت (marked)، کد درون خطی
- زیرنویس، بالانویس

### المان‌های بلوکی
- سرتیتر H1 تا H3
- نقل‌قول، نقل‌قول برجسته (Pull Quote)
- بلوک کد با انتخاب زبان
- خط جداکننده
- بلوک تاشو (جزئیات)
- پانویس (Footer)

### لیست‌ها و جدول
- لیست گلوله‌ای، لیست شماره‌دار
- چک‌لیست (از طریق API جداگانه `sendChecklist` ارسال می‌شود)
- سلول‌های قابل ویرایش

### رسانه
- تصویر (URL)
- ویدیو، صدا
- اسلایدشو، کلاژ

### ریاضی
- بلوک فرمول ریاضی (LaTeX)

### اتصال به API
- ارسال با `sendRichMessage` و **JSON ساختاریافته بلوک‌ها** (نه markdown)
- ویرایش پیام با `editMessageText` + `rich_message`
- ارسال پیش‌نویس با `sendRichMessageDraft` (۳۰ ثانیه)
- چک‌لیست از طریق API جداگانه `sendChecklist` ارسال می‌شود
- دکمه تست اتصال (`getMe`)

### امکانات ویرایشگر
- **ویرایشگر مبتنی بر TipTap** — contenteditable استاندارد با ProseMind
- **رابط دو پنلی** — ویرایشگر در سمت چپ، پیش‌نمایش زنده تلگرامی در سمت راست
- نوار ابزار گروه‌بندی شده: درون‌خطی / بلوک / رسانه
- تم تاریک (پیش‌فرض) + تم روشن
- کلیدهای میانبر (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+E و ...)
- شمارشگر کاراکتر (حداکثر ۳۲۷۶۸) با آستانه هشدار
- مودال تنظیمات (توکن ربات، شناسه چت، زبان)
- اعلان‌های توست
- پشتیبانی از زبان‌های RTL (فارسی)

---

## معماری

### v3.0 — React + TipTap + Block State (نسخه فعلی)

ویرایشگر از **TipTap** (مبتنی بر ProseMind) برای ویرایش متن غنی استفاده می‌کند. محتوای کاربر از یک معماری **Block State** عبور می‌کند که مستقیماً با انواع JSON ساختاریافته Bot API تلگرام 10.1 مطابقت دارد:

```
ویرایشگر TipTap (DOM contenteditable)
        │
        ▼
پارسر بلوک (DOM → Block State JSON[])
        │
        ▼
سریالایزر بلوک (Block State → JSON API تلگرام)
        │
        ├──→ sendRichMessage(blocks[])     [پیام‌های غنی]
        │
        └──→ sendChecklist(blocks[])       [فقط چک‌لیست]
```

**چرا JSON بلوک‌ها به جای Markdown؟**
Bot API تلگرام 10.1 از انواع `InputRichBlock*` ساختاریافته پشتیبانی می‌کند که تمام قابلیت‌ها را پوشش می‌دهد (اسپویلر، جزئیات، جدول، ریاضی و ...). Markdown فقط زیرمجموعه‌ای را بیان می‌کند. JSON بلوک‌ها ۱۰۰٪ برابری قابلیت فراهم می‌کنند.

### انواع بلوک

| نوع بلوک | نوع Telegram API |
|-----------|-------------------|
| paragraph | `InputRichBlockParagraph` |
| heading | `InputRichBlockHeading` |
| blockquote | `InputRichBlockBlockquote` |
| pullquote | `InputRichBlockPullquote` |
| code_block | `InputRichBlockCodeBlock` |
| divider | `InputRichBlockDivider` |
| list | `InputRichBlockList` |
| table | `InputRichBlockTable` |
| details | `InputRichBlockDetails` |
| footer | `InputRichBlockFooter` |
| photo / video / audio | `InputRichBlockPhoto` و غیره |
| math_block | `InputRichBlockMathBlock` |
| checklist | `InputRichBlockChecklist` |

### مدل امنیتی

```
┌─────────────────────────────────────────────────┐
│  پردازشگر Renderer (React)                      │
│                                                 │
│  ❌ توکن ربات اینجا ذخیره نمی‌شود              │
│  ❌ بدون fetch() مستقیم به API تلگرام           │
│  ✅ فراخوانی window.app.api(method, body)       │
└──────────────────────┬──────────────────────────┘
                       │ IPC (contextBridge)
┌──────────────────────▼──────────────────────────┐
│  پردازشگر Main (Electron)                       │
│                                                 │
│  ✅ توکن با safeStorage ذخیره می‌شود (رمزنگاری) │
│  ✅ تمام فراخوانی‌های API از اینجا انجام می‌شود │
│  ✅ اعتبارسنجی ورودی در هر کانال IPC           │
│  ✅ تایم‌اوت HTTP (۳۰ ثانیه) + محدودیت حجم     │
│  ✅ لیست سفید متدها (فقط متدهای مجاز تلگرام)   │
└─────────────────────────────────────────────────┘
```

---

## تکنولوژی

| لایه | تکنولوژی |
|------|-----------|
| پوسته دسکتاپ | Electron 35 |
| فریم‌ورک UI | React 19 |
| ویرایشگر متن | TipTap 2.11+ (ProseMind) |
| ابزار بیلد | Vite 6 |
| تست | Vitest 2.1 + jsdom |
| مدل داده | Block State (JSON array → JSON API تلگرام) |
| امنیت | پل IPC، safeStorage، اعتبارسنجی ورودی |
| تم | متغیرهای CSS (تاریک + روشن) |
| زبان | فارسی، English |
| پکیج‌بندی | electron-builder (NSIS) |
| CI/CD | GitHub Actions (lint، test، build) |

---

## ساختار پروژه

```
TelegramFreeRich/
├── src/
│   ├── main/                    # پردازشگر اصلی Electron
│   │   ├── main.js              # نقطه ورود، handlerهای IPC، فراخوانی TG API
│   │   ├── preload.js           # پل ارتباطی امن IPC (contextBridge)
│   │   └── security/
│   │       └── validation.js    # اعتبارسنجی ورودی، لیست سفید متدها
│   │
│   ├── renderer/                # رابط کاربری React (سرور Vite)
│   │   ├── main.jsx             # نقطه ورود React
│   │   ├── App.jsx              # کامپوننت ریشه (state، منطق ارسال)
│   │   ├── components/
│   │   │   ├── TipTapEditor.jsx # ویرایشگر TipTap با اکستنشن‌ها
│   │   │   ├── Toolbar.jsx      # نوار ابزار قالب‌بندی گروه‌بندی شده
│   │   │   ├── Preview.jsx      # پیش‌نمایش زنده تلگرامی
│   │   │   ├── ActionBar.jsx    # تب‌های حالت، شمارشگر، دکمه ارسال
│   │   │   ├── Settings.jsx     # مودال تنظیمات (توکن، چت، زبان)
│   │   │   ├── Toast.jsx        # سیستم اعلان توست
│   │   │   └── extensions.js    # اکستنشن‌های سفارشی TipTap
│   │   ├── i18n/                # ترجمه‌ها (en، fa)
│   │   ├── styles/              # CSS (app، editor، preview)
│   │   ├── index.html           # HTML نقطه ورود (CSP meta tag)
│   │   └── app.js               # رندرر قدیمی (تا مهاجرت کامل)
│   │
│   └── shared/                  # مشترک بین main و renderer
│       ├── block-types.js       # انواع BlockType / InlineType
│       ├── block-parser.js      # تبدیل DOM → Block State
│       ├── block-serializer.js  # تبدیل Block State → JSON API تلگرام
│       ├── block-manager.js     # مدیریت state با undo/redo
│       ├── constants.js         # ثابت‌های سراسری
│       └── utils.js             # ابزارها (sanitizeUrl و ...)
│
├── tests/
│   └── unit/                    # تست‌های unit با Vitest (۶۲ تست)
│       ├── block-manager.test.js
│       ├── block-parser.test.js
│       ├── block-serializer.test.js
│       ├── utils.test.js
│       └── validation.test.js
│
├── vite.config.js               # تنظیمات Vite (پلاگین React)
├── vitest.config.js             # تنظیمات Vitest (jsdom، coverage)
├── package.json                 # وابستگی‌ها + اسکریپت‌ها
├── .eslintrc.json               # تنظیمات ESLint
├── .prettierrc                  # تنظیمات Prettier
└── .github/workflows/
    ├── ci.yml                   # Lint + test + build (CI)
    └── build.yml                # ساخت ویندوز + انتشار
```

---

## نصب

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر (فقط برای ساخت از سورس)
- یک ربات تلگرام (از [@BotFather](https://t.me/BotFather) بگیرید)
- شناسه چت (کانال یا گروه)

### شروع سریع (دانلود)

1. آخرین نسخه را از [صفحه دانلود](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) دانلود کنید
2. `TelegramFreeRich-Setup.exe` را اجرا کنید
3. اپ را باز کنید
4. روی تنظیمات (آیکون چرخ دنده) کلیک کنید
5. توکن ربات را وارد کنید (از @BotFather)
6. شناسه چت را وارد کنید (`@channel` یا شناسه عددی)
7. «تست اتصال» را بزنید
8. شروع به نوشتن کنید و «ارسال» را بزنید

### از سورس

```bash
git clone https://github.com/Aporis3674/TelegramFreeRich.git
cd TelegramFreeRich
npm install
npm start
```

---

## نحوه استفاده

۱. پیام خود را در ویرایشگر بنویسید (پنل سمت چپ)
۲. از نوار ابزار برای فرمت‌بندی استفاده کنید
۳. پیش‌نمایش زنده در سمت راست ببینید
۴. **ارسال** را بزنید

### حالت‌های ارسال

| حالت | زمان استفاده |
|------|--------------|
| **Rich** | پیام فرمت‌شده (توصیه می‌شود) |
| **Draft** | پیش‌نمایش ۳۰ ثانیه‌ای (فقط چت خصوصی) |
| **Edit** | ویرایش پیام موجود (شناسه پیام را وارد کنید) |

### کلیدهای میانبر

| کلید | عملکرد |
|------|--------|
| Ctrl+B | پررنگ |
| Ctrl+I | کج |
| Ctrl+U | زیرخط |
| Ctrl+E | کد درون خطی |
| Ctrl+Shift+X | خط‌خورده |
| Ctrl+Shift+H | هایلایت |
| Ctrl+Z | بازگشت |
| Ctrl+Shift+Z | انجام مجدد |

---

## تست‌ها

```bash
# اجرای تمام تست‌ها
npm test

# اجرا در حالت watch
npm run test:watch

# اجرا با coverage
npx vitest --coverage
```

**۶۲ تست** پوشش دهنده:
- مدیریت بلوک (CRUD، undo/redo، listenerها)
- پارسر بلوک (DOM → Block State)
- سریالایزر بلوک (Block State → JSON API تلگرام)
- ابزارها (sanitizeUrl، تولید ID، اعتبارسنجی)
- اعتبارسنجی امنیتی (توکن، شناسه چت، لیست سفید متدها)

---

## توسعه

```bash
# نصب وابستگی‌ها
npm install

# اجرای dev mode (Vite + Electron)
npm run dev

# لینت
npm run lint

# بیلد برای تولید
npm run build
```

### اکستنشن‌های سفارشی TipTap

| اکستنشن | نوع | توضیح |
|----------|------|-------|
| Spoiler | Mark | `<span class="tg-spoiler">` — متن پنهان تا لمس شود |
| Details | Node | `<details>` — محتوای تاشو با خلاصه |
| Footer | Node | `<footer>` — متن پانویس |
| MathBlock | Node | بلوک فرمول ریاضی (LaTeX) |

---

## بیلد

### ویندوز

```bash
npm run build
# خروجی: dist/TelegramFreeRich-Setup-3.0.0.exe
```

### CI/CD

GitHub Actions به صورت خودکار:
- Lint و اجرای تست‌ها در هر push
- ساخت اینستالر ویندوز در هر tag push
- ایجاد GitHub Release با اینستالر

---

## امنیتی

| لایه | محافظت |
|------|---------|
| ذخیره توکن | `safeStorage` (رمزنگاری با کلید OS) |
| پل IPC | `contextBridge` — رندرر به Node API دسترسی ندارد |
| اعتبارسنجی ورودی | لیست سفید برای متدهای API، شناسه‌های چت، زبان‌ها |
| HTTP | تایم‌اوت ۳۰ ثانیه، محدودیت حجم پاسخ ۱ مگابایت |
| اعتبارسنجی URL | مسدود کردن `javascript:`، `data:`، `vbscript:` |
| CSP | متا تگ Content Security Policy در index.html |

---

## تاریخچه تغییرات

مشاهده [CHANGELOG.md](CHANGELOG.md) برای تاریخچه کامل نسخه‌ها.

---

## مجوز

MIT

---

> بهترین چیزهای زندگی رایگان هستند. دومین چیزهای خوب هم رایگان هستند -- اگر از یه بات استفاده کنید.
