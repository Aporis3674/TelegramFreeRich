<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/telegram.svg" width="110" alt="TelegramFreeRich">
</p>

<h1 align="center">تله‌گرام‌فری‌ریچ</h1>

<p align="center"><strong>ویرایشگر متن غنی تلگرام — برای همه، بدون پرمیوم.</strong></p>
<p align="center"><em>چون بات‌ها نباید از انسان‌ها حقوق بیشتری داشته باشند.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-5.1.2-2ca5e0" alt="نسخه ۵٫۱٫۲">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-2ca5e0?logo=telegram&logoColor=white" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Electron-35-47848f?logo=electron&logoColor=white" alt="Electron 35">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TipTap-2-8b5cf6" alt="TipTap 2">
  <img src="https://img.shields.io/badge/tests-227%20passing-4fc3a1" alt="۲۲۷ تست">
  <img src="https://img.shields.io/badge/license-MIT-8b99a7" alt="MIT">
</p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> &nbsp;•&nbsp;
  <a href="#-شروع-سریع">شروع سریع</a> &nbsp;•&nbsp;
  <a href="#-پنجرهٔ-برنامه">پنجرهٔ برنامه</a> &nbsp;•&nbsp;
  <a href="#️-چه-چیزهایی-می‌توانی-بفرستی">قابلیت‌ها</a> &nbsp;•&nbsp;
  <a href="#-چطور-کار-می‌کند">معماری</a> &nbsp;•&nbsp;
  <a href="#-امنیت">امنیت</a> &nbsp;•&nbsp;
  <a href="#-توسعه">توسعه</a>
</p>

<p align="center">
  <img src="screenshot.jpg" width="880" alt="تله‌گرام‌فری‌ریچ — ویرایشگر و پیش‌نمایش زنده">
</p>

---

## چرا این پروژه ساخته شد؟

تلگرام در ژوئن ۲۰۲۶ ویرایشگر متن غنی را معرفی کرد و آن را پشت پرمیوم قفل کرد. دقیقاً همان
قالب‌بندی‌ها از طریق Bot API 10.1 برای **هر باتی، رایگان** در دسترس است.

|  | پرمیوم تلگرام | یک بات + این برنامه |
|---|---|---|
| عنوان، نقل‌قول، جدول، بلوک کد | 💎 پرمیوم | ✅ رایگان |
| اسپویلر، هایلایت، زیرنویس/بالانویس | 💎 پرمیوم | ✅ رایگان |
| چک‌لیست، بخش تاشو، فرمول | 💎 پرمیوم | ✅ رایگان |
| هزینهٔ ماهانه | 💸 | **۰** |

بدون کدنویسی، بدون سرور، بدون اشتراک. فقط توکن بات و شناسهٔ چت را بده و بنویس.

---

## 🚀 شروع سریع

**۱ — یک بات بساز.** به [@BotFather](https://t.me/BotFather) پیام بده، `/newbot` بفرست و توکن را
کپی کن. بات را به‌عنوان ادمین به کانال یا گروهت اضافه کن.

**۲ — نصب کن.** بسته را از
[آخرین انتشار](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) بگیر:

| سیستم | فایل | توضیح |
|---|---|---|
| ویندوز ۱۰/۱۱ | `TelegramFreeRich-Setup-*.exe` | برای کاربر جاری نصب می‌شود — نیازی به دسترسی ادمین نیست |
| ویندوز ۱۰/۱۱ | `TelegramFreeRich-*-portable.exe` | همان‌طور اجرا می‌شود؛ نصب و حذف ندارد |
| لینوکس | `TelegramFreeRich-*.AppImage` | اجازهٔ اجرا بده و اجرا کن |

یا از سورس شروع کن:

```bash
git clone https://github.com/Aporis3674/TelegramFreeRich.git
cd TelegramFreeRich
npm install
npm run dev
```

**۳ — تنظیم کن.** روی چرخ‌دندهٔ ⚙ در نوار عنوان بزن، توکن و شناسهٔ چت (`@کانال` یا شناسهٔ عددی) را
وارد کن، **تست اتصال** را بزن و **ذخیره** کن.

پیامت را بنویس و <kbd>Ctrl</kbd>+<kbd>Enter</kbd> بزن. تمام.

---

## 🌐 تلگرام فیلتر است؟ از پروکسی خودت استفاده کن

در کشورهایی که تلگرام فیلتر است، کاربران با v2rayN، Nekoray یا کلاینت‌های مشابه وصل می‌شوند. این
کلاینت‌ها گزینهٔ **«Set system proxy»** دارند که ویندوز — و در نتیجه کرومیوم — را تنظیم می‌کند، ولی
**نود** آن را نمی‌بیند. هر اپ الکترونی که با ماژول `https` نود بفرستد، پروکسی سیستم را نادیده
می‌گیرد و تایم‌اوت می‌خورد.

این برنامه همهٔ درخواست‌های تلگرام را از **مسیر شبکهٔ کرومیوم** می‌فرستد (`net.request` روی نشست
پیش‌فرض)، پس پروکسی سیستم — و حتی اسکریپت PAC — رعایت می‌شود.

تنظیمات ← **اتصال**:

| حالت | چه وقت |
|---|---|
| **پروکسی سیستم** *(پیش‌فرض)* | کلاینت VPN گزینهٔ «Set system proxy» را روشن دارد — کار دیگری لازم نیست |
| **پروکسی دستی** | کلاینت فقط پورت می‌دهد. با یک کلیک مقادیر پیش‌فرض v2rayN پر می‌شود: SOCKS5 روی `127.0.0.1:10808` یا HTTP روی `127.0.0.1:10809` |
| **بدون پروکسی** | اتصال مستقیم |

دکمهٔ **بررسی اتصال به تلگرام** می‌گوید کرومیوم چه پروکسی‌ای انتخاب کرده و آیا `api.telegram.org`
جواب داده — تا شبکهٔ فیلترشده با توکن اشتباه قاطی نشود. پروکسی دستی می‌تواند نام کاربری و گذرواژه
داشته باشد؛ گذرواژه کنار توکن ربات رمزنگاری می‌شود و هرگز به پنجره‌ای که در آن تایپ می‌کنی نمی‌رسد.

---

## 🪟 پنجرهٔ برنامه

بازسازی دقیق ویرایشگر تلگرام دسکتاپ: بدون قاب، تیره، دکمه‌های قرص‌مانند با حاشیهٔ مویی و یک دکمهٔ
ارسال صورتی‌آجری.

```
┌ ⚙ ▣ ¶ ────────────────────────────────────────────  ─  □  ✕ ┐
│  ( ↶ )( ↷ )   ( Aa )( B )( ☰ )( ▦ )( 🔗 )( 🖼 )( Σ )         │
│                                                              │
│  پیام                                        │  پیش‌نمایش زنده │
│                                             │                │
│  ( ✦ )                       342 / 32,768  ( 🗑 )      ( ➤ ) │
└──────────────────────────────────────────────────────────────┘
```

| دکمه | با کلیک چه می‌شود |
|:--:|---|
| ↶ ↷ | بازگردانی / انجام دوباره — تاریخچهٔ کامل ProseMirror |
| **Aa** | **قالب‌بندی** ← عنوان (H1 تا H6 را باز می‌کند)، متن، نقل‌قول، نقل‌قول برجسته، بلوک کد، پاورقی، جداکننده |
| **B** | **سبک متن** ← پررنگ، کج، زیرخط‌دار، خط‌خورده، اسپویلر، زیرنویس، بالانویس، هایلایت |
| ☰ | **درج فهرست** ← شماره‌دار، نقطه‌ای، چک‌لیست، بخش تاشو |
| ▦ | **درج جدول** ← یک جدول ۳×۳ آمادهٔ ویرایش؛ نوار شناور ردیف و ستون را کم و زیاد می‌کند و پهنای ستون‌ها با موس کشیده می‌شود |
| 🔗 | **درج پیوند** ← پنل *ساخت پیوند* با دو فیلد **متن** و **نشانی** |
| 🖼 | **درج رسانه** ← عکس یا ویدیو (دو مورد یا بیشتر، اسلایدشو می‌شود)، فایل صوتی، موقعیت مکانی |
| Σ | **درج فرمول** ← فرمول را می‌پرسد و بلوک ریاضی می‌گذارد |
| ✦ | پالت درج — جست‌وجوی همهٔ بلوک‌ها و قالب‌ها با نام |
| 🗑 ➤ | پاک‌کردن پیام · ارسال (با کلیک راست: پیام غنی، پیش‌نویس یا ویرایش) |

نوار عنوان شامل چرخ‌دندهٔ تنظیمات با نقطهٔ وضعیت اتصال، کلید پیش‌نمایش زنده و کلید راست‌به‌چپِ
پیامی است که می‌نویسی.

> **دکمهٔ ایموجی وجود ندارد.** ایموجی سفارشی یک موجودیت مخصوص پرمیوم است و بات نمی‌تواند آن را با
> API پیام غنی بفرستد. ایموجی‌های معمولی یونیکد که از صفحه‌کلید تایپ می‌کنی مثل متن ساده ارسال می‌شوند.

---

## ✍️ چه چیزهایی می‌توانی بفرستی

| | |
|---|---|
| **متن** | پررنگ · کج · زیرخط‌دار · خط‌خورده · اسپویلر · هایلایت · زیرنویس · بالانویس · تک‌فاصله · فرمول درون‌خطی · پیوند |
| **بلوک‌ها** | عنوان H1 تا H6 · پاراگراف · نقل‌قول · نقل‌قول برجسته · بلوک کد با زبان · جداکننده · بخش تاشو · پاورقی · بلوک فرمول |
| **فهرست‌ها** | شماره‌دار · نقطه‌ای · چک‌لیست *(از طریق API جداگانهٔ `sendChecklist`)* |
| **جدول** | ردیف سرصفحه، سلول‌های قابل ویرایش، تغییر پهنای ستون با موس |
| **رسانه** | عکس · ویدیو · صدا · اسلایدشو · کلاژ · موقعیت مکانی |

و هنگام نوشتن:

- **پیش‌نمایش زنده** — حباب واقعی تلگرام، ساخته‌شده از همان بلوک‌هایی که ارسال می‌شوند
- **میان‌برهای مارک‌داون** — `## `، `> `، `- `، `1. `، ` ``` `، `**پررنگ**`، `` `کد` ``
- **پالت درج** — یک کادر جست‌وجو روی تمام بلوک‌ها و قالب‌ها
- **تم تیره و روشن**، رابط انگلیسی و فارسی، پشتیبانی کامل راست‌به‌چپ
- **شمارشگر کاراکتر** برای محدودیت ۳۲٬۷۶۸ تایی تلگرام

### حالت‌های ارسال

روی دکمهٔ ارسال کلیک راست کن:

| حالت | چه می‌کند |
|---|---|
| **پیام غنی** | `sendRichMessage` — مسیر معمول |
| **پیش‌نویس** | `sendRichMessageDraft` — پیش‌نمایش ۳۰ ثانیه‌ای، فقط چت خصوصی |
| **ویرایش** | `editMessageText` — پیام موجود را بازنویسی می‌کند (شناسه از تنظیمات) |

### کلیدهای میانبر

| | | | |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> ارسال | <kbd>Ctrl</kbd>+<kbd>K</kbd> پیوند | <kbd>Ctrl</kbd>+<kbd>P</kbd> پیش‌نمایش | <kbd>Ctrl</kbd>+<kbd>,</kbd> تنظیمات |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> پررنگ | <kbd>Ctrl</kbd>+<kbd>I</kbd> کج | <kbd>Ctrl</kbd>+<kbd>U</kbd> زیرخط‌دار | <kbd>Ctrl</kbd>+<kbd>E</kbd> تک‌فاصله |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> خط‌خورده | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> اسپویلر | <kbd>Ctrl</kbd>+<kbd>Z</kbd> بازگردانی | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> انجام دوباره |

---

## 🧩 چطور کار می‌کند

متد `sendRichMessage` فیلد `rich_message: { html | markdown }` می‌گیرد — دقیقاً یکی از این دو.
آرایهٔ `RichBlock` شکل **دریافتی** است؛ چیزی که بات از `Message.rich_message` می‌خواند، نه چیزی که
می‌فرستد. پس برنامه محتوای ویرایشگر را به دیالکت **Rich HTML** تلگرام تبدیل می‌کند:

```
سند TipTap (ProseMirror)
        │
        ▼
سریالایزر HTML  src/shared/html-serializer.js
   ├─ نگه می‌دارد  <b> <i> <u> <s> <code> <mark> <sub> <sup> <a>
   │              <p> <h1>…<h6> <ul> <ol> <li> <pre> <blockquote> <footer> <hr/>
   │              <table> <details> <img> <video> <audio>
   ├─ نگاشت       اسپویلر → <tg-spoiler>      نقل‌قول برجسته → <aside>
   │              فرمول → <tg-math> / <tg-math-block>
   │              گالری → <tg-collage> / <tg-slideshow>
   │              موقعیت → <tg-map lat long zoom/>
   └─ حذف         هر تگ و هر نوع نشانی که API مستند نکرده
        │
        ▼
   rich_message: { html, is_rtl?, skip_entity_detection? }
        │
        ├──► sendRichMessage        پیام غنی
        ├──► sendRichMessageDraft   پیش‌نویس ۳۰ ثانیه‌ای (فقط چت خصوصی، با draft_id)
        ├──► editMessageText        بازنویسی پیام موجود
        └──► sendChecklist          چک‌لیست، همیشه فراخوانی جداگانه
```

پیش از ارسال، سریالایزر خروجی را می‌شمارد و با محدودیت‌های مستند مقایسه می‌کند: ۳۲٬۷۶۸ کاراکتر،
۵۰۰ بلوک، ۵۰ فایل رسانه‌ای و ۲۰ ستون در جدول.

پیش‌نمایش زنده مسیر خودش را دارد: `block-parser.js` و `inline-parser.js` همان شکل
`RichBlock` / `RichText` را می‌سازند که تلگرام **برمی‌گرداند**، و حباب از روی آن رندر می‌شود.

<details>
<summary><strong>ویرایشگر ← Rich HTML</strong></summary>

| در ویرایشگر | روی سیم |
|---|---|
| عنوان H1 تا H6 | `<h1>`…`<h6>` |
| پاراگراف | `<p>` |
| نقل‌قول | `<blockquote>` (و `<cite>` برای منبع) |
| نقل‌قول برجسته | `<aside>` |
| بلوک کد | `<pre><code class="language-…">` |
| جداکننده | `<hr/>` |
| فهرست نقطه‌ای / شماره‌دار | `<ul>` / `<ol start="…">` |
| جدول | `<table bordered>` با `<th>` و `<td>` |
| بخش تاشو | `<details open><summary>` |
| پاورقی | `<footer>` |
| عکس / ویدیو / صدا | `<img src>` / `<video src>` / `<audio src>` |
| اسلایدشو / کلاژ | `<tg-slideshow>` / `<tg-collage>` |
| موقعیت مکانی | `<tg-map lat long zoom/>` |
| بلوک فرمول / درون‌خطی | `<tg-math-block>` / `<tg-math>` |
| چک‌لیست | جدا می‌شود و با `sendChecklist` می‌رود |

</details>

<details>
<summary><strong>نشانه‌های درون‌خطی</strong></summary>

| نشانه | روی سیم | موجودیت تلگرام |
|---|---|---|
| پررنگ / کج / زیرخط‌دار / خط‌خورده | `<b>` `<i>` `<u>` `<s>` | `RichTextBold`، `RichTextItalic`، `RichTextUnderline`، `RichTextStrikethrough` |
| اسپویلر | `<tg-spoiler>` | `RichTextSpoiler` |
| هایلایت | `<mark>` | `RichTextMarked` |
| تک‌فاصله | `<code>` | `RichTextCode` |
| زیرنویس / بالانویس | `<sub>` / `<sup>` | `RichTextSubscript` / `RichTextSuperscript` |
| پیوند | `<a href>` | `RichTextUrl` |
| فرمول درون‌خطی | `<tg-math>` | `RichTextMathematicalExpression` |

روی پیوندها فقط `http`، `https`، `mailto`، `tel`، `tg` و لنگر داخلی `#anchor` باقی می‌مانند؛ رسانه
هم فقط `http(s)` می‌پذیرد، دقیقاً همان‌طور که API می‌خواهد.

</details>

---

## 🔒 امنیت

توکن بات تنها رازِ این برنامه است و هرگز به پنجره‌ای که در آن تایپ می‌کنی نمی‌رسد.

```
Renderer (React)                     پردازشگر Main (Electron)
─────────────────                    ───────────────────────
✗ هرگز توکن را نگه نمی‌دارد            ✓ توکن با safeStorage رمزنگاری می‌شود
✗ هرگز به شبکه وصل نمی‌شود   ──IPC──► ✓ همهٔ درخواست‌های تلگرام از اینجا می‌روند
✓ فقط می‌داند «توکنی وجود دارد»        ✓ متد، شناسهٔ چت و زبان را اعتبارسنجی می‌کند
                                     ✓ تایم‌اوت ۳۰ ثانیه · سقف پاسخ ۱ مگابایت
```

| لایه | محافظت |
|---|---|
| ذخیرهٔ توکن | `safeStorage` — رمزنگاری با کلیدخانهٔ سیستم‌عامل در `settings.enc`؛ گذرواژهٔ پروکسی هم کنارش |
| پل IPC | `contextBridge` با `contextIsolation` — هیچ API نودی در رندرر نیست |
| اعتبارسنجی ورودی | فهرست سفید برای متدهای API، شناسهٔ چت و زبان |
| HTTP | تایم‌اوت ۳۰ ثانیه، سقف پاسخ ۱ مگابایت |
| نشانی‌ها | طرح‌های `javascript:`، `data:` و `vbscript:` رد می‌شوند |
| رندر | پیش‌نمایش المان‌های React می‌سازد — هرگز `innerHTML` |
| CSP | تگ Content-Security-Policy در `index.html` |

---

## 🛠 توسعه

```bash
npm run dev           # Vite + Electron با هات‌ریلود
npm test              # ۲۲۷ تست واحد (Vitest)
npm run lint          # ESLint، بدون هشدار
npm run format        # Prettier
npm run build         # نصب‌کنندهٔ ویندوز → dist/TelegramFreeRich-Setup-5.1.2.exe
npm run build:linux   # AppImage
```

<details>
<summary><strong>ساختار پروژه</strong></summary>

```
src/
├── main/                       پردازشگر اصلی Electron
│   ├── main.js                 پنجره، هندلرهای IPC، تنظیمات رمزنگاری‌شده
│   ├── preload.js              contextBridge — تنها سطح تماس رندرر
│   ├── net/proxy.js            تشخیص پروکسی سیستم / دستی / مستقیم
│   ├── net/request.js          درخواست از مسیر کرومیوم با خطاهای پروکسی‌آگاه
│   └── security/validation.js  فهرست سفید متد / شناسهٔ چت / زبان
│
├── renderer/                   رابط کاربری React
│   ├── App.jsx                 پوسته: state، منطق ارسال، میان‌برها
│   ├── components/
│   │   ├── TitleBar.jsx        نوار عنوان پنجرهٔ بدون قاب
│   │   ├── Toolbar.jsx         نوار هفت‌دکمه‌ای + منوها
│   │   ├── ActionMenu.jsx      رندر منو، تا دو سطح
│   │   ├── Popover.jsx         پنل شناور لنگرشده
│   │   ├── TableBubble.jsx     کنترل‌های شناور ردیف و ستون جدول
│   │   ├── InsertPalette.jsx   پالت جست‌وجوپذیر
│   │   ├── BottomBar.jsx       پالت · شمارشگر · پاک‌کردن · ارسال
│   │   ├── Preview.jsx         حباب زندهٔ تلگرام
│   │   ├── Settings.jsx        توکن، چت، زبان، پوسته
│   │   ├── Dialog.jsx          prompt / confirm / پنل پیوند مبتنی بر Promise
│   │   ├── Toast.jsx           اعلان‌ها
│   │   ├── Icons.jsx           مجموعهٔ SVG
│   │   ├── useTfrEditor.js     راه‌اندازی TipTap
│   │   └── extensions.js       نودها و مارک‌های سفارشی
│   ├── lib/editor-actions.js   یک رجیستری پشت همهٔ منوها
│   ├── i18n/                   en · fa · provider
│   └── styles/                 theme · app · toolbar · menu · editor · preview
│
└── shared/                     مشترک بین دو پردازشگر
    ├── block-types.js          انواع BlockType / InlineType
    ├── block-parser.js         DOM → Block State
    ├── inline-parser.js        DOM درون‌خطی → قطعه‌های سبک‌دار
    ├── html-serializer.js      DOM ویرایشگر → Rich HTML و بدنهٔ درخواست‌ها
    ├── block-manager.js        CRUD + undo/redo
    ├── constants.js            محدودیت‌ها و پیش‌فرض‌ها
    └── utils.js                sanitizeUrl، اعتبارسنجی، ابزارها

tests/unit/                     ۲۲۷ تست — سریالایزر HTML، پروکسی، بسته‌بندی، پارسرها،
                                یکسانی i18n، استایل‌ها، اعتبارسنجی
```

برای افزودن یک دستور کافی است **یک ورودی** به `src/renderer/lib/editor-actions.js` اضافه شود؛
منوها، پالت و تست‌ها همه از همان رجیستری می‌خوانند.

</details>

<details>
<summary><strong>اکستنشن‌های سفارشی TipTap</strong></summary>

| اکستنشن | نوع | خروجی HTML |
|---|---|---|
| Spoiler | mark | `<span data-spoiler>` |
| InlineMath | mark | `<span data-inline-math>` |
| PullQuote | node | `<blockquote data-pullquote>` |
| Details | node | `<details>` با بدنهٔ قابل ویرایش |
| Footer | node | `<footer>` |
| MathBlock | node | `div.tg-math` |
| MediaBlock | node | `<video>` / `<audio>` |
| GalleryBlock | node | `div.tg-gallery` — اسلایدشو یا کلاژ |
| MapBlock | node | `div.tg-map` |

</details>

---

## 📦 پشتهٔ فناوری

| لایه | انتخاب |
|---|---|
| پوستهٔ دسکتاپ | Electron 35 — پنجرهٔ بدون قاب، `safeStorage`، `contextBridge` |
| رابط کاربری | React 19 + Vite 6 |
| ویرایشگر | TipTap 2 (ProseMirror) |
| مدل داده | DOM ویرایشگر ← Rich HTML تلگرام (`rich_message.html`) |
| تست | Vitest 2 + jsdom |
| بسته‌بندی | electron-builder — نصب‌کنندهٔ NSIS، AppImage |
| CI | GitHub Actions — لینت، تست، بیلد |

---

<p align="center">
  <a href="CHANGELOG.md">تاریخچهٔ تغییرات</a> •
  <a href="Documentation.html">سند طراحی</a> •
  <a href="https://core.telegram.org/bots/api">مستندات Bot API</a>
</p>

<p align="center">MIT © Aporis3674</p>

<p align="center"><sub>بهترین چیزهای زندگی رایگان‌اند. دومین‌های بهترین هم رایگان‌اند، اگر از یک بات استفاده کنی.</sub></p>
