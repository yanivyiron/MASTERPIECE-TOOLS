import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Send, Loader2, Paperclip, X, Users, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';
import { safeHtml } from '../../lib/sanitize';

const EmailBlast = () => {
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [tag, setTag] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<div style="font-family:Arial;line-height:1.6"><h2 style="color:#FF6B1A;margin:0">Masterpiece Tools</h2><p>Hi,</p><p>...</p></div>');
  const [attachments, setAttachments] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [c, t, h] = await Promise.all([
          api.adminListCustomers(),
          api.adminListTemplates(),
          api.adminEmailHistory(),
        ]);
        setCustomers(c.customers || []);
        setTemplates(t.templates || []);
        setHistory(h.history || []);
      } catch (e) {
        toast({ title: 'Failed to load', description: e.message });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial load
  }, []);

  const filtered = useMemo(() => {
    if (!tag.trim()) return customers;
    const q = tag.trim().toLowerCase();
    return customers.filter(c => (c.email || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q) || (c.tags || []).some(t => t.toLowerCase().includes(q)));
  }, [customers, tag]);

  const toggle = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const selectAllShown = () => {
    setSelected(new Set([...selected, ...filtered.map(c => c.email)]));
  };
  const clearSelection = () => setSelected(new Set());

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const parts = await Promise.all(files.map((f) => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, type: f.type, data: r.result });
      r.readAsDataURL(f);
    })));
    setAttachments((prev) => [...prev, ...parts]);
    e.target.value = '';
  };

  const send = async () => {
    if (selected.size === 0 || !subject.trim() || !html.trim()) {
      toast({ title: 'Pick recipients and write a subject & body' });
      return;
    }
    setSending(true);
    try {
      const payload = {
        recipients: Array.from(selected),
        subject,
        html,
        attachments,
        templateId: templateId || undefined,
      };
      const res = await api.adminEmailBlast(payload);
      toast({ title: `Queued ${res.queued} emails`, description: `Mode: ${res.mode}` });
      const h = await api.adminEmailHistory();
      setHistory(h.history || []);
      setSelected(new Set());
      setSubject('');
      setAttachments([]);
    } catch (e) {
      toast({ title: 'Send failed', description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8" data-testid="admin-blast">
      <Helmet><title>Email blast — Owner Panel</title></Helmet>
      <div className="mb-6">
        <div className="text-[10px] tracking-widest uppercase text-orange-500">Communication</div>
        <h1 className="text-2xl font-black text-white">Bulk email</h1>
        <p className="text-sm text-neutral-500 mt-1">Send a targeted email to selected or all customers with optional attachments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipients */}
        <div className="border border-neutral-900">
          <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
            <div className="text-white font-bold flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> Recipients <span className="text-xs text-neutral-500">({selected.size} / {customers.length})</span></div>
            <div className="flex gap-2">
              <button onClick={selectAllShown} className="text-[10px] uppercase tracking-widest text-orange-400 hover:text-orange-300">Select shown</button>
              <button onClick={clearSelection} className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white">Clear</button>
            </div>
          </div>
          <div className="p-3">
            <Input placeholder="Filter by email / company / country / tag…" value={tag} onChange={(e) => setTag(e.target.value)} className="bg-neutral-900 border-neutral-800" />
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.map((c) => (
              <label key={c.email} className="flex items-center gap-3 px-4 py-2 border-t border-neutral-900 hover:bg-neutral-950 cursor-pointer">
                <input type="checkbox" checked={selected.has(c.email)} onChange={() => toggle(c.email)} data-testid={`admin-blast-pick-${c.email}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{c.firstName} {c.lastName} <span className="text-neutral-500">— {c.company}</span></div>
                  <div className="text-xs text-neutral-500 truncate">{c.email} · {c.country || '—'}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="border border-neutral-900 p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Apply template</label>
            <select value={templateId} onChange={(e) => {
              setTemplateId(e.target.value);
              const tpl = templates.find(t => t.id === e.target.value);
              if (tpl) { setSubject(tpl.subject); setHtml(tpl.html); }
            }} className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
              <option value="">— none —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Subject</label>
            <Input data-testid="admin-blast-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-neutral-900 border-neutral-800" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">HTML body</label>
            <Textarea data-testid="admin-blast-html" value={html} onChange={(e) => setHtml(e.target.value)} className="bg-neutral-900 border-neutral-800 min-h-[180px] font-mono text-xs" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Preview</label>
            <div className="border border-neutral-800 bg-white text-black min-h-[140px] p-3 overflow-auto" dangerouslySetInnerHTML={safeHtml(html)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Attachments</label>
            <input type="file" multiple onChange={onPickFiles} className="hidden" id="blast-files" />
            <Button type="button" onClick={() => document.getElementById('blast-files').click()} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300 mr-2">
              <Paperclip className="w-4 h-4 mr-2" /> Attach files
            </Button>
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300">
                    <FileText className="w-3.5 h-3.5 text-orange-500" /> {a.name}
                    <button onClick={() => setAttachments((p) => p.filter((_, k) => k !== i))} className="text-neutral-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button onClick={send} disabled={sending || selected.size === 0 || !subject || !html} className="bg-orange-500 hover:bg-orange-400 rounded-none w-full" data-testid="admin-blast-send">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send to {selected.size} recipient{selected.size === 1 ? '' : 's'}</>}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-white font-bold mb-3">Recent activity</h2>
        <div className="border border-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-neutral-500 text-[10px] uppercase tracking-widest">
              <tr><th className="text-left p-3">When</th><th className="text-left p-3">To</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Mode</th><th className="text-left p-3">By</th></tr>
            </thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-neutral-500">No emails sent yet.</td></tr>}
              {history.slice(0, 50).map((h) => (
                <tr key={h.id} className="border-t border-neutral-900">
                  <td className="p-3 text-neutral-500 text-xs">{new Date(h.at).toLocaleString()}</td>
                  <td className="p-3 text-white">{h.to}</td>
                  <td className="p-3 text-neutral-300">{h.subject}</td>
                  <td className="p-3"><span className={`text-[10px] uppercase tracking-widest ${h.ok ? 'text-emerald-400' : 'text-red-400'}`}>{h.mode}</span></td>
                  <td className="p-3 text-neutral-500 text-xs">{h.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailBlast;
