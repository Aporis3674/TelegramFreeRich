# Changelog

## [1.0.0] - 2026-07-23

### Added
- Block-based editor architecture (Notion-like draggable cards)
- Live preview panel with Telegram-style message bubble
- Dark/Light theme toggle
- Settings panel with Bot Token, Chat ID, and Test Connection
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K, Ctrl+E)
- Drag-to-reorder blocks
- Send modes: Rich Message, Draft, Edit
- Checklist support (separate API call via sendChecklist)
- Media support: Image, Video, Audio, Slideshow, Map
- Math formulas (inline and block)
- Collapsible Details/Summary blocks
- Pull Quotes with citation
- Code Blocks with language selector
- Tables with add row/column
- Focus mode for distraction-free writing
- Character counter (32,768 max)
- Toast notifications
- Clear All button
- File drag-and-drop for media

### Block Types
- Paragraph, Heading (H1-H6), Blockquote, Preformatted (Code Block)
- Divider, List (Bullet/Numbered), Footer
- Table, Photo, Video, Audio, Slideshow, Map
- Aside (Pull Quote), Details (Collapsible)

### Inline Formatting
- Bold, Italic, Underline, Strikethrough
- Spoiler, Highlight (Marked), Inline Code
- Subscript, Superscript, Links

### API Integration
- sendRichMessage with InputRichBlock* types
- editMessageText with rich_message parameter
- sendRichMessageDraft (30s, private chats)
- sendChecklist (separate API)

### Tech Stack
- Electron 35 (Desktop shell)
- Vanilla HTML + CSS + JavaScript
- Block State (JSON object array)
- electron-builder (NSIS installer)

### Supported Platforms
- Windows (x64 installer)
- Linux (AppImage, deb)
