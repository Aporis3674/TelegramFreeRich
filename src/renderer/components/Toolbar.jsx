/**
 * Toolbar — Formatting toolbar with grouped buttons.
 * Group 1: Inline formatting (Bold, Italic, Underline, etc.)
 * Group 2: Block elements (Lists, Table, Code, etc.)
 * Group 3: Media & Special (Image, Math, etc.)
 */

import { useCallback } from 'react';

/**
 * Get the TipTap editor instance from window.
 * @returns {import('@tiptap/react').Editor|null}
 */
function getEditor() {
  return window.__tfrEditor || null;
}

/**
 * Toolbar button component.
 * @param {{ icon: string, label: string, onClick: () => void, active?: boolean, disabled?: boolean }} props
 */
function TbBtn({ icon, label, onClick, active = false, disabled = false }) {
  return (
    <button
      className={`tb-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <span className="tb-icon">{icon}</span>
    </button>
  );
}

/**
 * Separator between button groups.
 */
function TbSep() {
  return <div className="tb-separator" />;
}

export default function Toolbar() {
  const cmd = useCallback((action) => {
    const editor = getEditor();
    if (!editor) return;
    action(editor);
  }, []);

  const setBlock = useCallback((tag) => {
    cmd((e) => e.chain().focus().setNode(tag).run());
  }, [cmd]);

  const setTable = useCallback(() => {
    cmd((e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    );
  }, [cmd]);

  const setList = useCallback((type) => {
    cmd((e) => {
      if (type === 'bullet') return e.chain().focus().toggleBulletList().run();
      if (type === 'ordered') return e.chain().focus().toggleOrderedList().run();
    });
  }, [cmd]);

  const setCodeBlock = useCallback(() => {
    cmd((e) => e.chain().focus().toggleCodeBlock().run());
  }, [cmd]);

  const setBlockquote = useCallback(() => {
    cmd((e) => e.chain().focus().toggleBlockquote().run());
  }, [cmd]);

  const setHorizontalRule = useCallback(() => {
    cmd((e) => e.chain().focus().setHorizontalRule().run());
  }, [cmd]);

  const insertDetails = useCallback(() => {
    cmd((e) => e.chain().focus().setDetails().run());
  }, [cmd]);

  const insertFooter = useCallback(() => {
    cmd((e) => e.chain().focus().setFooter().run());
  }, [cmd]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:', 'https://');
    if (!url) return;
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) return;
    cmd((e) => e.chain().focus().setImage({ src: url }).run());
  }, [cmd]);

  const toggleLink = useCallback(() => {
    cmd((e) => {
      const prev = e.getAttributes('link').href;
      if (prev) return e.chain().focus().unsetLink().run();
      const url = prompt('Enter URL:', 'https://');
      if (!url) return e;
      return e.chain().focus().setLink({ href: url }).run();
    });
  }, [cmd]);

  return (
    <div className="toolbar">
      {/* Group 1: Inline formatting */}
      <TbBtn icon="B" label="Bold (Ctrl+B)" onClick={() => cmd(e => e.chain().focus().toggleBold().run())} active={getEditor()?.isActive('bold')} />
      <TbBtn icon="I" label="Italic (Ctrl+I)" onClick={() => cmd(e => e.chain().focus().toggleItalic().run())} active={getEditor()?.isActive('italic')} />
      <TbBtn icon="U" label="Underline (Ctrl+U)" onClick={() => cmd(e => e.chain().focus().toggleUnderline().run())} active={getEditor()?.isActive('underline')} />
      <TbBtn icon="S̶" label="Strikethrough" onClick={() => cmd(e => e.chain().focus().toggleStrike().run())} active={getEditor()?.isActive('strike')} />
      <TbBtn icon="S" label="Spoiler" onClick={() => cmd(e => e.chain().focus().toggleSpoiler().run())} active={getEditor()?.isActive('spoiler')} />
      <TbBtn icon="==" label="Highlight" onClick={() => cmd(e => e.chain().focus().toggleHighlight().run())} active={getEditor()?.isActive('highlight')} />
      <TbBtn icon="</>" label="Inline Code" onClick={() => cmd(e => e.chain().focus().toggleCode().run())} active={getEditor()?.isActive('code')} />

      <TbSep />

      {/* Group 2: Block elements */}
      <TbBtn icon="H1" label="Heading 1" onClick={() => setBlock('heading')} active={getEditor()?.isActive('heading', { level: 1 })} />
      <TbBtn icon="H2" label="Heading 2" onClick={() => setBlock('heading')} active={getEditor()?.isActive('heading', { level: 2 })} />
      <TbBtn icon="H3" label="Heading 3" onClick={() => setBlock('heading')} active={getEditor()?.isActive('heading', { level: 3 })} />
      <TbBtn icon="❝" label="Blockquote" onClick={setBlockquote} active={getEditor()?.isActive('blockquote')} />
      <TbBtn icon="•≡" label="Bullet List" onClick={() => setList('bullet')} active={getEditor()?.isActive('bulletList')} />
      <TbBtn icon="1." label="Ordered List" onClick={() => setList('ordered')} active={getEditor()?.isActive('orderedList')} />
      <TbBtn icon="</>" label="Code Block" onClick={setCodeBlock} active={getEditor()?.isActive('codeBlock')} />
      <TbBtn icon="⊞" label="Table" onClick={setTable} active={getEditor()?.isActive('table')} />
      <TbBtn icon="▸▾" label="Details/Collapsible" onClick={insertDetails} />
      <TbBtn icon="—" label="Divider" onClick={setHorizontalRule} />
      <TbBtn icon="⊥" label="Footer" onClick={insertFooter} />
      <TbBtn icon="🔗" label="Link" onClick={toggleLink} active={getEditor()?.isActive('link')} />

      <TbSep />

      {/* Group 3: Media & Special */}
      <TbBtn icon="🖼" label="Image" onClick={insertImage} />
      <TbBtn icon="∑" label="Math Block" onClick={() => {
        cmd(e => e.chain().focus().insertContent('<div class="tg-math">$$formula$$</div>').run());
      }} />
    </div>
  );
}
