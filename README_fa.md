<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/telegram.svg" width="120" alt="TelegramFreeRich">
</p>

<h1 align="center">تله‌گرام‌فری‌ریچ</h1>

<p align="center"><strong>ویرایشگر متن غنی رایگان برای تلگرام — نسخه دسکتاپ</strong></p>
<p align="center">چون بات‌ها نباید از انسان‌ها حقوق بیشتری داشته باشند.</p>

<p align="center"><a href="README.md">[ English ]</a></p>

<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/github/license/Aporis3674/TelegramFreeRich" alt="License">
  <img src="https://img.shields.io/badge/%D8%B1%D8%A7%DB%8C%DA%AF%D8%A7%D9%86-success" alt="Free">
</p>

---

## دانلود

| پلتفرم | دانلود |
|---------|--------|
| **ویندوز** | [TelegramFreeRich-Setup.exe](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) |

ویندوز ۱۰ یا بالاتر. نیازی به نصب Node.js یا سایر وابستگی‌ها نیست.

## این پروژه چیه؟

تلگرام در ژوئن ۲۰۲۶ ویرایشگر متن غنی معرفی کرد (Bot API 10.1)، اما فقط برای کاربران Premium. در حالی که دقیقاً همان API به بات‌ها همان قابلیت‌ها را به صورت رایگان می‌دهد.

این اپ دسکتاپ به هر کسی اجازه می‌دهد -- نه فقط مشترکین Premium -- پیام‌های حرفه‌ای و قالب‌بندی شده از طریق Bot API تلگرام ارسال کند.

بدون نیاز به کدنویسی. بدون نیاز به Premium. بدون نیاز به سرور.

## قابلیت‌ها

### قالب‌بندی درون‌خطی
- پررنگ، کج، زیرخط، خط‌خورده
- اسپویلر، هایلایت (Marked)، کد درون خطی
- زیرنویس، بالانویس
- لینک‌ها (با دیالوگ URL)

### المان‌های بلوکی
- سرتیتر H1 تا H6
- نقل‌قول با ذکر منبع، نقل‌قول برجسته (Pull Quote)
- بلوک کد با انتخاب زبان
- خط جداکننده
- بلوک تاشو (جزئیات)

### لیست‌ها
- لیست گلوله‌ای
- لیست شماره‌دار
- چک‌لیست *(با API جداگانه)*

### جدول
- سلول‌های قابل ویرایش
- دکمه‌های افزودن ردیف/ستون

### رسانه
- تصویر (URL)
- ویدیو، صدا
- اسلایدشو (چند تصویر)
- نقشه OpenStreetMap

### ریاضیات
- فرمول درون خطی
- فرمول بلوکی

### اتصال به API
- ارسال با `sendRichMessage` و بلوک‌های `InputRichBlock*`
- ویرایش پیام با `editMessageText` + `rich_message`
- ارسال پیش‌نویس با `sendRichMessageDraft` (۳۰ ثانیه)
- چک‌لیست با `sendChecklist` (API جداگانه)
- دکمه تست اتصال (`getMe`)

### امکانات ویرایشگر
- **ویرایشگر بلوک‌محور** -- هر المان یه کارت قابل جابه‌جایی (شبیه Notion)
- پیش‌نمایش زنده با حباب پیام تلگرام
- تم تاریک (پیش‌فرض) + تم روشن
- نوار ابزار ۳ گروهی: درون‌خطی، بلوک، رسانه
- منوی درج بلوک
- کلیدهای میانبر (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K, Ctrl+E)
- کشیدن و رها کردن فایل‌های رسانه
- شمارشگر کاراکتر (حداکثر ۳۲۷۶۸)
- پنل تنظیمات (توکن ربات، شناسه چت، زبان)
- حالت فوکوس
- دکمه پاک کردن همه
- اعلان‌های توست
- جابه‌جایی بلوک‌ها با drag-and-drop

## معماری

**تفاوت حیاتی با نسخه ۱:** این نسخه از **state بلوک‌محور JSON** به جای رشته‌های مارکداون استفاده می‌کند. هر المان پیام یه بلوک مستقل JSON است که با API واقعی تلگرام مطابقت دارد.

```
State بلوک‌ها (JSON[])               Telegram Bot API 10.1
  +-----------+                        +------------------+
  | paragraph |--- متن پاراگراف        | InputRichMessage |
  | heading   |--- سطح، متن            |   blocks: [      |
  | code-block|--- زبان، کد           |     {paragraph}  |
  | table     |--- سلول‌ها[][]         |     {heading}    |
  | list      |--- سبک، آیتم‌ها[]     |     {pre}        |
  | details   |--- خلاصه، محتوا        |     {table}      |
  | image     |--- URL، کپشن          |     {list}       |
  | video     |--- URL، کپشن          |     {details}    |
  | slideshow |--- تصاویر[]           |     {photo}      |
  | map       |--- عرض، طول، زوم       |     {video}      |
  | math      |--- فرمول               |     {map}        |
  | divider   |                        |     {divider}    |
  | pull-quote|--- متن، منبع          |     {aside}      |
  | footer    |--- متن                 |     {footer}     |
  +-----------+                        +------------------+
        |
        v
  چک‌لیست‌ها جداگانه با sendChecklist ارسال می‌شوند
```

## نصب

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر (فقط برای ساخت از سورس)
- یک ربات تلگرام (از @BotFather بگیرید)
- شناسه چت (کانال یا گروه)

### شروع سریع (دانلود)

1. آخرین نسخه را از [صفحه دانلود](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) دانلود کنید
2. `TelegramFreeRich-Setup.exe` را اجرا کنید
3. اپ را باز کنید
4. روی تنظیمات (آیکون چرخ دنده) کلیک کنید
5. توکن ربات را وارد کنید (از @BotFather)
6. شناسه چت را وارد کنید
7. «تست اتصال» را بزنید
8. شروع به نوشتن کنید و «ارسال» را بزنید

### از سورس

```bash
git clone https://github.com/Aporis3674/TelegramFreeRich.git
cd TelegramFreeRich
npm install
npm start
```

## نحوه استفاده

۱. پیام خود را در ویرایشگر بنویسید (پنل سمت چپ)
۲. از نوار ابزار برای فرمت‌بندی استفاده کنید
۳. پیش‌نمایش زنده در سمت راست ببینید
۴. «ارسال» را بزنید

### حالت‌های ارسال

| حالت | دکمه | زمان استفاده |
|------|-------|--------------|
| Rich | ارسال | پیام فرمت‌شده (توصیه می‌شود) |
| Draft | Draft | پیش‌نمایش ۳۰ ثانیه‌ای (فقط چت خصوصی) |
| Edit | Edit | ویرایش پیام موجود (شناسه پیام را وارد کنید) |

### گروه‌های نوار ابزار

| گروه | دکمه‌ها |
|-------|---------|
| **درون‌خطی** | پررنگ، کج، زیرخط، خط‌خورده، کد، اسپویلر، هایلایت، زیرنویس، بالانویس |
| **بلوک** | سرتیتر H1-H3، لیست گلوله‌ای، لیست شماره‌دار، چک‌لیست، لینک، کد بلند، جدول، تاشو، جداکننده، پانویس |
| **رسانه** | تصویر، ویدیو، نقشه، اسلایدشو، ریاضیات |

## بیلد

### ویندوز

```bash
npm run build
# خروجی: dist/TelegramFreeRich-Setup-1.0.0.exe
```

### لینوکس

```bash
npm run build:linux
```

## انواع Bot API 10.1 (تست شده)

### بلوک‌ها
`paragraph`, `heading`, `blockquote`, `pre`, `divider`, `list`, `footer`, `table`, `photo`, `video`, `audio`, `slideshow`, `map`, `aside`, `details`

### درون‌خطی‌ها
`bold`, `italic`, `underline`, `strikethrough`, `spoiler`, `code`, `marked`, `subscript`, `superscript`, `url`, `mention`, `text_mention`, `anchor`, `reference`

### چک‌لیست (API جداگانه)
`sendChecklist` با `InputChecklist{ items: [{text, checked}] }`

## کلیدهای میانبر

| کلید | عملکرد |
|------|--------|
| Ctrl+B | پررنگ |
| Ctrl+I | کج |
| Ctrl+U | زیرخط |
| Ctrl+K | درج لینک |
| Ctrl+E | کد درون خطی |

## تکنولوژی

| لایه | تکنولوژی |
|------|-----------|
| پوسته دسکتاپ | Electron 35 |
| فرانت‌اند | HTML + CSS + JavaScript خالص |
| مدل داده | Block State (JSON array) |
| خروجی | InputRichMessage.blocks[] |
| تم | متغیرهای CSS (تاریک + روشن) |
| پکیج‌بندی | electron-builder (NSIS) |

## ساختار پروژه

```
TelegramFreeRich/
  src/
    main/
      main.js           # پردازشگر اصلی Electron
      preload.js        # پل ارتباطی امن IPC
    renderer/
      index.html        # رابط کاربری
      app.js            # هسته: state بلوک‌ها، ویرایشگر، API
      styles/
        app.css         # تم تاریک/روشن، لایوت
  Documentation.html    # مرجع API و انواع تست شده
  Specification.md      # مشخصات طراحی فارسی
  package.json          # وابستگی‌ها و تنظیمات ساخت
```

## مجوز

MIT

---

> بهترین چیزهای زندگی رایگان هستند. دومین چیزهای خوب هم رایگان هستند -- اگر از یه بات استفاده کنید.
