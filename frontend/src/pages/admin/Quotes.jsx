import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Search, Send, Mail, FileText, Building, Globe, Clock, Trash2, Loader2, Paperclip, Download } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const STATUS_OPTIONS = ['new', 'in-progress', 'replied', 'closed'];

const statusBadge = (s) => {
  const map = {
    new: 'border-orange-500/40 text-orange-400 bg-orange-500/5',
    'in-progress': 'border-amber-500/40 text-amber-400 bg-amber-500/5',
    replied: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
    closed: 'border-neutral-700 text-neutral-400 bg-neutral-800/30',
  };
  return map[s] || map.new;
};

const fmtDate = (s) => {
  try { return new Date(s).toLocaleString(); } catch { return s; }
};

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [replyTemplate, setReplyTemplate] = useState('');
  const [replyAtts, setReplyAtts] = useState([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
  const fileToDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.adminListQuotes();
      setQuotes(res.quotes || []);
    } catch (e) {
      toast({ title: 'Failed to load quotes', description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);
  useEffect(() => { api.adminListTemplates().then((r) => setTemplates(r.templates || [])).catch(() => {}); }, []);

  const filtered = useMemo(() => quotes.filter((q) => {
    if (filter !== 'all' && q.status !== filter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (q.qid || '').toLowerCase().includes(s) ||
      `${q.firstName || ''} ${q.lastName || ''}`.toLowerCase().includes(s) ||
      (q.email || '').toLowerCase().includes(s) ||
      (q.company || '').toLowerCase().includes(s);
  }), [quotes, filter, search]);

  const open = (q) => {
    setActive(q);
    setReply('');
    setReplyTemplate('');
    setReplyAtts([]);
    setAdminNotes(q.adminNotes || '');
  };

  const updateStatus = async (qid, status) => {
    try {
      await api.adminUpdateQuote(qid, { status });
      toast({ title: 'Status updated', description: `${qid} → ${status}` });
      refresh();
      if (active && active.qid === qid) setActive({ ...active, status });
    } catch (e) { toast({ title: 'Update failed', description: e.message }); }
  };

  const saveNotes = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api.adminUpdateQuote(active.qid, { adminNotes });
      toast({ title: 'Notes saved' });
      refresh();
    } catch (e) { toast({ title: 'Save failed', description: e.message }); }
    finally { setBusy(false); }
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await api.adminReplyQuote(active.qid, {
        message: reply,
        templateId: replyTemplate || null,
        attachments: replyAtts,
      });
      toast({ title: 'Reply sent', description: `Mode: ${res.mode}` });
      setReply('');
      setReplyTemplate('');
      setReplyAtts([]);
      refresh();
      const updated = (await api.adminListQuotes()).quotes.find(q => q.qid === active.qid);
      if (updated) setActive(updated);
    } catch (e) { toast({ title: 'Reply failed', description: e.message }); }
    finally { setBusy(false); }
  };

  const onPickReplyFiles = async (files) => {
    if (!files?.length) return;
    let total = replyAtts.reduce((a, b) => a + (b.size || 0), 0);
    const out = [...replyAtts];
    for (const f of files) {
      if (total + f.size > MAX_TOTAL_BYTES) {
        toast({ title: 'Too many attachments', description: '25 MB total cap reached.' });
        break;
      }
      const data = await fileToDataUrl(f);
      out.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data });
      total += f.size;
    }
    setReplyAtts(out);
  };
  const removeReplyAtt = (i) => setReplyAtts(replyAtts.filter((_, idx) => idx !== i));

  const remove = async (q) => {
    if (!window.confirm(`Delete quote ${q.qid}?`)) return;
    try {
      await api.adminDeleteQuote(q.qid);
      toast({ title: 'Quote deleted' });
      if (active && active.qid === q.qid) setActive(null);
      refresh();
    } catch (e) { toast({ title: 'Delete failed', description: e.message }); }
  };

  const downloadAttachment = (att) => {
    if (!att?.data) return;
    const a = document.createElement('a');
    a.href = att.data;
    a.download = att.name || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-8" data-testid="admin-quotes">
      <Helmet><title>Quotes — Owner Panel</title></Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Quotes</h1>
          <p className="text-neutral-500 text-sm mt-1">RFQs submitted on the website.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-64 focus-visible:ring-orange-500" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-white h-9 px-3 text-sm">
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 border border-neutral-900 bg-neutral-950 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-[10px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="text-left p-3">QID</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Created</th>
                  <th className="text-right p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-neutral-500">No quotes match.</td></tr>}
                {filtered.map((q) => (
                  <tr key={q.qid} className={`border-t border-neutral-900 cursor-pointer ${active?.qid === q.qid ? 'bg-neutral-900/60' : 'hover:bg-neutral-900/30'}`} onClick={() => open(q)} data-testid={`admin-quote-row-${q.qid}`}>
                    <td className="p-3 text-orange-400 font-mono text-xs">{q.qid}</td>
                    <td className="p-3 text-white">
                      <div>{q.firstName} {q.lastName}</div>
                      <div className="text-xs text-neutral-500">{q.company}</div>
                    </td>
                    <td className="p-3"><span className={`text-[10px] uppercase tracking-widest border px-1.5 py-0.5 ${statusBadge(q.status)}`}>{q.status}</span></td>
                    <td className="p-3 text-xs text-neutral-500">{fmtDate(q.createdAt)}</td>
                    <td className="p-3 text-right">
                      {(q.attachments || []).length > 0 && (
                        <span className="inline-flex items-center text-[10px] text-orange-400 mr-2"><Paperclip className="w-3 h-3 mr-0.5" />{q.attachments.length}</span>
                      )}
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); remove(q); }} className="rounded-none bg-transparent border-neutral-800 text-neutral-400 hover:border-red-500 hover:text-red-500" data-testid={`admin-quote-delete-${q.qid}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail pane */}
          <div className="lg:col-span-2 border border-neutral-900 bg-neutral-950 p-5">
            {!active ? (
              <div className="text-center text-neutral-500 py-12">Select a quote to view details.</div>
            ) : (
              <div data-testid="admin-quote-detail">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-orange-400 font-mono text-xs">{active.qid}</div>
                    <div className="text-white font-bold">{active.firstName} {active.lastName}</div>
                    <div className="text-xs text-neutral-500">{active.company} · {active.country || '—'}</div>
                  </div>
                  <select value={active.status} onChange={(e) => updateStatus(active.qid, e.target.value)} className="bg-neutral-900 border border-neutral-800 text-white h-8 px-2 text-xs">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-xs text-neutral-400 space-y-1 mb-3">
                  <div><Mail className="w-3 h-3 inline mr-1" /><a href={`mailto:${active.email}`} className="hover:text-orange-400">{active.email}</a></div>
                  {active.phone && <div>📞 {active.phone}</div>}
                  {active.industry && <div><Building className="w-3 h-3 inline mr-1" />{active.industry}</div>}
                  <div><Clock className="w-3 h-3 inline mr-1" />{fmtDate(active.createdAt)}</div>
                </div>

                {(active.items || []).length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Items</div>
                    <div className="space-y-1 text-sm text-neutral-300">
                      {active.items.map((it, i) => (
                        <div key={it.id || it.slug || `item-${i}`} className="border border-neutral-900 px-2 py-1 flex justify-between"><span>{it.name || it.slug}</span><span className="text-neutral-500">× {it.qty}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {active.message && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Customer message</div>
                    <div className="text-sm text-neutral-300 border border-neutral-900 p-2 whitespace-pre-wrap">{active.message}</div>
                  </div>
                )}
                {(active.attachments || []).length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachments</div>
                    <div className="space-y-1">
                      {active.attachments.map((a, i) => (
                        <button key={`${a.name}-${a.size || 0}-${i}`} onClick={() => downloadAttachment(a)} data-testid={`admin-quote-att-${i}`} className="w-full text-left text-sm text-neutral-300 border border-neutral-800 hover:border-orange-500 hover:text-orange-400 p-2 flex items-center justify-between">
                          <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-orange-500" /> {a.name}</span>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Internal notes</div>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="bg-neutral-900 border-neutral-800 min-h-[60px]" />
                  <Button size="sm" onClick={saveNotes} disabled={busy} className="bg-neutral-800 hover:bg-neutral-700 rounded-none mt-1 text-xs h-7">Save notes</Button>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Reply by email</div>
                  {templates.length > 0 && (
                    <select value={replyTemplate} onChange={(e) => setReplyTemplate(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white h-8 px-2 text-xs mb-2" data-testid="admin-quote-reply-tpl">
                      <option value="">— No template —</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                  <Textarea data-testid="admin-quote-reply-text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" className="bg-neutral-900 border-neutral-800 min-h-[100px]" />
                  <div className="mt-2">
                    <input id={`q-att-${active.qid}`} type="file" multiple className="hidden" onChange={(e) => onPickReplyFiles(Array.from(e.target.files || []))} data-testid="admin-quote-reply-att-input" />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById(`q-att-${active.qid}`).click()} className="rounded-none bg-transparent border-neutral-800 text-neutral-300 hover:border-orange-500 hover:text-orange-500 h-7 text-xs" data-testid="admin-quote-reply-att-btn">
                      <Paperclip className="w-3.5 h-3.5 mr-1.5" /> Add attachments
                    </Button>
                    {replyAtts.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {replyAtts.map((a, i) => (
                          <div key={`${a.name}-${i}`} className="flex items-center justify-between text-[11px] text-neutral-300 border border-neutral-800 px-2 py-1">
                            <span className="flex items-center gap-1.5 truncate"><FileText className="w-3 h-3 text-orange-500 flex-shrink-0" /> {a.name} <span className="text-neutral-500">· {(a.size / 1024).toFixed(0)} KB</span></span>
                            <button onClick={() => removeReplyAtt(i)} className="text-neutral-500 hover:text-red-400" data-testid={`admin-quote-reply-att-rm-${i}`}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button onClick={sendReply} disabled={busy || !reply.trim()} className="bg-orange-500 hover:bg-orange-400 rounded-none w-full mt-2" data-testid="admin-quote-reply-send">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send reply</>}
                  </Button>
                </div>
                {(active.replies || []).length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Past replies ({active.replies.length})</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {active.replies.map((r, i) => (
                        <div key={`${r.at}-${i}`} className="border border-neutral-900 p-2 text-xs text-neutral-300">
                          <div className="text-neutral-500">{fmtDate(r.at)} · {r.by} · {r.mode}</div>
                          <div className="font-bold mt-1">{r.subject}</div>
                          <div className="text-neutral-400 whitespace-pre-wrap mt-1">{r.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuotes;
