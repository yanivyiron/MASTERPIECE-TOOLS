import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Mail, ShieldCheck, Save, Bell, Globe } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const KEY = 'mpt_admin_settings';
const defaults = {
  emailProvider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  notifyEmail: 'yaniv@masterpiece-innovations.com',
  fromEmail: 'noreply@masterpiece-tools.com',
  fromName: 'Masterpiece Tools',
  notifyOnNewQuote: true,
  notifyOnReply: true,
  defaultLanguage: 'en'
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch (e) {/* ignore */ }
  }, []);

  const update = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {/* ignore */ }
    toast({ title: 'Settings saved', description: 'Stored locally (will sync to backend later)' });
  };

  return (
    <div className="p-8 max-w-4xl">
      <Helmet><title>Settings — Owner Panel</title></Helmet>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Connect your email provider and notification preferences.</p>
        </div>
        <Button onClick={save} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10"><Save className="w-4 h-4 mr-2" /> Save</Button>
      </div>

      <div className="space-y-6">
        <div className="border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center gap-2 mb-5"><Mail className="w-5 h-5 text-orange-500" /><div className="text-white font-bold uppercase tracking-wide text-sm">Email Provider</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">Provider</Label>
              <select value={settings.emailProvider} onChange={(e) => update('emailProvider', e.target.value)} className="mt-2 w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="resend">Resend</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>
            <div>
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">From Name</Label>
              <Input value={settings.fromName} onChange={(e) => update('fromName', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" />
            </div>
            <div>
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">From Email</Label>
              <Input value={settings.fromEmail} onChange={(e) => update('fromEmail', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" />
            </div>
            <div>
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">Owner Notification Email</Label>
              <Input value={settings.notifyEmail} onChange={(e) => update('notifyEmail', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" />
            </div>
          </div>

          {settings.emailProvider === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-900">
              <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">SMTP Host</Label><Input value={settings.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
              <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Port</Label><Input value={settings.smtpPort} onChange={(e) => update('smtpPort', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
              <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Username</Label><Input value={settings.smtpUser} onChange={(e) => update('smtpUser', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
              <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Password / App Password</Label><Input type="password" value={settings.smtpPassword} onChange={(e) => update('smtpPassword', e.target.value)} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Credentials are encrypted and stored server-side (backend pending).</div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center gap-2 mb-5"><Bell className="w-5 h-5 text-orange-500" /><div className="text-white font-bold uppercase tracking-wide text-sm">Notifications</div></div>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Email me on every new quote</div>
                <div className="text-xs text-neutral-500">Sent to {settings.notifyEmail}</div>
              </div>
              <Switch checked={settings.notifyOnNewQuote} onCheckedChange={(v) => update('notifyOnNewQuote', v)} />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Notify on customer reply</div>
                <div className="text-xs text-neutral-500">Threaded conversation updates</div>
              </div>
              <Switch checked={settings.notifyOnReply} onCheckedChange={(v) => update('notifyOnReply', v)} />
            </label>
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-center gap-2 mb-5"><Globe className="w-5 h-5 text-orange-500" /><div className="text-white font-bold uppercase tracking-wide text-sm">Website Defaults</div></div>
          <div>
            <Label className="text-neutral-400 text-xs uppercase tracking-widest">Default Language</Label>
            <select value={settings.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)} className="mt-2 w-full max-w-xs bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
              <option value="en">English (default)</option>
              <option value="nl">Nederlands</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-neutral-500 italic">All settings are stored locally for now (MOCKED). Backend integration in Phase 2 will encrypt credentials and persist to database.</div>
      </div>
    </div>
  );
};

export default AdminSettings;
