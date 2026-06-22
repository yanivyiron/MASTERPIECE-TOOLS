import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Mail, ShieldCheck, Save, Bell, Globe, Building2, MessageCircle, Linkedin, RotateCcw } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { useSiteConfig, SITE_CONFIG_DEFAULTS } from '../../context/SiteConfigContext';

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <Label className="text-neutral-400 text-[11px] uppercase tracking-widest">{label}</Label>
    <div className="mt-2">{children}</div>
  </div>
);

const Section = ({ icon: Icon, title, hint, children }) => (
  <div className="border border-neutral-800 bg-neutral-950 p-6">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-5 h-5 text-orange-500" />
      <div className="text-white font-bold uppercase tracking-wide text-sm">{title}</div>
    </div>
    {hint && <p className="text-xs text-neutral-500 mb-5">{hint}</p>}
    <div className={hint ? 'mt-5' : 'mt-5'}>{children}</div>
  </div>
);

const AdminSettings = () => {
  const { config, updateConfig, resetConfig } = useSiteConfig();
  const update = (k) => (v) => updateConfig({ [k]: typeof v === 'object' && v?.target ? v.target.value : v });

  const save = () => {
    toast({ title: 'Settings saved', description: 'All site-wide changes are live across every page.' });
  };
  const reset = () => {
    if (window.confirm('Reset all site settings to defaults?')) {
      resetConfig();
      toast({ title: 'Settings reset', description: 'Defaults restored.' });
    }
  };

  // Helper: derived value
  const stdInput = 'bg-neutral-900 border-neutral-800 text-white focus-visible:ring-orange-500';

  return (
    <div className="p-6 sm:p-8 max-w-5xl" data-testid="admin-settings">
      <Helmet><title>Settings — Owner Panel</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Site Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Edit content, contact details, social links, email, and defaults — visible site-wide.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={reset} variant="outline" className="border-neutral-700 hover:border-orange-500 text-neutral-200 hover:text-orange-500 bg-transparent rounded-none h-10" data-testid="settings-reset-btn">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={save} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10" data-testid="settings-save-btn">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Section icon={Building2} title="Company Information" hint="Shown in footer, header bar, and emails.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" className="md:col-span-2">
              <Input value={config.companyName} onChange={update('companyName')} className={stdInput} data-testid="settings-company-name" />
            </Field>
            <Field label="Tagline (used in SEO/About)" className="md:col-span-2">
              <Input value={config.companyTagline} onChange={update('companyTagline')} className={stdInput} />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={config.companyAddress} onChange={update('companyAddress')} className={stdInput} data-testid="settings-address" />
            </Field>
            <Field label="Phone">
              <Input value={config.contactPhone} onChange={update('contactPhone')} className={stdInput} data-testid="settings-phone" />
            </Field>
            <Field label="Public Contact Email">
              <Input value={config.contactEmail} onChange={update('contactEmail')} className={stdInput} data-testid="settings-email" />
            </Field>
            <Field label="Default RFQ Response Time">
              <Input value={config.rfqResponseTime} onChange={update('rfqResponseTime')} className={stdInput} placeholder="e.g. 24-48h" />
            </Field>
            <Field label="Certifications Tagline (header bar)">
              <Input value={config.certifications} onChange={update('certifications')} className={stdInput} />
            </Field>
          </div>
        </Section>

        <Section icon={MessageCircle} title="WhatsApp Floating Button" hint="The chat bubble in the bottom-right corner of every page.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Field label="WhatsApp Number (with country code)">
              <Input value={config.whatsappNumber} onChange={update('whatsappNumber')} className={stdInput} placeholder="+31 6 25363610" data-testid="settings-whatsapp-number" />
            </Field>
            <div className="flex items-center justify-between border border-neutral-800 bg-neutral-900 px-4 py-3">
              <div>
                <div className="text-white text-sm">Show WhatsApp Button</div>
                <div className="text-xs text-neutral-500">Toggle visibility globally</div>
              </div>
              <Switch checked={config.whatsappEnabled} onCheckedChange={update('whatsappEnabled')} data-testid="settings-whatsapp-toggle" />
            </div>
          </div>
        </Section>

        <Section icon={Linkedin} title="Social & Web Links" hint="Used in header, footer, and structured data.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="LinkedIn URL">
              <Input value={config.linkedinUrl} onChange={update('linkedinUrl')} className={stdInput} data-testid="settings-linkedin" placeholder="https://www.linkedin.com/company/..." />
            </Field>
            <Field label="Website URL (canonical)">
              <Input value={config.websiteUrl} onChange={update('websiteUrl')} className={stdInput} placeholder="https://www.masterpiece-tools.com" />
            </Field>
          </div>
        </Section>

        <Section icon={Mail} title="Email Provider (Phase 2)" hint="Stays mocked until the backend phase. Credentials will be encrypted server-side.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Provider">
              <select value={config.emailProvider} onChange={update('emailProvider')} className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="resend">Resend</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </Field>
            <Field label="From Name"><Input value={config.fromName} onChange={update('fromName')} className={stdInput} /></Field>
            <Field label="From Email"><Input value={config.fromEmail} onChange={update('fromEmail')} className={stdInput} /></Field>
            <Field label="Owner Notification Email">
              <Input value={config.notifyEmail} onChange={update('notifyEmail')} className={stdInput} data-testid="settings-notify-email" />
            </Field>
          </div>

          {config.emailProvider === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-900">
              <Field label="SMTP Host"><Input value={config.smtpHost} onChange={update('smtpHost')} className={stdInput} /></Field>
              <Field label="Port"><Input value={config.smtpPort} onChange={update('smtpPort')} className={stdInput} /></Field>
              <Field label="Username"><Input value={config.smtpUser} onChange={update('smtpUser')} className={stdInput} /></Field>
              <Field label="Password / App Password"><Input type="password" value={config.smtpPassword} onChange={update('smtpPassword')} className={stdInput} /></Field>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Credentials will be encrypted server-side (backend pending).
          </div>
        </Section>

        <Section icon={Bell} title="Notifications">
          <div className="space-y-4">
            <label className="flex items-center justify-between border border-neutral-800 bg-neutral-900 px-4 py-3">
              <div>
                <div className="text-white text-sm">Email me on every new quote</div>
                <div className="text-xs text-neutral-500">Sent to {config.notifyEmail}</div>
              </div>
              <Switch checked={config.notifyOnNewQuote} onCheckedChange={update('notifyOnNewQuote')} />
            </label>
            <label className="flex items-center justify-between border border-neutral-800 bg-neutral-900 px-4 py-3">
              <div>
                <div className="text-white text-sm">Notify on customer reply</div>
                <div className="text-xs text-neutral-500">Threaded conversation updates</div>
              </div>
              <Switch checked={config.notifyOnReply} onCheckedChange={update('notifyOnReply')} />
            </label>
          </div>
        </Section>

        <Section icon={Globe} title="Website Defaults">
          <Field label="Default Language">
            <select value={config.defaultLanguage} onChange={update('defaultLanguage')} className="w-full max-w-xs bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
              <option value="en">English (default)</option>
              <option value="nl">Nederlands</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
            </select>
          </Field>
        </Section>

        <div className="text-xs text-neutral-500 italic flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          All settings are stored locally for now (MOCKED). Backend integration in Phase 2 will persist to database and encrypt credentials. Defaults loaded from <code className="text-neutral-400">SITE_CONFIG_DEFAULTS</code> ({Object.keys(SITE_CONFIG_DEFAULTS).length} fields).
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
