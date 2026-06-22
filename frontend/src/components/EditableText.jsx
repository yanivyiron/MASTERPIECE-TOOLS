import React, { useEffect, useRef, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import { Pencil, Check, X, RotateCcw, Loader2 } from 'lucide-react';

/**
 * EditableText — drop-in wrapper for any text on the public site.
 *
 * Usage:
 *   <EditableText k="home.hero.title" as="h1" className="…">Default text</EditableText>
 *
 * When the owner toggles edit mode (FloatingEditToggle), a pencil appears
 * next to every block. Double-click → inline editor → Save → PUT /api/admin/site-overrides.
 */
const EditableText = ({ k, as: Tag = 'span', children, className = '', multiline = false, ...rest }) => {
  const { text, setOverride, resetOverride, editMode } = useSiteConfig();
  const { user } = useAuth();
  const fallback = typeof children === 'string'
    ? children
    : (React.Children.map(children, (c) => (typeof c === 'string' ? c : '')) || []).join('');
  const value = text(k, fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const canEdit = !!user && editMode;

  // Stable handlers — declared OUTSIDE return so the click handler closure captures them correctly.
  const handleSave = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSaving(true);
    try {
      await setOverride(k, draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };
  const handleCancel = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDraft(value);
    setEditing(false);
  };
  const handleReset = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSaving(true);
    try {
      await resetOverride(k);
    } finally {
      setSaving(false);
      setDraft(fallback);
      setEditing(false);
    }
  };
  const startEdit = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditing(true);
  };

  if (!canEdit) {
    return <Tag className={className} {...rest}>{value}</Tag>;
  }

  if (editing) {
    // Render the editor OUTSIDE the Tag so the dashed-outline overlay can't eat the clicks.
    return (
      <span className="inline-flex flex-col gap-1.5 items-start w-full" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(e); }}
            className={`${className} bg-black/80 border-2 border-orange-500 text-white p-2 outline-none w-full min-h-[80px]`}
            data-testid={`edit-text-${k}`}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(e); if (e.key === 'Escape') handleCancel(e); }}
            className={`${className} bg-black/80 border-2 border-orange-500 text-white p-1 outline-none min-w-[260px]`}
            data-testid={`edit-text-${k}`}
          />
        )}
        <span className="inline-flex gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-[10px] uppercase tracking-widest bg-orange-500 text-black px-2 py-1 inline-flex items-center gap-1 hover:bg-orange-400 disabled:opacity-50"
            data-testid={`edit-save-${k}`}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="text-[10px] uppercase tracking-widest bg-neutral-900 text-white border border-neutral-700 px-2 py-1 inline-flex items-center gap-1 hover:border-white"
            data-testid={`edit-cancel-${k}`}
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="text-[10px] uppercase tracking-widest bg-neutral-900 text-amber-300 border border-amber-500/40 px-2 py-1 inline-flex items-center gap-1 hover:border-amber-400"
            title="Restore default"
            data-testid={`edit-reset-${k}`}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </span>
      </span>
    );
  }

  return (
    <Tag
      className={`${className} relative cursor-pointer outline outline-1 outline-dashed outline-orange-500/0 hover:outline-orange-500/60 transition`}
      onDoubleClick={startEdit}
      data-testid={`editable-${k}`}
      {...rest}
    >
      {value}
      <button
        type="button"
        onClick={startEdit}
        className="absolute -top-2 -right-2 z-20 bg-orange-500 text-black p-1 opacity-65 hover:opacity-100"
        title="Edit"
        data-testid={`edit-btn-${k}`}
      >
        <Pencil className="w-3 h-3" />
      </button>
    </Tag>
  );
};

export default EditableText;
