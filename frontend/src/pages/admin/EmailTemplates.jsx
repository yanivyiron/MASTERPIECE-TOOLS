import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit3, Trash2, Loader2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const blank = {
  name: '', subject: '', kind: 'custom', description: '',
  html: '<div style="font-family:Arial;line-height:1.6"><h2 style="color:#FF6B1A;margin:0">Masterpiece Tools</h2><p>Hello {{firstName}},</p><p>...</p></div>',
};

const AdminEmailTemplates = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.adminListTemplates();
      setRows(res.templates || []);
    } catch (e) {
      toast({ title: 'Failed to load', description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!editing.name || !editing.subject || !editing.html) {
      toast({ title: 'Name, subject and HTML are required' });
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api.adminUpdateTemplate(editing.id, { ...editing });
        toast({ title: 'Template saved' });
      } else {
        await api.adminCreateTemplate({ ...editing });
        toast({ title: 'Template created' });
      }
      setEditing(null);
      refresh();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try { await api.adminDeleteTemplate(t.id); refresh(); }
    catch (e) { toast({ title: 'Delete failed', description: e.message }); }
  };

  return (
    <div className="p-8" data-testid="admin-email-templates">
      <Helmet><title>Email templates — Owner Panel</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-orange-500">Communication</div>
          <h1 className="text-2xl font-black text-white">Email templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Reusable HTML email bodies for blasts and replies.</p>
        </div>
        <Button onClick={() => setEditing({ ...blank })} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-tpl-new">
          <Plus className="w-4 h-4 mr-2" /> New template
        </Button>
      </div>

      {loading ? (
        <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="border border-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-neutral-500 text-[10px] uppercase tracking-widest">
              <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Kind</th><th className="text-right p-3"></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-neutral-500">No templates yet.</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-neutral-900" data-testid={`admin-tpl-row-${t.id}`}>
                  <td className="p-3 text-white font-medium">{t.name}</td>
                  <td className="p-3 text-neutral-400">{t.subject}</td>
                  <td className="p-3"><span className="text-[10px] uppercase tracking-widest text-orange-400 border border-orange-500/30 px-1.5 py-0.5">{t.kind}</span></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...t })} className="rounded-none bg-transparent border-neutral-800 text-neutral-300 hover:border-orange-500 hover:text-orange-500"><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => remove(t)} className="rounded-none bg-transparent border-neutral-800 text-neutral-400 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <div className="bg-neutral-950 border border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 flex items-center justify-between">
              <div className="text-white font-bold flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /> {editing.id ? 'Edit template' : 'New template'}</div>
              <button onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white text-xs">Close</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
                  <Input data-testid="admin-tpl-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-neutral-900 border-neutral-800" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Kind</label>
                  <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                    <option value="custom">custom</option>
                    <option value="reply">reply</option>
                    <option value="rfq_owner">rfq_owner</option>
                    <option value="rfq_customer">rfq_customer</option>
                    <option value="newsletter">newsletter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Subject</label>
                <Input data-testid="admin-tpl-subject" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="bg-neutral-900 border-neutral-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Description</label>
                <Input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-neutral-900 border-neutral-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">HTML body</label>
                  <Textarea data-testid="admin-tpl-html" value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} className="bg-neutral-900 border-neutral-800 min-h-[280px] font-mono text-xs" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Live preview</label>
                  <div className="border border-neutral-800 bg-white text-black min-h-[280px] p-4 overflow-auto" dangerouslySetInnerHTML={{ __html: editing.html }} />
                </div>
              </div>
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2">
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-tpl-save">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplates;
