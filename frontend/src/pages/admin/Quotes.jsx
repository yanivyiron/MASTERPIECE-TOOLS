import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MOCK_QUOTES } from '../../mock';
import { useLang } from '../../context/LanguageContext';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Search, Send, Mail, FileText, Building, Globe, Clock } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const STATUS_OPTIONS = ['new', 'in-progress', 'replied', 'closed'];

const statusBadge = (s) => {
  const map = {
    new: 'border-orange-500/40 text-orange-400 bg-orange-500/5',
    'in-progress': 'border-amber-500/40 text-amber-400 bg-amber-500/5',
    replied: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
    closed: 'border-neutral-700 text-neutral-400 bg-neutral-800/30'
  };
  return map[s] || map.new;
};

const AdminQuotes = () => {
  const { t } = useLang();
  const [quotes, setQuotes] = useState(MOCK_QUOTES);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');

  // Load locally submitted quotes too
  React.useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem('mpt_quotes') || '[]');
      if (local.length) {
        const merged = [...local.map(l => ({
          id: l.id, date: l.submittedAt, status: 'new',
          customer: { name: l.name, company: l.company, email: l.email, country: l.country },
          items: l.items || [], notes: l.message || '', total: null
        })), ...MOCK_QUOTES];
        setQuotes(merged);
      }
    } catch (e) {/* ignore */ }
  }, []);

  const filtered = quotes.filter(q => {
    if (filter !== 'all' && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return q.id.toLowerCase().includes(s) || q.customer.name.toLowerCase().includes(s) || q.customer.email.toLowerCase().includes(s) || q.customer.company.toLowerCase().includes(s);
    }
    return true;
  });

  const updateStatus = (id, status) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    toast({ title: 'Status updated', description: `${id} → ${status}` });
  };

  const sendReply = () => {
    if (!reply.trim() || !active) return;
    // MOCK: in production this will POST /api/quotes/:id/reply
    updateStatus(active.id, 'replied');
    toast({ title: 'Reply sent', description: `Email queued to ${active.customer.email}` });
    setReply('');
    setActive(null);
  };

  return (
    <div className="p-8">
      <Helmet><title>Quotes — Owner Panel</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">{t('admin.quotes')}</h1>
          <p className="text-neutral-500 text-sm mt-1">Review, reply and manage all incoming RFQs.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs uppercase tracking-widest border ${filter === s ? 'border-orange-500 text-orange-500' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
            {s} {s !== 'all' && <span className="ml-1 opacity-60">{quotes.filter(q => q.status === s).length}</span>}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-64 focus-visible:ring-orange-500" />
        </div>
      </div>

      <div className="border border-neutral-800 bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-900 text-[10px] uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-4 py-3 text-orange-500 font-mono text-xs">{q.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{q.customer.name}</div>
                    <div className="text-xs text-neutral-500">{q.customer.company}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{q.items?.length || 0}</td>
                  <td className="px-4 py-3">
                    <select value={q.status} onChange={(e) => updateStatus(q.id, e.target.value)} className={`bg-transparent border px-2 py-1 text-[10px] uppercase tracking-widest ${statusBadge(q.status)} cursor-pointer outline-none`}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-neutral-950 text-white">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{new Date(q.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => setActive(q)} className="bg-orange-500 hover:bg-orange-400 rounded-none h-8 text-xs">Open</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-neutral-500">No quotes match the current filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-white p-0 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="p-5 border-b border-neutral-800">
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500" /> {active?.id}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Customer</div><div className="flex items-center gap-2 mt-1"><Building className="w-3.5 h-3.5 text-orange-500" /><span className="text-white">{active.customer.name}</span></div><div className="text-neutral-500 text-xs">{active.customer.company}</div></div>
                <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Contact</div><div className="flex items-center gap-2 mt-1"><Mail className="w-3.5 h-3.5 text-orange-500" /><a className="text-white hover:text-orange-500" href={`mailto:${active.customer.email}`}>{active.customer.email}</a></div></div>
                <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Country</div><div className="flex items-center gap-2 mt-1"><Globe className="w-3.5 h-3.5 text-orange-500" /><span className="text-white">{active.customer.country || '—'}</span></div></div>
                <div><div className="text-neutral-500 text-xs uppercase tracking-widest">Submitted</div><div className="flex items-center gap-2 mt-1"><Clock className="w-3.5 h-3.5 text-orange-500" /><span className="text-white">{new Date(active.date).toLocaleString()}</span></div></div>
              </div>

              <div>
                <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Items ({active.items?.length || 0})</div>
                {active.items && active.items.length > 0 ? (
                  <ul className="divide-y divide-neutral-800 border border-neutral-800">
                    {active.items.map((it, i) => (
                      <li key={i} className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="text-white">{it.name || it.nameKey || `Item ${i+1}`}</div>
                          {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                        </div>
                        <div className="text-neutral-400">Qty: {it.qty}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-neutral-500 text-sm">No basket items — custom RFQ.</div>}
              </div>

              {active.notes && (
                <div>
                  <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Notes</div>
                  <div className="text-sm text-neutral-300 border border-neutral-800 p-3 bg-neutral-900/40">{active.notes}</div>
                </div>
              )}

              <div>
                <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Reply to customer</div>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply... (will be emailed to the customer)" className="bg-neutral-900 border-neutral-800 text-white min-h-[120px] focus-visible:ring-orange-500" />
                <Button onClick={sendReply} disabled={!reply.trim()} className="mt-3 bg-orange-500 hover:bg-orange-400 rounded-none disabled:opacity-50">
                  <Send className="w-4 h-4 mr-2" /> Send Reply
                </Button>
                <p className="text-[11px] text-neutral-500 mt-2">MOCKED: email will be sent via backend (configured under Settings).</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuotes;
