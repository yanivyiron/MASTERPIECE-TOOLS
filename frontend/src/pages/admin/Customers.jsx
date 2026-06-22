import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Search, Mail, Building, Globe, Edit3, Trash2, Loader2, Tag, Ban, CheckCircle, Send } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const AdminCustomers = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);    // { email, notes, tags, blocked }
  const [emailing, setEmailing] = useState(null);  // { email, subject, html }
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.adminListCustomers();
      setList(res.customers || []);
    } catch (e) {
      toast({ title: 'Failed to load', description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (`${c.firstName || ''} ${c.lastName || ''}`).toLowerCase().includes(q) ||
      (c.tags || []).some(t => (t || '').toLowerCase().includes(q))
    );
  }, [list, search]);

  const startEdit = (c) => setEditing({ email: c.email, notes: c.notes || '', tags: (c.tags || []).join(', '), blocked: !!c.blocked });
  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.adminUpdateCustomer(editing.email, {
        notes: editing.notes,
        tags: editing.tags.split(',').map(t => t.trim()).filter(Boolean),
        blocked: editing.blocked,
      });
      toast({ title: 'Customer updated' });
      setEditing(null);
      refresh();
    } catch (e) { toast({ title: 'Save failed', description: e.message }); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ALL data for ${c.email}? This removes all their quotes too.`)) return;
    try { await api.adminDeleteCustomer(c.email); toast({ title: 'Customer removed' }); refresh(); }
    catch (e) { toast({ title: 'Delete failed', description: e.message }); }
  };

  const sendOne = async () => {
    if (!emailing.subject || !emailing.html) {
      toast({ title: 'Subject and body required' });
      return;
    }
    setBusy(true);
    try {
      const res = await api.adminEmailCustomer(emailing.email, {
        subject: emailing.subject,
        html: emailing.html,
        attachments: [],
      });
      toast({ title: 'Email sent', description: `Mode: ${res.mode}` });
      setEmailing(null);
    } catch (e) { toast({ title: 'Send failed', description: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-8" data-testid="admin-customers">
      <Helmet><title>Customers — Owner Panel</title></Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Customers</h1>
          <p className="text-neutral-500 text-sm mt-1">CRM — derived from your RFQs. Edit notes, tags, send custom emails, or remove.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-64 focus-visible:ring-orange-500" />
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="border border-neutral-800 bg-neutral-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-900 text-[10px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Country</th>
                  <th className="text-left px-4 py-3">Tags</th>
                  <th className="text-right px-4 py-3">Quotes</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-neutral-500 py-10">No customers yet.</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.email} className={`hover:bg-neutral-900/40 transition-colors ${c.blocked ? 'opacity-40' : ''}`} data-testid={`admin-customer-row-${c.email}`}>
                    <td className="px-4 py-3 text-white">{c.firstName} {c.lastName}</td>
                    <td className="px-4 py-3 text-neutral-300 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-orange-500" />{c.company}</td>
                    <td className="px-4 py-3 text-neutral-300">
                      {c.blocked && <Ban className="w-3 h-3 inline text-red-500 mr-1" />}
                      <a href={`mailto:${c.email}`} className="hover:text-orange-500">{c.email}</a>
                    </td>
                    <td className="px-4 py-3 text-neutral-400"><Globe className="w-3.5 h-3.5 inline text-neutral-500 mr-1" />{c.country || '—'}</td>
                    <td className="px-4 py-3">
                      {(c.tags || []).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-orange-400 border border-orange-500/30 px-1.5 py-0.5 mr-1"><Tag className="w-2.5 h-2.5" />{t}</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">{c.quoteCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEmailing({ email: c.email, subject: '', html: `<p>Hi ${c.firstName || ''},</p><p></p>` })} className="rounded-none bg-transparent border-neutral-700 text-white hover:border-orange-500 hover:text-orange-500" data-testid={`admin-customer-email-${c.email}`}>
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(c)} className="rounded-none bg-transparent border-neutral-700 text-white hover:border-orange-500 hover:text-orange-500" data-testid={`admin-customer-edit-${c.email}`}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove(c)} className="rounded-none bg-transparent border-neutral-700 text-white hover:border-red-500 hover:text-red-500" data-testid={`admin-customer-delete-${c.email}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => !busy && setEditing(null)}>
          <div className="bg-neutral-950 border border-neutral-800 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 text-white font-bold">Edit {editing.email}</div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Notes</label>
                <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="bg-neutral-900 border-neutral-800 min-h-[100px]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Tags (comma separated)</label>
                <Input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} className="bg-neutral-900 border-neutral-800" placeholder="vip, aerospace, eu" />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={editing.blocked} onChange={(e) => setEditing({ ...editing, blocked: e.target.checked })} />
                Blocked (won't receive emails / blasts)
              </label>
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2">
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={saveEdit} disabled={busy} className="bg-orange-500 hover:bg-orange-400 rounded-none">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email dialog */}
      {emailing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => !busy && setEmailing(null)}>
          <div className="bg-neutral-950 border border-neutral-800 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 text-white font-bold">Email {emailing.email}</div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Subject</label>
                <Input value={emailing.subject} onChange={(e) => setEmailing({ ...emailing, subject: e.target.value })} className="bg-neutral-900 border-neutral-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">HTML body</label>
                <Textarea value={emailing.html} onChange={(e) => setEmailing({ ...emailing, html: e.target.value })} className="bg-neutral-900 border-neutral-800 min-h-[180px] font-mono text-xs" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Preview</label>
                <div className="border border-neutral-800 bg-white text-black min-h-[120px] p-3 overflow-auto" dangerouslySetInnerHTML={{ __html: emailing.html }} />
              </div>
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2">
              <Button onClick={() => setEmailing(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={sendOne} disabled={busy} className="bg-orange-500 hover:bg-orange-400 rounded-none"><Send className="w-4 h-4 mr-2" />{busy ? 'Sending…' : 'Send'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
