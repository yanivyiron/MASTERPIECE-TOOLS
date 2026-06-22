import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit3, Trash2, Loader2, Languages } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const blank = { slug: '', name: '', description: '', icon: '', order: 0, autoTranslate: true };

const AdminCategories = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // null = no editor, { id?, ...form }
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.adminListCategories();
      setRows(res.categories || []);
    } catch (e) {
      toast({ title: 'Failed to load', description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!editing.slug || !editing.name) {
      toast({ title: 'Slug and name required' });
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api.adminUpdateCategory(editing.id, { ...editing });
        toast({ title: 'Category updated' });
      } else {
        await api.adminCreateCategory({ ...editing });
        toast({ title: 'Category created — translations queued' });
      }
      setEditing(null);
      refresh();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.adminDeleteCategory(c.id);
      refresh();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message });
    }
  };

  return (
    <div className="p-8" data-testid="admin-categories">
      <Helmet><title>Categories — Owner Panel</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-orange-500">Catalog</div>
          <h1 className="text-2xl font-black text-white">Categories</h1>
        </div>
        <Button onClick={() => setEditing({ ...blank })} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-cat-new">
          <Plus className="w-4 h-4 mr-2" /> New category
        </Button>
      </div>

      {loading ? (
        <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="border border-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-neutral-500 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left p-3">Order</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">i18n</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No categories yet. Press "New category".</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-neutral-900 hover:bg-neutral-950/60" data-testid={`admin-cat-row-${c.slug}`}>
                  <td className="p-3 text-neutral-400">{c.order}</td>
                  <td className="p-3 text-neutral-400 font-mono">{c.slug}</td>
                  <td className="p-3 text-white font-medium">{c.name}</td>
                  <td className="p-3 text-neutral-400 max-w-md truncate">{c.description}</td>
                  <td className="p-3">
                    {c.translations ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5">
                        <Languages className="w-3 h-3" /> {Object.keys(c.translations).length} langs
                      </span>
                    ) : <span className="text-neutral-700 text-[10px] uppercase">none</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })} className="rounded-none bg-transparent border-neutral-800 text-neutral-300 hover:border-orange-500 hover:text-orange-500" data-testid={`admin-cat-edit-${c.slug}`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(c)} className="rounded-none bg-transparent border-neutral-800 text-neutral-400 hover:border-red-500 hover:text-red-500" data-testid={`admin-cat-delete-${c.slug}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => !saving && setEditing(null)}>
          <div className="bg-neutral-950 border border-neutral-800 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 flex items-center justify-between">
              <div className="text-white font-bold">{editing.id ? 'Edit category' : 'New category'}</div>
              <button onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white text-xs">Close</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Slug</label>
                <Input data-testid="admin-cat-slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="bg-neutral-900 border-neutral-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
                <Input data-testid="admin-cat-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-neutral-900 border-neutral-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Description</label>
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-neutral-900 border-neutral-800 min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon (lucide name)</label>
                  <Input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Cog, Wrench, Layers…" className="bg-neutral-900 border-neutral-800" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Order</label>
                  <Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value || '0', 10) })} className="bg-neutral-900 border-neutral-800" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={editing.autoTranslate !== false} onChange={(e) => setEditing({ ...editing, autoTranslate: e.target.checked })} />
                Auto-translate name &amp; description (NL/DE/FR/PT)
              </label>
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2">
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-cat-save">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
