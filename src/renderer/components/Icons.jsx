/**
 * Icons — Telegram-style line icons (24×24 grid, 1.8px round strokes).
 * Every icon is a plain function component so it can be referenced from the
 * toolbar/palette registries without pulling in an icon dependency.
 * @module components/Icons
 */

/**
 * Shared SVG wrapper.
 * @param {{ children: React.ReactNode, size?: number, fill?: boolean, viewBox?: string }} props
 */
function Svg({ children, size = 20, fill = false, viewBox = '0 0 24 24' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ─────────────────────────── History ─────────────────────────── */

export const UndoIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8h10.5a4.5 4.5 0 0 1 0 9H8" />
    <path d="M7.5 4.5 4 8l3.5 3.5" />
  </Svg>
);

export const RedoIcon = (p) => (
  <Svg {...p}>
    <path d="M20 8H9.5a4.5 4.5 0 0 0 0 9H16" />
    <path d="M16.5 4.5 20 8l-3.5 3.5" />
  </Svg>
);

/* ─────────────────────────── Text ─────────────────────────── */

/** "Aa" glyph — text style menu. */
export const TextStyleIcon = ({ size = 20 }) => (
  <svg width={size + 6} height={size} viewBox="0 0 30 24" aria-hidden="true" focusable="false">
    <text
      x="15"
      y="17.5"
      textAnchor="middle"
      fill="currentColor"
      fontSize="16"
      fontFamily="Georgia, 'Times New Roman', serif"
    >
      Aa
    </text>
  </svg>
);

/** Serif "B" glyph — formatting menu. */
export const BoldIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <text
      x="12"
      y="18"
      textAnchor="middle"
      fill="currentColor"
      fontSize="17"
      fontWeight="700"
      fontFamily="Georgia, 'Times New Roman', serif"
    >
      B
    </text>
  </svg>
);

export const ItalicIcon = (p) => (
  <Svg {...p}>
    <path d="M15 4h-5M14 20H9M14.5 4 9.5 20" />
  </Svg>
);

export const UnderlineIcon = (p) => (
  <Svg {...p}>
    <path d="M7 4v7a5 5 0 0 0 10 0V4M5.5 20h13" />
  </Svg>
);

export const StrikeIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 12h15M8 7.5A3.5 3.5 0 0 1 11.5 5h1A3.5 3.5 0 0 1 16 8M16 15.5A3.5 3.5 0 0 1 12.5 19h-1A3.5 3.5 0 0 1 8 16" />
  </Svg>
);

export const SpoilerIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M4 20 20 4" />
  </Svg>
);

export const HighlightIcon = (p) => (
  <Svg {...p}>
    <path d="M14.5 3.5 20.5 9.5 11 19H5.5l-1.5-4Z" />
    <path d="M3.5 21.5h17" />
  </Svg>
);

export const CodeIcon = (p) => (
  <Svg {...p}>
    <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
  </Svg>
);

export const SubscriptIcon = (p) => (
  <Svg {...p}>
    <path d="M4 5l8 10M12 5 4 15" />
    <path d="M16.5 21c0-1.6 3.5-2 3.5-3.6 0-.9-.7-1.4-1.7-1.4s-1.7.6-1.8 1.5M16.5 21h3.7" />
  </Svg>
);

export const SuperscriptIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9l8 10M12 9l-8 10" />
    <path d="M16.5 8c0-1.6 3.5-2 3.5-3.6 0-.9-.7-1.4-1.7-1.4s-1.7.6-1.8 1.5M16.5 8h3.7" />
  </Svg>
);

export const ClearFormatIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6h12M13 6l-3 9M8 20h8" />
    <path d="M17 14l4 4M21 14l-4 4" />
  </Svg>
);

/* ─────────────────────────── Blocks ─────────────────────────── */

export const ParagraphIcon = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M4 11h16M4 16h10" />
  </Svg>
);

/** Heading icon with a level digit. */
export const HeadingIcon = ({ size = 20, level = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <text
      x="1"
      y="18"
      fill="currentColor"
      fontSize="15"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      H
    </text>
    <text x="14" y="18" fill="currentColor" fontSize="11" fontFamily="system-ui, sans-serif">
      {level}
    </text>
  </svg>
);

export const QuoteIcon = (p) => (
  <Svg {...p}>
    <path d="M4 5v14" strokeWidth="2.4" />
    <path d="M9 8h11M9 12h11M9 16h7" />
  </Svg>
);

export const PullQuoteIcon = (p) => (
  <Svg {...p}>
    <path d="M8.5 6.5c-2 .8-3.5 2.7-3.5 5.2 0 1.9 1.2 3.3 3 3.3 1.6 0 2.8-1.1 2.8-2.7 0-1.5-1-2.6-2.5-2.6h-.5" />
    <path d="M18 6.5c-2 .8-3.5 2.7-3.5 5.2 0 1.9 1.2 3.3 3 3.3 1.6 0 2.8-1.1 2.8-2.7 0-1.5-1-2.6-2.5-2.6H17" />
  </Svg>
);

export const CodeBlockIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <path d="M9.5 10 7.5 12l2 2M14.5 10l2 2-2 2" />
  </Svg>
);

export const BulletListIcon = (p) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.6" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4.6" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4.6" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);

export const OrderedListIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 6.5h10.5M9.5 12H20M9.5 17.5H20" />
    <path d="M3.2 4.8 4.6 4v4M3 12.2c0-.7.6-1.2 1.3-1.2.6 0 1.2.4 1.2 1 0 1.2-2.5 1.6-2.5 3h2.6M3.1 15.9c.3-.4.8-.6 1.3-.6.7 0 1.3.4 1.3 1s-.5 1-1.2 1c.8 0 1.4.4 1.4 1.1 0 .7-.6 1.1-1.4 1.1-.6 0-1.1-.2-1.4-.6" />
  </Svg>
);

export const ChecklistIcon = (p) => (
  <Svg {...p}>
    <path d="M10.5 6.5H20M10.5 17.5H20" />
    <path d="M3 6.3l1.6 1.6L7.6 4.8" />
    <rect x="3" y="15" width="4.6" height="4.6" rx="1.2" />
  </Svg>
);

export const TableIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M3 9.5h18M3 14.5h18M9.5 9.5v10M15 9.5v10" />
  </Svg>
);

export const DetailsIcon = (p) => (
  <Svg {...p}>
    <path d="M4 6.5h16M4 17.5h16" />
    <path d="M9 10.5l3 3 3-3" />
  </Svg>
);

export const DividerIcon = (p) => (
  <Svg {...p}>
    <path d="M3 12h18" />
    <path d="M6 7h12M6 17h12" opacity=".4" />
  </Svg>
);

export const FooterIcon = (p) => (
  <Svg {...p}>
    <path d="M4 5.5h16M4 10h16M4 14.5h10" />
    <path d="M4 19h7" opacity=".55" />
  </Svg>
);

export const LinkIcon = (p) => (
  <Svg {...p}>
    <path d="M10 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
    <path d="M14 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </Svg>
);

/* ─────────────────────────── Media ─────────────────────────── */

export const ImageIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <circle cx="8.5" cy="10" r="1.8" />
    <path d="M4 17l4.5-4.5L12 16l3-2.8 5.5 5" />
  </Svg>
);

export const VideoIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const AudioIcon = (p) => (
  <Svg {...p}>
    <path d="M9 17V6.5l10-2V15" />
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="15.5" r="2.5" />
  </Svg>
);

export const SlideshowIcon = (p) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
    <path d="M3 8.5v7M21 8.5v7" />
  </Svg>
);

export const CollageIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" />
  </Svg>
);

export const MapIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s6.5-6.1 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="10.3" r="2.4" />
  </Svg>
);

/** "Σ" in a rounded box — formula menu. */
export const FormulaIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect
      x="3.2"
      y="3.2"
      width="17.6"
      height="17.6"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      fontSize="12.5"
      fontFamily="Georgia, 'Times New Roman', serif"
    >
      Σ
    </text>
  </svg>
);

export const MathInlineIcon = (p) => (
  <Svg {...p}>
    <path d="M5 6.5h6.5L6 17.5h7" />
    <path d="M15 9.5l5 5M20 9.5l-5 5" />
  </Svg>
);

/* ─────────────────────────── Actions ─────────────────────────── */

export const EmojiIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14.5a4.4 4.4 0 0 0 7 0" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.4" />
  </Svg>
);

/** Magic wand with a sparkle — insert palette. */
export const WandIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 6.2h5M7 3.7v5" />
    <path d="M13.5 10.5 20 17l-2.6 2.6L11 13.1z" />
    <path d="M11.6 8.4 13.1 5l1.5 3.4 3.4 1.5-3.4 1.5" />
  </Svg>
);

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
    <path d="M6.3 7l.8 11.4A1.7 1.7 0 0 0 8.8 20h6.4a1.7 1.7 0 0 0 1.7-1.6L17.7 7" />
    <path d="M10.5 11v5.5M13.5 11v5.5" />
  </Svg>
);

export const SendIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M3.4 11.2 19.6 4.3c.9-.4 1.8.5 1.4 1.4l-6.9 16.2c-.4.9-1.7.8-2-.2l-1.8-5.3-5.3-1.8c-1-.3-1.1-1.6-.2-2z"
      fill="currentColor"
    />
    <path d="M10.9 16 21 4.5" stroke="rgba(0,0,0,.22)" strokeWidth="1.4" fill="none" />
  </svg>
);

export const SettingsIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.2 14.7a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 0 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 0 1-3.8 0V20a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A1.9 1.9 0 0 1 4.6 16l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a1.9 1.9 0 0 1 0-3.8h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A1.9 1.9 0 0 1 7.3 4.6l.1.1a1.6 1.6 0 0 0 1.8.3H9.3a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 0 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 0 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 0 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1z" />
  </Svg>
);

export const PreviewIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M13 4.5v15" />
  </Svg>
);

export const RtlIcon = (p) => (
  <Svg {...p}>
    <path d="M15 4H9.5a3.5 3.5 0 0 0 0 7H15" />
    <path d="M15 4v16M18.5 4v16" />
    <path d="M7 17.5h6M9.5 15l-2.5 2.5L9.5 20" />
  </Svg>
);

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Svg>
);

export const FileIcon = (p) => (
  <Svg {...p}>
    <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
    <path d="M13.5 3.5V9H19" />
  </Svg>
);

/* ─────────────────────── Window controls ─────────────────────── */

export const MinimizeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" focusable="false">
    <path d="M1 5.6h9" stroke="currentColor" strokeWidth="1.1" fill="none" />
  </svg>
);

export const MaximizeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" focusable="false">
    <rect
      x="1.1"
      y="1.1"
      width="8.8"
      height="8.8"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
    />
  </svg>
);

export const RestoreIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" focusable="false">
    <rect
      x="1.1"
      y="3.2"
      width="6.7"
      height="6.7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
    />
    <path d="M3.4 3.1V2a.9.9 0 0 1 .9-.9h5.6" stroke="currentColor" strokeWidth="1.1" fill="none" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" focusable="false">
    <path d="M1.3 1.3l8.4 8.4M9.7 1.3 1.3 9.7" stroke="currentColor" strokeWidth="1.1" fill="none" />
  </svg>
);

/** Four-point violet star used as the Telegram Premium badge. */
export const PremiumStar = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path
      d="M6 0.4c.35 2.3 1.3 4 3.1 4.9C7.3 6.2 6.35 7.9 6 10.2 5.65 7.9 4.7 6.2 2.9 5.3 4.7 4.4 5.65 2.7 6 .4Z"
      fill="currentColor"
    />
  </svg>
);
