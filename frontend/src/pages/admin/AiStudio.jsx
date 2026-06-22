import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus, Send, Sparkles, Loader2, Trash2, Edit3, Check, X,
  Undo2, FileText, Wrench, ShieldCheck, Search, MessageSquare, Globe, Settings as SettingsIcon,
  Paperclip,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// Small helpers ---------------------------------------------------------------
const useAutosize = (ref, value) => {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(220, el.scrollHeight) + 'px';
  }, [value, ref]);
};

const ActionBadge = ({ tool }) => {
  const map = {
    update_settings: { icon: SettingsIcon, color: 'border-orange-500/40 text-orange-300 bg-orange-500/5' },
    create_product:  { icon: Plus, color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/5' },
    update_product:  { icon: Edit3, color: 'border-sky-500/40 text-sky-300 bg-sky-500/5' },
    delete_product:  { icon: Trash2, color: 'border-red-500/40 text-red-300 bg-red-500/5' },
    create_category: { icon: Plus, color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/5' },
    update_category: { icon: Edit3, color: 'border-sky-500/40 text-sky-300 bg-sky-500/5' },
    delete_category: { icon: Trash2, color: 'border-red-500/40 text-red-300 bg-red-500/5' },
    reply_to_quote:  { icon: MessageSquare, color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/5' },
    send_email:      { icon: MessageSquare, color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/5' },
    update_quote:    { icon: Edit3, color: 'border-sky-500/40 text-sky-300 bg-sky-500/5' },
    list_products:   { icon: Search, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' },
    list_quotes:     { icon: Search, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' },
    list_categories: { icon: Search, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' },
    list_documents:  { icon: Search, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' },
    get_settings:    { icon: Search, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' },
    search_web:      { icon: Globe, color: 'border-amber-500/40 text-amber-300 bg-amber-500/5' },
    fetch_url:       { icon: Globe, color: 'border-amber-500/40 text-amber-300 bg-amber-500/5' },
    create_document: { icon: FileText, color: 'border-purple-500/40 text-purple-300 bg-purple-500/5' },
    delete_document: { icon: Trash2, color: 'border-red-500/40 text-red-300 bg-red-500/5' },
    retranslate_product: { icon: Wrench, color: 'border-orange-500/40 text-orange-300 bg-orange-500/5' },
  };
  const cfg = map[tool] || { icon: Wrench, color: 'border-neutral-700 text-neutral-400 bg-neutral-900/50' };
  const Ic = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${cfg.color} text-[10px] tracking-widest uppercase font-mono`}>
      <Ic className="w-3 h-3" /> {tool}
    </span>
  );
};

// Renders an action card with result preview + undo
const ActionCard = ({ action, onUndo, undoing }) => {
  const r = action.result || {};
  const ok = r.ok !== false;
  const error = !ok ? (r.error || 'Failed') : null;
  const summary = useMemo(() => {
    if (error) return error;
    if (action.tool === 'update_settings' && r.applied) return Object.entries(r.applied).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
    if (action.tool === 'create_product') return `Created "${r.name}" (id ${r.id})`;
    if (action.tool === 'create_category') return `Created category "${r.name}"`;
    if (action.tool === 'delete_product') return 'Product deleted';
    if (action.tool === 'reply_to_quote') return `Email sent to ${r.to} (${r.mode})`;
    if (action.tool === 'send_email') return `Email sent to ${r.to} (${r.mode})`;
    if (action.tool === 'create_document') return `Document "${r.title}" created`;
    if (action.tool === 'list_products') return `${r.count || 0} products`;
    if (action.tool === 'list_quotes') return `${r.count || 0} quotes`;
    if (action.tool === 'list_categories') return `${r.count || 0} categories`;
    if (action.tool === 'get_settings') return 'Read settings';
    if (action.tool === 'search_web') return `${(r.results || []).length} results for "${r.query}"`;
    if (action.tool === 'fetch_url') return `Fetched ${r.url} (HTTP ${r.status})`;
    return 'OK';
  }, [action, r, error]);
  return (
    <div className={`mt-2 border ${ok ? 'border-neutral-800' : 'border-red-500/40'} bg-neutral-950 p-3`} data-testid={`ai-action-${action.tool}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ActionBadge tool={action.tool} />
            {action.undone && <span className="text-[10px] tracking-widest uppercase text-amber-400 border border-amber-500/40 px-2 py-0.5">Undone</span>}
          </div>
          <div className="mt-1.5 text-sm text-neutral-300 break-words">{summary}</div>
        </div>
        {action.undoable && !action.undone && (
          <Button
            size="sm"
            variant="outline"
            disabled={undoing}
            onClick={() => onUndo(action.id)}
            data-testid={`ai-undo-${action.id}`}
            className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs shrink-0"
          >
            {undoing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Undo2 className="w-3 h-3 mr-1.5" /> Undo</>}
          </Button>
        )}
      </div>
    </div>
  );
};

const Message = ({ msg, isUser, editing, onStartEdit, onSaveEdit, onCancelEdit, onUndo, undoing }) => {
  const [draft, setDraft] = useState(msg.content);
  const editRef = useRef(null);
  useAutosize(editRef, draft);

  if (isUser) {
    return (
      <div className="group flex justify-end" data-testid={`ai-msg-user-${msg.id}`}>
        <div className="max-w-[80%] bg-orange-500 text-black p-3.5 rounded-xl rounded-br-sm relative">
          {editing ? (
            <div className="w-[420px] max-w-full">
              <Textarea
                ref={editRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="bg-black/20 border-black/30 text-black resize-none focus-visible:ring-black/40"
                data-testid={`ai-msg-edit-${msg.id}`}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancelEdit} className="text-xs uppercase tracking-widest text-black/70 hover:text-black px-2 py-1 inline-flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                <button
                  onClick={() => onSaveEdit(msg.id, draft)}
                  disabled={!draft.trim()}
                  className="text-xs uppercase tracking-widest bg-black text-orange-400 px-3 py-1 inline-flex items-center gap-1 disabled:opacity-50"
                  data-testid={`ai-msg-edit-save-${msg.id}`}
                ><Check className="w-3 h-3" /> Save &amp; re-run</button>
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
              {(msg.attachments || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(msg.attachments || []).map((a, i) => (
                    <span key={`${a.name}-${a.size}-${i}`} className="inline-flex items-center gap-1.5 bg-black/30 border border-black/40 px-2 py-0.5 text-[11px] text-black/90">
                      <FileText className="w-3 h-3" /> {a.name}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => onStartEdit(msg.id)}
                className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-orange-500 p-1.5"
                title="Edit and re-run"
                data-testid={`ai-msg-edit-btn-${msg.id}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  // Assistant
  return (
    <div className="flex justify-start" data-testid={`ai-msg-assistant-${msg.id}`}>
      <div className="max-w-[80%]">
        <div className="bg-neutral-900 border border-neutral-800 text-white p-3.5 rounded-xl rounded-bl-sm">
          <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Masterpiece Studio AI</div>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
        </div>
        {(msg.actions || []).map((a) => (
          <ActionCard key={a.id} action={a} onUndo={onUndo} undoing={undoing === a.id} />
        ))}
      </div>
    </div>
  );
};

const AiStudio = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [conv, setConv] = useState(null);          // { id, title, messages: [] }
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);  // [{name,type,size,data}]
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [undoing, setUndoing] = useState(null);
  const textareaRef = useRef(null);
  const scrollerRef = useRef(null);
  const fileInputRef = useRef(null);
  useAutosize(textareaRef, draft);

  const refreshConversations = async () => {
    try {
      const res = await api.aiListConversations();
      setConversations(res.conversations || []);
      return res.conversations || [];
    } catch (e) {
      toast({ title: 'Failed to load chats', description: e.message });
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const list = await refreshConversations();
      if (list.length === 0) {
        const c = await api.aiCreateConversation();
        await refreshConversations();
        setActiveId(c.id);
      } else {
        setActiveId(list[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run-once mount effect
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingConv(true);
    api.aiGetConversation(activeId).then((c) => setConv(c)).catch((e) => toast({ title: 'Failed to load chat', description: e.message })).finally(() => setLoadingConv(false));
  }, [activeId]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [conv?.messages?.length, sending]);

  const newChat = async () => {
    const c = await api.aiCreateConversation();
    await refreshConversations();
    setActiveId(c.id);
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    await api.aiDeleteConversation(id);
    await refreshConversations();
    if (id === activeId) {
      const list = await api.aiListConversations();
      setActiveId(list.conversations?.[0]?.id || null);
      if (!list.conversations?.length) {
        const c = await api.aiCreateConversation();
        await refreshConversations();
        setActiveId(c.id);
      }
    }
  };

  const send = async () => {
    if ((!draft.trim() && pendingFiles.length === 0) || sending || !activeId) return;
    setSending(true);
    const message = draft || (pendingFiles.length ? `(${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} attached)` : '');
    const attachments = pendingFiles;
    setDraft('');
    setPendingFiles([]);
    try {
      await api.aiSendMessage(activeId, { message, attachments });
      const updated = await api.aiGetConversation(activeId);
      setConv(updated);
      await refreshConversations();
    } catch (e) {
      toast({ title: 'AI failed', description: e.message });
      setDraft(message);
      setPendingFiles(attachments);
    } finally {
      setSending(false);
    }
  };

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > 8 * 1024 * 1024) {
      toast({ title: 'Files too large', description: 'Keep total upload under 8 MB.' });
      return;
    }
    const parts = await Promise.all(files.map((f) => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, type: f.type || '', size: f.size, data: r.result });
      r.readAsDataURL(f);
    })));
    setPendingFiles((prev) => [...prev, ...parts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveEdit = async (messageId, newContent) => {
    if (!newContent.trim() || !activeId) return;
    setSending(true);
    setEditingId(null);
    try {
      await api.aiEditMessage(activeId, messageId, { message: newContent });
      const updated = await api.aiGetConversation(activeId);
      setConv(updated);
      await refreshConversations();
    } catch (e) {
      toast({ title: 'Edit failed', description: e.message });
    } finally {
      setSending(false);
    }
  };

  const undoAction = async (actionId) => {
    setUndoing(actionId);
    try {
      const res = await api.aiUndoAction(actionId);
      if (res?.ok) {
        toast({ title: 'Undone' });
        const updated = await api.aiGetConversation(activeId);
        setConv(updated);
      } else {
        toast({ title: 'Could not undo', description: res?.error || 'Unknown error' });
      }
    } catch (e) {
      toast({ title: 'Undo failed', description: e.message });
    } finally {
      setUndoing(null);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <Helmet><title>AI Studio — Owner Panel</title></Helmet>

      {/* Threads */}
      <aside className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950 flex flex-col" data-testid="ai-sidebar">
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-widest uppercase text-orange-500 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Studio</div>
            <div className="text-white font-bold mt-0.5">Conversations</div>
          </div>
          <Button onClick={newChat} size="sm" className="bg-orange-500 hover:bg-orange-400 rounded-none h-8" data-testid="ai-new-conv"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`group flex items-center justify-between gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors border-l-2 ${c.id === activeId ? 'bg-neutral-900 text-white border-orange-500' : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-white border-transparent'}`}
              data-testid={`ai-conv-${c.id}`}
            >
              <div className="truncate flex-1">{c.title || 'New chat'}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-neutral-900 text-[11px] text-neutral-500 leading-relaxed">
          <div className="flex items-center gap-1.5 text-orange-500 font-bold tracking-widest uppercase mb-1.5"><ShieldCheck className="w-3 h-3" /> Owner-only</div>
          <div>AI runs on your Emergent Universal Key. Top-up balance in <span className="text-neutral-300">Profile → Universal Key</span>.</div>
        </div>
      </aside>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-neutral-900 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-widest uppercase text-neutral-500">{user?.email}</div>
            <div className="text-white font-bold truncate max-w-[600px]">{conv?.title || 'Loading…'}</div>
          </div>
          <div className="text-[10px] tracking-widest uppercase text-neutral-500">claude-sonnet-4-5</div>
        </div>

        {loadingConv ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-6 space-y-5" data-testid="ai-chat-scroll">
            {(conv?.messages || []).length === 0 && (
              <div className="max-w-xl mx-auto text-center mt-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 border border-orange-500/30 mb-4">
                  <Sparkles className="w-7 h-7 text-orange-500" />
                </div>
                <h2 className="text-white font-black text-2xl">Masterpiece Studio AI</h2>
                <p className="text-neutral-400 mt-2 text-sm">Ask me to update settings, create products, reply to quotes, send emails, write documents, or search the web. I respect your role &amp; permissions.</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {[
                    'Change the SEO title to "Aerospace Precision Specialists"',
                    'List all open quotes',
                    'Reply to Q-1234 saying lead time is 3 weeks',
                    'Create a 1-page sales sheet for the M6 thread gauge',
                  ].map((q) => (
                    <button key={q} onClick={() => setDraft(q)} className="text-sm text-neutral-300 border border-neutral-800 hover:border-orange-500 hover:text-orange-400 px-3 py-2 transition-colors text-left">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(conv?.messages || []).map((m) => (
              <Message
                key={m.id}
                msg={m}
                isUser={m.role === 'user'}
                editing={editingId === m.id}
                onStartEdit={(id) => setEditingId(id)}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
                onUndo={undoAction}
                undoing={undoing}
              />
            ))}
            {sending && (
              <div className="flex justify-start" data-testid="ai-typing">
                <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 p-3.5 rounded-xl rounded-bl-sm inline-flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Thinking…
                </div>
              </div>
            )}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-neutral-900 p-4">
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2" data-testid="ai-pending-files">
              {pendingFiles.map((f, i) => (
                <div key={`${f.name}-${f.size}-${i}`} className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <span className="text-neutral-600">{Math.round(f.size / 1024)} KB</span>
                  <button onClick={() => setPendingFiles((prev) => prev.filter((_, k) => k !== i))} className="text-neutral-500 hover:text-red-400 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.json,.csv,.xml,.html,.htm,.yml,.yaml,.log,image/*"
              onChange={onPickFiles}
              className="hidden"
              data-testid="ai-file-input"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-neutral-800 hover:border-orange-500 hover:text-orange-500 bg-transparent text-neutral-400 rounded-none h-11 w-11 p-0 shrink-0"
              data-testid="ai-attach-btn"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask, request changes, or drop a file. Shift+Enter for a new line."
              className="bg-neutral-950 border-neutral-800 text-white min-h-[44px] max-h-[220px] resize-none focus-visible:ring-orange-500"
              data-testid="ai-composer"
              disabled={sending}
            />
            <Button
              onClick={send}
              disabled={(!draft.trim() && pendingFiles.length === 0) || sending}
              className="bg-orange-500 hover:bg-orange-400 rounded-none h-11 disabled:opacity-50"
              data-testid="ai-send-btn"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send</>}
            </Button>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-600 mt-2">PDF, text, CSV, JSON and HTML are extracted for the AI. Up to 8 MB total. Live actions are real. Every change is undoable.</div>
        </div>
      </div>
    </div>
  );
};

export default AiStudio;
