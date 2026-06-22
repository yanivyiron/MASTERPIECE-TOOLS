import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit3, Trash2, Loader2, Mail, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';
import { safeHtml } from '../../lib/sanitize';

const blank = {
  name: '', subject: '', kind: 'custom', description: '',
  html: '<div style="font-family:Arial;line-height:1.6">\n  <h2 style="color:#FF6B1A;margin:0">Masterpiece Tools</h2>\n  <p>Hello {{firstName}},</p>\n  <p>{{message}}</p>\n  <p style="color:#666;font-size:12px">Sent from Masterpiece Innovations B.V.</p>\n</div>',
};

const PLACEHOLDERS = [
  { tag: '{{firstName}}',  desc: "Recipient's first name" },
  { tag: '{{lastName}}',   desc: "Recipient's last name (when available)" },
  { tag: '{{email}}',      desc: "Recipient's email address" },
  { tag: '{{company}}',    desc: 'Recipient company (when available)' },
  { tag: '{{quoteId}}',    desc: 'Quote ID — reply templates only' },
  { tag: '{{message}}',    desc: 'Your custom message body — reply templates only' },
];

const QUICK_TEMPLATES = [
  {
    name: 'Welcome — new customer',
    subject: 'Welcome to Masterpiece Tools, {{firstName}}',
    kind: 'custom',
    description: 'Sent to new customers after their first quote.',
    html: `<div style="font-family:Arial;line-height:1.6;max-width:600px;margin:auto;color:#111">
  <div style="background:#000;color:#fff;padding:24px 24px 22px;border-bottom:4px solid #FF6B1A">
    <div style="color:#FF6B1A;font-size:11px;letter-spacing:.25em;text-transform:uppercase">Welcome aboard</div>
    <h1 style="margin:8px 0 0;font-size:22px">Hi {{firstName}}, great to meet you</h1>
  </div>
  <div style="padding:24px;background:#fafafa">
    <p>Thanks for reaching out about precision tooling. Our engineering team has all your details and will follow up within 24-48h with technical specs and a costed proposal.</p>
    <p>In the meantime, our full catalog and technical docs are always at <a href="https://www.masterpiece-tools.com" style="color:#FF6B1A">masterpiece-tools.com</a>.</p>
    <p style="margin-top:24px;color:#666;font-size:13px">— The Masterpiece team</p>
  </div>
</div>`,
  },
  {
    name: 'Quote reply — proposal attached',
    subject: 'Your quote {{quoteId}} — proposal inside',
    kind: 'reply',
    description: 'Use when replying to a quote with an attached PDF proposal.',
    html: `<div style="font-family:Arial;line-height:1.6;max-width:600px;margin:auto;color:#111">
  <p>Hi {{firstName}},</p>
  <p>Thanks for your patience. Please find your proposal attached to this email — it covers pricing, lead time and our recommended specifications.</p>
  <p>{{message}}</p>
  <p>Reply to this email with any questions and we'll iterate.</p>
  <p style="color:#666;font-size:13px;margin-top:20px">— Masterpiece Tools · Quote {{quoteId}}</p>
</div>`,
  },
  {
    name: 'Follow-up — no response yet',
    subject: 'Following up on quote {{quoteId}}',
    kind: 'reply',
    description: 'Polite follow-up after a few days of silence.',
    html: `<div style="font-family:Arial;line-height:1.6;max-width:600px;margin:auto;color:#111">
  <p>Hi {{firstName}},</p>
  <p>Just bumping our previous message about <strong>quote {{quoteId}}</strong> in case it slipped past. Happy to revise scope, quantity or lead time — whatever helps you move forward.</p>
  <p>Let me know if you'd like to hop on a 15-min call.</p>
  <p style="color:#666;font-size:13px;margin-top:20px">— Masterpiece Tools</p>
</div>`,
  },
  {
    name: 'Newsletter — product launch',
    subject: 'New release from Masterpiece: precision you can feel',
    kind: 'newsletter',
    description: 'Generic newsletter shell for product or company news.',
    html: `<div style="font-family:Arial;line-height:1.6;max-width:600px;margin:auto;color:#111">
  <div style="background:#000;color:#fff;padding:24px;text-align:center">
    <div style="color:#FF6B1A;font-size:11px;letter-spacing:.25em;text-transform:uppercase">Newsletter</div>
    <h1 style="margin:8px 0 0;font-size:26px">Headline goes here</h1>
  </div>
  <div style="padding:24px">
    <p>Hello {{firstName}},</p>
    <p>Replace this paragraph with the story you want to share. Keep it short — under 200 words tends to perform best.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="https://www.masterpiece-tools.com" style="background:#FF6B1A;color:#fff;padding:12px 24px;text-decoration:none;letter-spacing:.05em">Discover more</a>
    </p>
    <p style="color:#666;font-size:12px">You're receiving this because you previously requested a quote from Masterpiece Innovations B.V.</p>
  </div>
</div>`,
  },
];

const AdminEmailTemplates = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const htmlRef = useRef(null);

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

  const quickAdd = (tpl) => setEditing({ ...blank, ...tpl });

  const insertAt = (snippet) => {
    if (!editing) return;
    const ta = htmlRef.current;
    if (!ta) {
      setEditing({ ...editing, html: editing.html + snippet });
      return;
    }
    const start = ta.selectionStart ?? editing.html.length;
    const end = ta.selectionEnd ?? editing.html.length;
    const next = editing.html.slice(0, start) + snippet + editing.html.slice(end);
    setEditing({ ...editing, html: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="p-8" data-testid="admin-email-templates">
      <Helmet><title>Email templates — Owner Panel</title></Helmet>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-orange-500">Communication</div>
          <h1 className="text-2xl font-black text-white">Email templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Pre-built emails you can drop into quote replies and customer messages. Use placeholders to personalize.</p>
        </div>
        <Button onClick={() => setEditing({ ...blank })} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-tpl-new">
          <Plus className="w-4 h-4 mr-2" /> New template
        </Button>
      </div>

      {/* Tutorial banner */}
      <div className="border border-orange-500/30 bg-orange-500/5 mb-5">
        <button onClick={() => setShowTutorial((s) => !s)} className="w-full flex items-center justify-between px-4 py-3 text-left" data-testid="admin-tpl-tutorial-toggle">
          <span className="inline-flex items-center gap-2 text-orange-300 text-sm font-bold">
            <BookOpen className="w-4 h-4" /> How email templates work
          </span>
          {showTutorial ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
        </button>
        {showTutorial && (
          <div className="px-4 pb-4 text-sm text-neutral-300 space-y-2.5 leading-relaxed">
            <p><strong className="text-white">1. Pick a quick-start</strong> below or hit <em>New template</em> for a blank canvas.</p>
            <p><strong className="text-white">2. Use placeholders</strong> like <code className="text-orange-400">{`{{firstName}}`}</code> — they get replaced with the recipient's real data when the email goes out.</p>
            <p><strong className="text-white">3. Reuse anywhere</strong> — every template shows up in the <em>Customers → Email</em> and <em>Quotes → Reply</em> dialogs as a one-click drop-in.</p>
            <p><strong className="text-white">4. HTML is fine</strong> — paste any HTML in the body field. The live preview on the right shows exactly what your recipient sees.</p>
          </div>
        )}
      </div>

      {/* Quick-start cards */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-[11px] tracking-widest text-neutral-400 uppercase"><Sparkles className="w-3 h-3 text-orange-500" /> Quick-start templates</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {QUICK_TEMPLATES.map((q) => (
            <button key={q.name} onClick={() => quickAdd(q)} className="border border-neutral-800 hover:border-orange-500 bg-neutral-950 hover:bg-orange-500/5 p-3 text-left transition-colors" data-testid={`admin-tpl-quick-${q.kind}`}>
              <div className="text-white font-medium text-sm">{q.name}</div>
              <div className="text-[10px] tracking-widest uppercase text-orange-400 border border-orange-500/30 px-1.5 py-0.5 inline-block mt-1.5">{q.kind}</div>
              <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2">{q.description}</p>
            </button>
          ))}
        </div>
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
                <tr><td colSpan={4} className="p-8 text-center text-neutral-500">No templates yet. Try one of the quick-start cards above.</td></tr>
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
          <div className="bg-neutral-950 border border-neutral-800 max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 flex items-center justify-between">
              <div className="text-white font-bold flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /> {editing.id ? 'Edit template' : 'New template'}</div>
              <button onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white text-xs">Close</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name <span className="text-neutral-600 normal-case tracking-normal">(internal label only)</span></label>
                  <Input data-testid="admin-tpl-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-neutral-900 border-neutral-800" placeholder="e.g. Welcome — new customer" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Kind</label>
                  <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                    <option value="custom">custom (any email)</option>
                    <option value="reply">reply (used in quote replies)</option>
                    <option value="rfq_owner">rfq_owner (new RFQ notice)</option>
                    <option value="rfq_customer">rfq_customer (customer confirmation)</option>
                    <option value="newsletter">newsletter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Subject line</label>
                <Input data-testid="admin-tpl-subject" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="bg-neutral-900 border-neutral-800" placeholder="e.g. Welcome to Masterpiece, {{firstName}}" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Internal description</label>
                <Input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-neutral-900 border-neutral-800" placeholder="When should this template be used?" />
              </div>

              {/* Placeholder palette */}
              <div className="border border-neutral-900 bg-neutral-950 p-3">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" /> Insert a placeholder
                </div>
                <p className="text-[11px] text-neutral-500 mb-2">Click to drop into the body. They get replaced with real data on send.</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.tag}
                      onClick={() => insertAt(p.tag)}
                      title={p.desc}
                      className="text-[11px] font-mono bg-neutral-900 border border-neutral-800 hover:border-orange-500 hover:text-orange-400 text-neutral-300 px-2 py-1"
                      data-testid={`admin-tpl-ph-${p.tag.replace(/[{}]/g, '')}`}
                    >
                      {p.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">HTML body</label>
                  <Textarea data-testid="admin-tpl-html" ref={htmlRef} value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} className="bg-neutral-900 border-neutral-800 min-h-[300px] font-mono text-xs" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Live preview</label>
                  <div className="border border-neutral-800 bg-white text-black min-h-[300px] p-4 overflow-auto" dangerouslySetInnerHTML={safeHtml(editing.html)} />
                </div>
              </div>
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-neutral-950">
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-tpl-save">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplates;
