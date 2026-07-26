/**
 * Popover — anchored floating panel used by every toolbar dropdown.
 * Positions itself under (or above, when there is no room) its anchor button,
 * clamps to the viewport and closes on outside click, Escape or resize.
 *
 * @module components/Popover
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const GAP = 6;
const EDGE = 8;

/**
 * @param {{
 *   anchorEl: HTMLElement|null,
 *   open: boolean,
 *   onClose: () => void,
 *   align?: 'start'|'end'|'center',
 *   placement?: 'bottom'|'top',
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function Popover({
  anchorEl,
  open,
  onClose,
  align = 'start',
  placement = 'bottom',
  className = '',
  children,
}) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999, ready: false });

  useLayoutEffect(() => {
    if (!open || !anchorEl || !panelRef.current) return;

    const a = anchorEl.getBoundingClientRect();
    const p = panelRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top =
      placement === 'top' || a.bottom + GAP + p.height > vh - EDGE
        ? a.top - p.height - GAP
        : a.bottom + GAP;
    top = Math.max(EDGE, Math.min(top, vh - p.height - EDGE));

    let left = a.left;
    if (align === 'end') left = a.right - p.width;
    else if (align === 'center') left = a.left + a.width / 2 - p.width / 2;
    left = Math.max(EDGE, Math.min(left, vw - p.width - EDGE));

    setPos({ top, left, ready: true });
  }, [open, anchorEl, align, placement, children]);

  useEffect(() => {
    if (!open) {
      setPos((prev) => ({ ...prev, ready: false }));
      return undefined;
    }

    const onPointerDown = (event) => {
      if (panelRef.current && panelRef.current.contains(event.target)) return;
      if (anchorEl && anchorEl.contains(event.target)) return;
      onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onClose);
    };
  }, [open, anchorEl, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={`popover ${className}`}
      style={{ top: pos.top, left: pos.left, opacity: pos.ready ? 1 : 0 }}
      role="menu"
    >
      {children}
    </div>
  );
}
