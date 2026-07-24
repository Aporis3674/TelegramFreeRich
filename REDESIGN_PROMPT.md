# TelegramFreeRich — بازطراحی کامل پروژه

> **این پرامپت رو کپی کن و به هوش مصنوعی بده تا پروژه رو از صفر درست کنه.**

---

## ۱. معرفی پروژه

**TelegramFreeRich** یک اپلیکیشن دسکتاپ (Electron) برای ویرایش و ارسال پیام‌های فرمت‌شده غنی از طریق Telegram Bot API 10.1 هست. هدف اینه که هرکسی بتونه پیام‌های حرفه‌ای فرمت‌شده توی تلگرام بفرسته بدون نیاز به Premium.

تلگرام قابلیت ویرایش متن غنی رو فقط برای کاربران Premium فعال کرده، ولی Bot API 10.1 همین قابلیت رو به صورت رایگان در اختیار بات‌ها قرار میده. این اپ این شکاف رو پر می‌کنه.

**نام پروژه:** TelegramFreeRich
**ورژن فعلی:** 2.0.0 (ولی app.js میگه v4.0 — ورژن‌ها ناهماهنگن)
**لایسنس:** MIT
**نویسنده:** Aporis3674

---

## ۲. معماری فعلی پروژه (مشکلات)

### فایل‌های منبع (899 خط در 5 فایل):
```
src/
  main/
    main.js          (171 خط) — فرآیند اصلی Electron
    preload.js       (16 خط)  — پل امن IPC
  renderer/
    app.js           (432 خط) — کل منطق اپلیکیشن
    index.html       (164 خط) — لایوت UI
    styles/
      app.css        (116 خط) — استایل‌ها و تم
```

### مشکلات بحرانی فعلی:

#### الف) امنیت — نشت توکن (بحرانی‌ترین مشکل)
- `main.js` یک لایه امن IPC ساخته که توکن هرگز از فرآیند اصلی خارج نشه
- ولی `app.js` در خطوط 315 و 346-356 مستقیماً با `fetch()` و توکن خام API صدا میزنه
- توکن در `localStorage` به صورت plain text ذخیره میشه
- `preload.js` یک `window.app.api()` امن میسازه ولی هرگز استفاده نمیشه

#### ب) معماری — ناهماهنگی مستندات و کد
- `Documentation.html` میگه معماری درست: `contenteditable DOM → Block State (JSON[]) → sendRichMessage(blocks)`
- `CHANGELOG.md` v1.0.0 میگه: "Block-based editor architecture (Notion-like draggable cards)"
- کد واقعی: `contenteditable DOM → htmlToMarkdown() regex → sendRichMessage(markdown)`
- هیچ block state management، drag-and-drop، یا card-based UI وجود نداره

#### ج) تست — صفر تست
- هیچ فایل تستی وجود نداره
- هیچ framework تستی (Jest, Vitest, Playwright) نصب نیست
- تابع `htmlToMarkdown()` با 25+ regex بدون هیچ تستی
- CI هم تست اجرا نمی‌کنه

#### د) کیفیت کد
- کل منطق renderer در یک فایل 432 خطی (`app.js`) — God module
- State management با یک object ساده global بدون event bus
- `document.execCommand()` deprecated شده
- هیچ TypeScript، ESLint، یا Prettier نیست
- بدون input validation در IPC handlers
- بدون timeout روی درخواست‌های HTTP

#### ه) ویژگی‌های مفقود
- Live preview panel (در مستندات هست ولی پیاده نشده)
- Drag-and-drop blocks
- Block-based editor (Notion-like)
- RTL support (فلاگ هست ولی UI نداره)
- Language switching (selector هست ولی کار نمیکنه)
- Proper checklist (فقط HTML checkbox میذاره، sendChecklist API صدا نمیزنه)
- Slideshow, Collage, Map
- Focus mode
- Undo/Redo stack

---

## ۳. Telegram Bot API 10.1 — چیزی که باید پیاده بشه

### ساختار API:
API تلگرام برای پیام‌های غنی از **آرایه‌ای از بلوک‌های ساختاریافته JSON** استفاده میکنه، نه Markdown ساده.

### درخواست `sendRichMessage`:
```json
{
  "chat_id": "...",
  "rich_message": {
    "blocks": [
      { "type": "heading", "level": 2, "text": "عنوان" },
      { "type": "paragraph", "text": "متن با **بولد** و *ایتالیک*" },
      { "type": "code_block", "language": "javascript", "text": "console.log('hi')" },
      { "type": "table", "header": ["ستون ۱", "ستون ۲"], "rows": [["۱", "۲"]] },
      { "type": "list", "style": "bullet", "items": ["آیتم ۱", "آیتم ۲"] },
      { "type": "details", "summary": "باز کن", "content": "محتوای مخفی" },
      { "type": "divider" },
      { "type": "footer", "text": "پاورقی ۱" }
    ],
    "is_rtl": false,
    "skip_entity_detection": false
  }
}
```

### درخواست `sendChecklist` (جداگانه!):
```json
{
  "chat_id": "...",
  "checklist": {
    "items": [
      { "text": "انجام شده", "done": true },
      { "text": "انجام نشده", "done": false }
    ]
  }
}
```

### انواع Inline Text:
| نوع | نام API |
|-----|---------|
| Bold | `RichTextBold` |
| Italic | `RichTextItalic` |
| Underline | `RichTextUnderline` |
| Strikethrough | `RichTextStrikethrough` |
| Spoiler | `RichTextSpoiler` |
| Marked/Highlight | `RichTextMarked` |
| Subscript | `RichTextSubscript` |
| Superscript | `RichTextSuperscript` |
| Code | `RichTextCode` |
| Link | `RichTextLink` |
| Mention | `RichTextMention` |
| Hashtag | `RichTextHashtag` |
| Bot Command | `RichTextBotCommand` |
| Phone | `RichTextPhoneNumber` |
| Email | `RichTextEmailAddress` |
| Bank Card | `RichTextBankCardNumber` |
| Custom Emoji | `RichTextCustomEmoji` |

### انواع بلوک‌ها:
| نوع | نام API |
|-----|---------|
| Paragraph | `InputRichBlockParagraph` |
| Heading H1-H6 | `InputRichBlockHeading` |
| Blockquote | `InputRichBlockBlockquote` |
| Pull Quote | `InputRichBlockAside` |
| Code Block | `InputRichBlockPreformatted` |
| Divider | `InputRichBlockDivider` |
| List (Bullet/Numbered) | `InputRichBlockList` |
| Table | `InputRichBlockTable` |
| Details/Collapsible | `InputRichBlockDetails` |
| Footer | `InputRichBlockFooter` |
| Photo | `InputRichBlockPhoto` |
| Video | `InputRichBlockVideo` |
| Audio | `InputRichBlockAudio` |
| Slideshow | `InputRichBlockSlideshow` |
| Collage | `InputRichBlockCollage` |
| Map | `InputRichBlockMap` |
| Math (Block) | `InputRichBlockMath` |
| Math (Inline) | `RichTextMath` |

---

## ۴. نقشه راه بازطراحی

### فاز ۱: زیرساخت و امنیت (اولویت بالا)

#### ۱.۱ اصلاح امنیت
- **حذف کامل `fetch()` مستقیم از renderer** — همه درخواست‌ها از طریق `window.app.api()` باید بره
- **حذف `localStorage` برای ذخیره توکن** — فقط `safeStorage` در main process
- **مهاجرت `initSettings()`** به IPC: `save-settings` و `load-settings` جایگزین localStorage
- **مهاجرت `testConnection()`** به IPC: `window.app.testConnection()` جایگزین fetch مستقیم
- **مهاجرت `sendMessage()`** به IPC: `window.app.api(method, body)` جایگزین fetch مستقیم
- **حذف کامل `state.settings.token`** از renderer — renderer فقط `tokenSet: boolean` باید بدونه
- **افزودن input validation** در main.js برای token (فرمت regex)، chatId (عددی یا @username)، lang
- **افزودن timeout** (30 ثانیه) به درخواست‌های HTTPS
- **افزودن response size limit** (1MB) برای جلوگیری از memory exhaustion
- **افزودن CSP meta tag** به index.html
- **sanitization URL** در `insertMedia()` — جلوگیری از XSS

#### ۱.۲ اصلاح ساختار پروژه
- یکسان‌سازی ورژن‌ها (package.json: 2.0.0, app.js: v4.0, CHANGELOG: v2.1.0)
- اضافه کردن `electron-store` یا `keytar` به عنوان runtime dependency
- پین کردن نسخه Electron به جای `^35.0.0`
- اضافه کردن ESLint + Prettier
- اضافه کردن `.editorconfig`

### فاز ۲: معماری Block State

#### ۲.۱ ساختار Block State
```javascript
// هر بلوک یک object مستقل با type مشخص
class Block {
  id: string;          // UUID
  type: string;        // 'paragraph' | 'heading' | 'code_block' | ...
  content: any;        // بسته به type
  children?: Block[];  // برای لیست‌ها و nested blocks
}
```

#### ۲.۲ Block Manager
یک کلاس جداگانه که:
- لیست بلوک‌ها رو مدیریت کنه
- CRUD operations داشته باشه (add, remove, update, move)
- Undo/Redo stack داشته باشه
- Serialization به JSON برای API فراهم کنه
- Event emitter باشه برای بروزرسانی UI

#### ۲.۳ HTML DOM → Block State Parser
- تبدیل DOM `contenteditable` به آرایه Block State
- هر عنصر DOM به معادل Block type نقشه‌برداری بشه
- nested elements (متن inline در block) به `RichText*` objects تبدیل بشن

#### ۲.۴ Block State → API JSON Serializer
- تبدیل Block State به `InputRichBlock*` objects
- اضافه کردن type guards و validation
- handle کردن edge cases (blocks خالی، nested نادرست)

### فاز ۳: UI بازطراحی

#### ۳.۱ Block-Based Editor (Notion-like)
- هر بلوک یک کارت مستقل باشه
- Drag handle برای هر بلوک
- Drag-to-reorder با drag and drop API
- Block type indicator (آیکون کنار هر بلوک)
- Inline editing در هر بلوک

#### ۳.۲ Live Preview Panel
- پنل سمت راست (split-pane)
- نمایش Telegram-style message bubble
- بروزرسانی real-time هنگام تایپ
- Hover روی بلوک در preview → هایلایت بلوک متناظر در editor

#### ۳.۳ Toolbar بازطراحی‌شده
سه گروه بصری:
1. **Inline:** Bold, Italic, Underline, Strikethrough, Code, Spoiler, Marked, Sub, Sup
2. **Block:** Bullet List, Numbered List, Checklist (جداگانه!), Link, Code Block, Table, Details, Divider, Footnote
3. **Media & Special:** Image, Map, Slideshow, Collage, Math

#### ۳.۴ RTL Support
- دکمه toggle در header
- `dir="rtl"` روی editor
- تست با متن فارسی و عربی

#### ۳.۵ Language Switching
- فایل‌های locale (en.json, fa.json)
- سیستم i18n ساده برای رندر UI strings
- ذخیره زبان انتخاب شده

### فاز ۴: تست و کیفیت

#### ۴.۱ Unit Tests (Vitest)
تست‌های ضروری:
- `htmlToMarkdown()` — همه 25+ regex با edge cases
- `BlockManager` — CRUD operations
- `BlockStateParser` — DOM to Block State
- `BlockSerializer` — Block State to API JSON
- `sanitizeUrl()` — XSS prevention
- `validateToken()` — format validation
- IPC handlers — main.js

#### ۴.۲ Integration Tests (Playwright)
- تست ارسال پیام از UI تا API
- تست ذخیره/بازیابی تنظیمات رمزنگاری شده
- تست connection test
- تست theme toggle
- تست RTL mode

#### ۴.۳ E2E Tests
- ارسال پیام واقعی از طریق بات
- دریافت و تأیید پیام در تلگرام

### فاز ۵: Build و Deploy

#### ۵.۱ CI/CD
- اضافه کردن مرحله test به GitHub Actions
- اضافه کردن lint step
- اضافه کردن Linux build (فعلی فقط Windows)
- اضافه کردن code signing
- Trigger روی PR هم (نه فقط tag)

#### ۵.۲ Packaging
- اضافه کردن macOS build
- اضافه کردن auto-update با `electron-updater`
- اضافه کردن code signing برای Windows و macOS

---

## ۵. منابع و مراجع

### Telegram Bot API:
- **docs:** https://core.telegram.org/bots/api#sendrichmessage
- **Bot API 10.1 (June 2026):** معرفی sendRichMessage، sendRichMessageDraft، sendChecklist
- **InputRichBlock* types:** اسناد رسمی API
- **RichText* types:** اسناد رسمی API

### Electron:
- **docs:** https://www.electronjs.org/docs
- **security checklist:** https://www.electronjs.org/docs/latest/tutorial/security
- **safeStorage:** https://www.electronjs.org/docs/latest/api/safe-storage
- **contextBridge:** https://www.electronjs.org/docs/latest/tutorial/context-isolation
- **electron-builder:** https://www.electron.build/

### Editor Frameworks (برای جایگزینی contenteditable):
- **TipTap** (tiptap.dev) — Rich text editor بر اساس ProseMirror، ساختار block-based، extension system عالی
- **ProseMirror** (prosemirror.net) — Lower-level، بیشتر control
- **EditorJS** (editorjs.io) — Block-based مثل Notion
- **Slate** (slatejs.org) — Framework برای build editorهای سفارشی

**پیشنهاد:** TipTap بهترین گزینه‌ست — built-in support برای blocks، extensions، و undo/redo. مستقیماً با JSON output کار میکنه که با API تلگرام همخوانی داره.

### تست:
- **Vitest** (vitest.dev) — سریع‌ترین test runner، سازگار با TypeScript
- **Playwright** (playwright.dev) — E2E تست برای Electron apps
- **electron-playwright** — تست Electron با Playwright

### کیفیت کد:
- **ESLint** (eslint.org)
- **Prettier** (prettier.io)
- **TypeScript** (typescriptlang.org) — پیشنهاد مهاجرت از JS به TS

### UI/UX:
- **Tailwind CSS** (tailwindcss.com) — سریع‌تر styling
- **shadcn/ui** (ui.shadcn.com) — component library (اگر از React استفاده بشه)
- **Lucide Icons** (lucide.dev) — آیکون‌های مینیمال

---

## ۶. مشخصات فنی دقیق

### ساختار فایل‌های پیشنهادی:
```
src/
  main/
    main.js                 — Window management + app lifecycle
    ipc/
      handlers.js           — All IPC handlers (tg-api, save-settings, etc.)
      telegram.js           — Telegram API wrapper with timeout + retry
    security/
      settings-store.js     — Encrypted settings via safeStorage
      validation.js         — Input validation for all IPC channels
    preload.js              — Secure bridge (contextBridge)

  renderer/
    editor/
      editor-core.js        — TipTap/ProseMirror editor initialization
      block-manager.js      — Block state CRUD + undo/redo
      block-parser.js       — DOM → Block State
      block-serializer.js   — Block State → API JSON
      extensions/           — Custom editor extensions
        spoiler.js
        marked.js
        math.js
        details.js
        table.js
        checklist.js
    ui/
      toolbar.js            — Toolbar component
      preview.js            — Live preview panel
      settings-panel.js     — Settings modal
      popup-menu.js         — Popup menu system
      toast.js              — Notification system
    i18n/
      en.json               — English strings
      fa.json               — Persian strings
      index.js              — i18n loader
    services/
      api-client.js         — IPC-based API client (no direct fetch!)
      state-manager.js      — Centralized state management
    styles/
      globals.css           — CSS variables, reset, base
      editor.css            — Editor-specific styles
      toolbar.css           — Toolbar styles
      preview.css           — Preview panel styles
      themes/
        dark.css
        light.css
    index.html
    app.js                  — Entry point, initializes all modules

  shared/
    types.js                — Shared type definitions (JSDoc)
    constants.js            — App constants (limits, defaults)
    utils.js                — Shared utilities

tests/
  unit/
    block-parser.test.js
    block-serializer.test.js
    block-manager.test.js
    html-to-markdown.test.js
    validation.test.js
    api-client.test.js
  integration/
    ipc-handlers.test.js
    settings-store.test.js
  e2e/
    send-message.test.js
    editor-interaction.test.js

config/
  eslint.config.js
  prettier.config.js
  tsconfig.json
  vitest.config.js
  playwright.config.js
```

### مهاجرت از JS به TS (پیشنهادی):
- فاز ۱: فقط shared/ و security/ رو TypeScript کن
- فاز ۲: IPC layer رو TypeScript کن
- فاز ۳: Editor modules رو TypeScript کن
- فاز ۴: UI components رو TypeScript کن

### State Management Pattern:
```javascript
// state-manager.js — ساده و بدون framework
class StateManager {
  #state = {};
  #listeners = new Map();

  get(key) { return this.#state[key]; }

  set(key, value) {
    this.#state[key] = value;
    this.#notify(key, value);
  }

  subscribe(key, callback) {
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key).add(callback);
    return () => this.#listeners.get(key).delete(callback);
  }

  #notify(key, value) {
    this.#listeners.get(key)?.forEach(cb => cb(value));
  }
}
```

### IPC Contract (بین main و renderer):
```typescript
// main → renderer (فقط اینا رو renderer میفهمه)
interface SettingsData {
  tokenSet: boolean;    // فقط boolean، نه خود توکن!
  chatId: string;
  lang: string;
}

// renderer → main
interface SaveSettingsPayload {
  token?: string;
  chatId?: string;
  lang?: string;
}

interface TelegramAPIPayload {
  method: string;
  body: Record<string, any>;
}
```

---

## ۷. قوانین توسعه

### قانون ۱: امنیت اول
- توکن هرگز نباید وارد renderer بشه
- همه HTTP درخواست‌ها فقط از main process
- `safeStorage` برای ذخیره credential
- input validation برای همه IPC channels

### قانون ۲: تست اجباری
- هر تابع خالص باید unit test داشته باشه
- هر IPC handler باید integration test داشته باشه
- E2E تست قبل از هر release
- پوشش تست حداقل 80%

### قانون ۳: مستندات به‌روز
- README باید با کد هماهنگ باشه
- CHANGELOG برای هر release
- JSDoc برای همه public functions
- Type definitions برای API contracts

### قانون ۴: کیفیت کد
- ESLint zero warnings
- Prettier consistent formatting
- Max file size: 300 lines (تقسیم modules)
- Max function size: 50 lines
- Naming: descriptive, no abbreviations

### قانون ۵: یکسان‌سازی ورژن
- SemVer در package.json
- CHANGELOG به‌روز
- Git tags برای هر release

---

## ۸. چک‌لیست نهایی

- [ ] توکن فقط در main process (هیچ fetch در renderer)
- [ ] Input validation در همه IPC handlers
- [ ] Timeout + size limit روی HTTP requests
- [ ] CSP meta tag در HTML
- [ ] XSS sanitization در insertMedia
- [ ] Block State architecture (JSON[] نه Markdown)
- [ ] Live preview panel
- [ ] Drag-and-drop blocks
- [ ] Undo/Redo stack
- [ ] RTL support با UI toggle
- [ ] Language switching (en/fa)
- [ ] Checklist → sendChecklist API (جداگانه)
- [ ] Unit tests (Vitest) — حداقل 80% coverage
- [ ] Integration tests (Playwright)
- [ ] ESLint + Prettier configured
- [ ] TypeScript migration plan
- [ ] CI: lint + test + build (Windows + Linux)
- [ ] Code signing
- [ ] Auto-update mechanism
- [ ] README صادقانه (بدون claim ویژگی‌های مفقود)
- [ ] CHANGELOG به‌روز
- [ ] ورژن‌ها یکسان

---

## ۹. اولویت‌بندی اجرا

**هفته ۱-۲: امنیت + زیرساخت**
- اصلاح token leak
- اضافه کردن ESLint/Prettier
- اضافه کردن Vitest + اولین تست‌ها
- یکسان‌سازی ورژن‌ها

**هفته ۳-۴: معماری Block State**
- Block Manager
- DOM Parser
- API Serializer
- Unit tests

**هفته ۵-۶: UI بازطراحی**
- Live preview panel
- Block-based editor (Drag & Drop)
- RTL support
- Language switching

**هفته ۷-۸: تست + Build**
- Integration tests
- E2E tests
- CI/CD بازطراحی
- Code signing + auto-update
- Release documentation

---

> **این پرامپت کامله. هر هوش مصنوعی‌ای که این رو بگیره، دقیقاً میدونه چیکار باید بکنه، از کجا شروع کنه، و چه چیزایی نباید فراموش بشه.**
