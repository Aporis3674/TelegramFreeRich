# TelegramFreeRich — Final Prompt (Advanced Version)

## Title
TelegramFreeRich — Free Rich Text Editor for Telegram
*"Because bots should not have more rights than humans"*

## Goal
Build a fully advanced WYSIWYG rich text editor as a standalone HTML file. Users create professional structured messages for Telegram without writing a single line of code, sent via Bot API. Must be on par with Notion/Coda/Obsidian, but completely free.

## Concept
Telegram introduced Rich Messages via Bot API 10.1 (June 11, 2026) for bots (free), but locked the same editor behind Premium for users. This project exposes that contradiction.

## Architecture
- Single-Page Application in one `index.html`
- No CDN, no external libs, no frameworks — pure CSS + JS
- Block-based (Notion-style): each element is an independent block
- PWA-ready: manifest.json + sw.js for offline
- State management via central object
- Components: Editor, Toolbar, Preview, SendPanel

## Editor
- contenteditable or EditContext API
- 3 modes: Normal, Focus (minimal UI), Read-only Preview
- Drag-and-drop media files
- Full undo/redo history
- Slash menu (/) for block insertion
- Auto-save to localStorage

## Toolbar (Floating, Smart)
- Appears on hover near top or on text selection
- Groups: Inline formatting, Links/Refs, Block elements, Lists, Tables, Media, Math
- Mobile: sticky bottom toolbar

## Preview Panel
- Real-time live preview
- Simulates actual Telegram message bubble (colors, spacing, font)
- Fullscreen mode available

## Send Panel
- Bot Token input (with show/hide toggle)
- Chat ID input (with tooltip guide)
- 3 send methods:
  1. `sendMessage` + `parse_mode=HTML` — basic formatting
  2. `sendRichMessage` + `InputRichMessage.blocks` — advanced (tables, collages, slideshows, maps, math, details, checklists)
  3. `sendRichMessageDraft` — streaming/temporary (30s, private chats only)
- Clear All button with fade animation
- Send button with loading animation
- Status feedback (success/error/warning)

## Visual Design
- Dark theme (default) + Light theme toggle
- Fonts: system stack + Fira Code/JetBrains Mono for code
- All inline SVG icons (no icon fonts)
- Micro-interactions: hover effects, ripple clicks, enter/exit animations
- Loading spinner on Send button
- Shake animation on invalid inputs

## Responsive
- Desktop (>1024px): 60/40 split (editor/preview), fixed toolbar
- Tablet (768-1024px): 50/50 split, collapsible toolbar
- Mobile (<768px): vertical stack, bottom sticky toolbar, simplified buttons

## Full Bot API 10.1 Support

### RichText (inline)
RichTextBold, RichTextItalic, RichTextUnderline, RichTextStrikethrough, RichTextSpoiler, RichTextMarked, RichTextCode, RichTextSubscript, RichTextSuperscript, RichTextUrl, RichTextEmailAddress, RichTextPhoneNumber, RichTextBankCardNumber, RichTextMention, RichTextTextMention, RichTextHashtag, RichTextCashtag, RichTextBotCommand, RichTextCustomEmoji, RichTextDateTime, RichTextMathematicalExpression, RichTextAnchor, RichTextAnchorLink, RichTextReference, RichTextReferenceLink

### RichBlock (structural)
RichBlockHeading (H1-H6), RichBlockBlockQuotation, RichBlockPullQuotation, RichBlockPreformatted, RichBlockCode, RichBlockDivider, RichBlockFooter, RichBlockDetails + RichBlockSummary, RichBlockList (bullet/numbered with start/type/reversed), RichBlockTaskList (checkboxes), RichBlockTable (bordered/striped, caption, colspan/rowspan, align/valign), RichBlockPhoto, RichBlockVideo, RichBlockAudio, RichBlockCollage + RichBlockCollageItem, RichBlockSlideshow + RichBlockSlideshowItem, RichBlockMap (lat/long/zoom)

### Conversion Flow
```
contenteditable DOM → DOM Parser → RichBlock[] → InputRichMessage.blocks → sendRichMessage()
```

## Advanced Features
- Real-time collaboration (WebSocket/WebRTC)
- AI text improvement (optional, with free API)
- Export: Markdown, HTML, PDF, JSON
- Import: Markdown file upload
- Templates: announcement, report, article, daily note
- Customization: font, size, colors via settings

## Constraints
- Single HTML file (except manifest.json + sw.js)
- No external resources
- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Max 32768 characters with colored counter
- Error handling for all network/API/input errors
- XSS protection (custom DOMPurify or textContent-first)

## Deliverables
1. `index.html` — complete app
2. `manifest.json` — PWA
3. `sw.js` — Service Worker
4. `README.md` — full documentation
5. Live demo via GitHub Pages

## Success Criteria
- Zero-code rich message creation
- All Bot API 10.1 features supported
- Fully responsive (mobile + desktop)
- Load time < 1 second
- Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- Open source community adoption

## Project Tagline
*"The best things in life are free. The second-best things are also free, if you use a bot."*
