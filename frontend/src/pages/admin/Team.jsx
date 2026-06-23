import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit3, Trash2, Loader2, ShieldCheck, UserCog, KeyRound, Bell } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const PERM_GROUPS = [
  { label: 'Quotes',     keys: ['quotes.read', 'quotes.edit', 'quotes.delete', 'quotes.reply'] },
  { label: 'Customers',  keys: ['customers.read', 'customers.edit', 'customers.delete', 'customers.email'] },
  { label: 'Products',   keys: ['products.read', 'products.edit', 'products.delete'] },
  { label: 'Categories', keys: ['categories.read', 'categories.edit', 'categories.delete'] },
  { label: 'Settings',   keys: ['settings.read', 'settings.edit'] },
  { label: 'Team',       keys: ['team.read', 'team.edit', 'team.delete'] },
  { label: 'Templates',  keys: ['templates.read', 'templates.edit'] },
];

const blank = (templates) => ({
  email: '', name: '', role: 'member', password: '',
  permissions: { ...(templates?.member || {}) },
  notifications: { newRfq: false },
});

const AdminTeam = () => {
  const [members, setMembers] = useState([]);
  const [templates, setTemplates] = useState({ owner: {}, admin: {}, member: {} });
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);  // null | { id?, email, name, role, password, permissions }
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.adminListTeam();
      setMembers(res.members || []);
      setTemplates(res.permissionTemplates || templates);
    } catch (e) {
      toast({ title: 'Failed to load team', description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const startNew = () => setEditor(blank(templates));
  const startEdit = (m) => setEditor({
    ...m,
    password: '',
    permissions: { ...(m.permissions || templates[m.role] || {}) },
    notifications: { newRfq: false, ...(m.notifications || {}) },
  });

  const save = async () => {
    if (!editor.email || !editor.name || (!editor.id && !editor.password)) {
      toast({ title: 'Email, name and (for new members) password are required' });
      return;
    }
    setSaving(true);
    try {
      if (editor.id) {
        const patch = {
          name: editor.name,
          role: editor.role,
          permissions: editor.permissions,
          notifications: editor.notifications || { newRfq: false },
        };
        if (editor.password) patch.password = editor.password;
        if (editor.active !== undefined) patch.active = editor.active;
        await api.adminUpdateTeam(editor.id, patch);
        toast({ title: 'Member updated' });
      } else {
        await api.adminCreateTeam({
          email: editor.email,
          name: editor.name,
          role: editor.role,
          password: editor.password,
          permissions: editor.permissions,
          notifications: editor.notifications || { newRfq: false },
        });
        toast({ title: 'Member invited' });
      }
      setEditor(null);
      refresh();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name || m.email}?`)) return;
    try {
      await api.adminDeleteTeam(m.id);
      refresh();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message });
    }
  };

  return (
    <div className="p-8" data-testid="admin-team">
      <Helmet><title>Team — Owner Panel</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-orange-500">Access control</div>
          <h1 className="text-2xl font-black text-white">Team &amp; permissions</h1>
          <p className="text-sm text-neutral-500 mt-1">Owner-only. Invite members with restricted access.</p>
        </div>
        <Button onClick={startNew} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-team-new">
          <Plus className="w-4 h-4 mr-2" /> Invite member
        </Button>
      </div>

      {loading ? (
        <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="border border-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-neutral-500 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left p-3">Member</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Permissions</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No team members yet — you (the owner) have full access. Invite someone with a restricted role.</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="border-t border-neutral-900" data-testid={`admin-team-row-${m.email}`}>
                  <td className="p-3">
                    <div className="text-white font-medium">{m.name || m.email}</div>
                    <div className="text-xs text-neutral-500">{m.email}</div>
                  </td>
                  <td className="p-3"><span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-orange-400 border border-orange-500/30 px-1.5 py-0.5">{m.role}</span></td>
                  <td className="p-3 text-neutral-400 text-xs">{Object.values(m.permissions || {}).filter(Boolean).length} grants</td>
                  <td className="p-3"><span className={`text-[10px] uppercase tracking-widest ${m.active ? 'text-emerald-400' : 'text-neutral-600'}`}>{m.active ? 'Active' : 'Disabled'}</span></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(m)} className="rounded-none bg-transparent border-neutral-800 text-neutral-300 hover:border-orange-500 hover:text-orange-500" data-testid={`admin-team-edit-${m.email}`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(m)} className="rounded-none bg-transparent border-neutral-800 text-neutral-400 hover:border-red-500 hover:text-red-500" data-testid={`admin-team-delete-${m.email}`}>
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

      {editor && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => !saving && setEditor(null)}>
          <div className="bg-neutral-950 border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-900 px-5 py-3 flex items-center justify-between">
              <div className="text-white font-bold flex items-center gap-2"><UserCog className="w-4 h-4 text-orange-500" /> {editor.id ? 'Edit member' : 'Invite new member'}</div>
              <button onClick={() => setEditor(null)} className="text-neutral-500 hover:text-white text-xs">Close</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Email</label>
                  <Input data-testid="admin-team-email" value={editor.email} onChange={(e) => setEditor({ ...editor, email: e.target.value })} disabled={!!editor.id} className="bg-neutral-900 border-neutral-800 disabled:opacity-60" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
                  <Input data-testid="admin-team-name" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} className="bg-neutral-900 border-neutral-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">Role</label>
                  <select
                    value={editor.role}
                    onChange={(e) => setEditor({ ...editor, role: e.target.value, permissions: { ...(templates[e.target.value] || {}) } })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3"
                    data-testid="admin-team-role"
                  >
                    <option value="admin">Admin — full operational access</option>
                    <option value="member">Member — restricted</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">{editor.id ? 'New password (optional)' : 'Initial password'}</label>
                  <Input data-testid="admin-team-password" type="password" value={editor.password} onChange={(e) => setEditor({ ...editor, password: e.target.value })} className="bg-neutral-900 border-neutral-800" placeholder={editor.id ? 'Leave blank to keep' : 'min 8 chars'} />
                </div>
              </div>
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Permissions</div>
                {PERM_GROUPS.map((g) => (
                  <div key={g.label} className="border border-neutral-900 mb-2">
                    <div className="px-3 py-1.5 bg-neutral-950 text-xs uppercase tracking-widest text-neutral-400 font-bold">{g.label}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2">
                      {g.keys.map((k) => (
                        <label key={k} className="flex items-center gap-2 text-xs text-neutral-300">
                          <input
                            type="checkbox"
                            checked={!!editor.permissions?.[k]}
                            onChange={(e) => setEditor({ ...editor, permissions: { ...editor.permissions, [k]: e.target.checked } })}
                            data-testid={`admin-team-perm-${k}`}
                          />
                          <span className="font-mono text-[11px]">{k.split('.').pop()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5"><Bell className="w-3 h-3" /> Notifications</div>
                <div className="border border-neutral-900">
                  <div className="px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editor.notifications?.newRfq}
                        onChange={(e) => setEditor({
                          ...editor,
                          notifications: { ...(editor.notifications || {}), newRfq: e.target.checked },
                        })}
                        data-testid="admin-team-notif-newRfq"
                      />
                      <span>
                        Receive a copy of every new <strong className="text-white">RFQ / quote request</strong> notification email
                      </span>
                    </label>
                    <p className="text-[11px] text-neutral-500 mt-1 ml-6">Requires the member to also have <code className="text-orange-400 font-mono">quotes.read</code> permission. Owner is always notified.</p>
                  </div>
                </div>
              </div>
              {editor.id && (
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" checked={editor.active !== false} onChange={(e) => setEditor({ ...editor, active: e.target.checked })} />
                  Account active
                </label>
              )}
            </div>
            <div className="border-t border-neutral-900 px-5 py-3 flex justify-end gap-2">
              <Button onClick={() => setEditor(null)} variant="outline" className="rounded-none bg-transparent border-neutral-800 text-neutral-300">Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="admin-team-save">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editor.id ? 'Save' : 'Send invite')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeam;
