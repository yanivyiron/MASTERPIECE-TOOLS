import React, { useEffect, useRef, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import { Pencil, Check, X, RotateCcw } from 'lucide-react';

/**
 * EditableText — drop-in wrapper for any text on the public site.
 *
 * Usage:
 *   <EditableText k="home.hero.title" as="h1" className="...">
 *     Aerospace-grade precision
 *   </EditableText>
 *
 * When the owner toggles edit mode (FloatingEditToggle), a pencil appears next to every block.
 * Click → inline editor → Save → PUT /api/admin/site-overrides → SiteConfigContext.text() returns it everywhere.
 */
const EditableText = ({ k, as: Tag = 'span', children, className = '', multiline = false, ...rest }) => {
  const { text, setOverride, resetOverride, editMode } = useSiteConfig();
  const { user } = useAuth();
  const fallback = typeof children === 'string' ? children : (React.Children.map(children, c => (typeof c === 'string' ? c : '')) || []).join('');
  const value = text(k, fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const canEdit = !!user && editMode;

  if (!canEdit) {
    return <Tag className={className} {...rest}>{value}</Tag>;
  }

  if (editing) {
    return (
      <span className="inline-flex flex-col gap-1 items-start w-full">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={`${className} bg-black/70 border-2 border-orange-500 text-white p-2 outline-none w-full min-h-[80px]`}
            data-testid={`edit-text-${k}`}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') { cancel(); } }}
            className={`${className} bg-black/70 border-2 border-orange-500 text-white p-1 outline-none min-w-[200px]`}
            data-testid={`edit-text-${k}`}
          />
        )}
        <span className="inline-flex gap-1">
          <button onClick={save} className="text-[10px] uppercase tracking-widest bg-orange-500 text-black px-2 py-1 inline-flex items-center gap-1 hover:bg-orange-400" data-testid={`edit-save-${k}`}><Check className="w-3 h-3" /> Save</button>
          <button onClick={cancel} className="text-[10px] uppercase tracking-widest bg-neutral-900 text-white border border-neutral-700 px-2 py-1 inline-flex items-center gap-1 hover:border-white"><X className="w-3 h-3" /> Cancel</button>
          <button onClick={reset} className="text-[10px] uppercase tracking-widest bg-neutral-900 text-amber-300 border border-amber-500/40 px-2 py-1 inline-flex items-center gap-1 hover:border-amber-400" title="Restore default"><RotateCcw className="w-3 h-3" /> Reset</button>
        </span>
      </span>
    );

    function save() { setOverride(k, draft); setEditing(false); }
    function cancel() { setDraft(value); setEditing(false); }
    function reset() { resetOverride(k); setDraft(fallback); setEditing(false); }
  }

  return (
    <Tag
      className={`${className} relative cursor-pointer outline outline-1 outline-dashed outline-orange-500/0 hover:outline-orange-500/60 transition`}
      onDoubleClick={() => setEditing(true)}
      data-testid={`editable-${k}`}
      {...rest}
    >
      {value}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
        className="absolute -top-2 -right-2 z-20 bg-orange-500 text-black p-1 opacity-0 hover:opacity-100 group-hover:opacity-100"
        style={{ opacity: 0.65 }}
        title="Edit"
        data-testid={`edit-btn-${k}`}
      >
        <Pencil className="w-3 h-3" />
      </button>
    </Tag>
  );
};

export default EditableText;
