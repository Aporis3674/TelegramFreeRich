<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/telegram.svg" width="110" alt="TelegramFreeRich">
</p>

<h1 align="center">تله‌گرام‌فری‌ریچ</h1>

<p align="center"><strong>ویرایشگر متن غنی تلگرام — برای همه، بدون پرمیوم.</strong></p>
<p align="center"><em>چون بات‌ها نباید از انسان‌ها حقوق بیشتری داشته باشند.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.1.1-2ca5e0" alt="نسخه ۴٫۱٫۱">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-2ca5e0?logo=telegram&logoColor=white" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Electron-35-47848f?logo=electron&logoColor=white" alt="Electron 35">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TipTap-2-8b5cf6" alt="TipTap 2">
  <img src="https://img.shields.io/badge/tests-151%20passing-4fc3a1" alt="۱۵۱ تست">
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
[آخرین انتشار](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) بگیر —
`TelegramFreeRich-Setup-*.exe` برای ویندوز و `TelegramFreeRich-*.AppImage` برای لینوکس
(اجازهٔ اجرا بده و اجرا کن) — یا از سورس شروع کن:

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

پیام‌های غنی تلگرام **مارک‌داون نیستند**. این API آرایه‌ای از اشیای ساختاریافتهٔ `InputRichBlock*`
می‌خواهد، و برنامه دقیقاً همین را می‌سازد — هم بلوک‌ها و هم قطعه‌های سبک‌دار داخلشان:

```
سند TipTap (ProseMirror)
        │
        ▼
پارسر بلوک ────────────────────────────────► Block State (JSON[])
   ├─ سطح بلوک     پاراگراف، عنوان، جدول، چک‌لیست، رسانه، …
   └─ سطح درون‌خطی  قطعه‌های { text, marks[], href? }
        │
        ▼
سریالایزر بلوک
   ├─ blocks     → InputRichBlock*
   └─ rich_text  → RichText* تودرتو   (پررنگ داخل کج داخل پیوند)
        │
        ├──► sendRichMessage        پیام غنی
        ├──► sendRichMessageDraft   پیش‌نویس ۳۰ ثانیه‌ای
        └──► sendChecklist          چک‌لیست، همیشه فراخوانی جداگانه
```

<details>
<summary><strong>انواع بلوک ← API تلگرام</strong></summary>

| بلوک | نوع API |
|---|---|
| paragraph | `InputRichBlockParagraph` |
| heading | `InputRichBlockHeading` |
| blockquote | `InputRichBlockBlockquote` |
| pullquote | `InputRichBlockAside` |
| code_block | `InputRichBlockPreformatted` |
| divider | `InputRichBlockDivider` |
| list | `InputRichBlockList` |
| table | `InputRichBlockTable` |
| details | `InputRichBlockDetails` |
| footer | `InputRichBlockFooter` |
| photo / video / audio | `InputRichBlockPhoto` / `…Video` / `…Audio` |
| slideshow / collage | `InputRichBlockSlideshow` / `InputRichBlockCollage` |
| map | `InputRichBlockMap` |
| math_block | `InputRichBlockMath` |
| checklist | جداگانه با `sendChecklist` |

</details>

<details>
<summary><strong>نشانه‌های درون‌خطی ← اشیای RichText</strong></summary>

| نشانه | نوع API |
|---|---|
| پررنگ / کج / زیرخط‌دار / خط‌خورده | `RichTextBold`، `RichTextItalic`، `RichTextUnderline`، `RichTextStrikethrough` |
| اسپویلر | `RichTextSpoiler` |
| هایلایت | `RichTextMarked` |
| کد | `RichTextCode` |
| زیرنویس / بالانویس | `RichTextSubscript` / `RichTextSuperscript` |
| پیوند | `RichTextLink` (شامل `url`) |
| ریاضی | `RichTextMath` |

قطعه‌ای که چند نشانه دارد از درون به بیرون تودرتو می‌شود؛ یعنی `**_کلمه_**` می‌شود
`italic( bold( text ) )`.

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
| ذخیرهٔ توکن | `safeStorage` — رمزنگاری با کلیدخانهٔ سیستم‌عامل، روی دیسک در `settings.enc` |
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
npm test              # ۱۵۱ تست واحد (Vitest)
npm run lint          # ESLint، بدون هشدار
npm run format        # Prettier
npm run build         # نصب‌کنندهٔ ویندوز → dist/TelegramFreeRich-Setup-4.1.1.exe
npm run build:linux   # AppImage
```

<details>
<summary><strong>ساختار پروژه</strong></summary>

```
src/
├── main/                       پردازشگر اصلی Electron
│   ├── main.js                 پنجره، هندلرهای IPC، درخواست‌های تلگرام
│   ├── preload.js              contextBridge — تنها سطح تماس رندرر
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
    ├── block-serializer.js     Block State → JSON تلگرام
    ├── block-manager.js        CRUD + undo/redo
    ├── constants.js            محدودیت‌ها و پیش‌فرض‌ها
    └── utils.js                sanitizeUrl، اعتبارسنجی، ابزارها

tests/unit/                     ۱۵۱ تست — پارسرها، سریالایزر، رجیستری،
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
| مدل داده | Block State ← `InputRichBlock*` / `RichText*` |
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
