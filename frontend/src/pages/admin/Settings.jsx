import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Mail, ShieldCheck, Save, Bell, Globe, Building2, MessageCircle, Linkedin, RotateCcw, ImageIcon, MapPin, Search, Check, Trash2, ExternalLink } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { useSiteConfig, SITE_CONFIG_DEFAULTS } from '../../context/SiteConfigContext';
import { ALL_COUNTRIES } from '../../data/countries';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <Label className="text-neutral-400 text-[11px] uppercase tracking-widest">{label}</Label>
    <div className="mt-2">{children}</div>
  </div>
);

const Section = ({ icon: Icon, title, hint, children, testId }) => (
  <div className="border border-neutral-800 bg-neutral-950 p-6" data-testid={testId}>
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
  const logoFileRef = useRef(null);
  const ogFileRef = useRef(null);
  const [countryQuery, setCountryQuery] = useState('');

  const update = (k) => (v) => updateConfig({ [k]: typeof v === 'object' && v?.target ? v.target.value : v });

  const handleLogoUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast({ title: 'Logo too large', description: 'Please keep logo ≤ 2 MB (PNG/SVG/WebP)' }); return; }
    const url = await fileToDataUrl(f);
    updateConfig({ logoImageDataUrl: url });
    toast({ title: 'Logo uploaded', description: f.name });
  };

  const handleOgUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast({ title: 'Image too large', description: 'Please keep ≤ 4 MB' }); return; }
    const url = await fileToDataUrl(f);
    updateConfig({ ogImageUrl: url });
    toast({ title: 'OG image uploaded', description: f.name });
  };

  const toggleCountry = (code) => {
    const list = config.allowedCountries || [];
    const next = list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
    updateConfig({ allowedCountries: next });
  };

  const allowAllCountries = () => updateConfig({ allowedCountries: [] });
  const selectOnlyCountries = (codes) => updateConfig({ allowedCountries: codes });

  const save = () => toast({ title: 'Settings saved', description: 'All site-wide changes are live across every page.' });
  const reset = () => {
    if (window.confirm('Reset all site settings to defaults? Your logo, products and overrides will be cleared.')) {
      resetConfig();
      toast({ title: 'Settings reset', description: 'Defaults restored.' });
    }
  };

  const stdInput = 'bg-neutral-900 border-neutral-800 text-white focus-visible:ring-orange-500';
  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase()) || c.code.toLowerCase().includes(countryQuery.toLowerCase())
  );
  const allowedSet = new Set(config.allowedCountries || []);

  return (
    <div className="p-6 sm:p-8 max-w-5xl" data-testid="admin-settings">
      <Helmet><title>Settings — Owner Panel</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Site Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Edit content, brand, contact, social links, email, SEO, countries, and domain — visible site-wide.</p>
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
        {/* BRAND / LOGO */}
        <Section icon={ImageIcon} title="Brand & Logo" hint="Logo appears in header, footer, and OG previews." testId="settings-brand">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Logo Text (used if no image)">
              <Input value={config.logoText} onChange={update('logoText')} className={stdInput} data-testid="settings-logo-text" />
            </Field>
            <Field label="Brand Tagline">
              <Input value={config.companyTagline} onChange={update('companyTagline')} className={stdInput} />
            </Field>
            <div className="md:col-span-2">
              <Label className="text-neutral-400 text-[11px] uppercase tracking-widest">Logo Image (PNG/SVG/WebP — recommended 240×60 px)</Label>
              <div className="mt-2 flex items-start gap-4">
                <div className="w-40 h-20 bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2">
                  {config.logoImageDataUrl ? (
                    <img src={config.logoImageDataUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-neutral-500">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <input ref={logoFileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" data-testid="settings-logo-input" />
                  <Button type="button" variant="outline" onClick={() => logoFileRef.current?.click()} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-9 text-xs" data-testid="settings-logo-upload">
                    <ImageIcon className="w-4 h-4 mr-2" /> {config.logoImageDataUrl ? 'Replace logo' : 'Upload logo'}
                  </Button>
                  {config.logoImageDataUrl && (
                    <button type="button" onClick={() => updateConfig({ logoImageDataUrl: '' })} className="ml-3 text-[11px] text-red-400 hover:underline" data-testid="settings-logo-remove">Remove logo</button>
                  )}
                  <p className="text-[10px] text-neutral-500 mt-2">Tip: transparent PNG or SVG works best on the dark header.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* COMPANY INFO */}
        <Section icon={Building2} title="Company Information" hint="Shown in footer, header bar, emails, and structured data." testId="settings-company">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" className="md:col-span-2">
              <Input value={config.companyName} onChange={update('companyName')} className={stdInput} data-testid="settings-company-name" />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={config.companyAddress} onChange={update('companyAddress')} className={stdInput} data-testid="settings-address" />
            </Field>
            <Field label="Phone"><Input value={config.contactPhone} onChange={update('contactPhone')} className={stdInput} data-testid="settings-phone" /></Field>
            <Field label="Public Contact Email"><Input value={config.contactEmail} onChange={update('contactEmail')} className={stdInput} data-testid="settings-email" /></Field>
            <Field label="Default RFQ Response Time"><Input value={config.rfqResponseTime} onChange={update('rfqResponseTime')} className={stdInput} placeholder="e.g. 24-48h" /></Field>
            <Field label="Certifications Tagline"><Input value={config.certifications} onChange={update('certifications')} className={stdInput} /></Field>
          </div>
        </Section>

        {/* WHATSAPP */}
        <Section icon={MessageCircle} title="WhatsApp Floating Button" hint="Chat bubble in the bottom-right corner of every page." testId="settings-whatsapp">
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

        {/* SOCIAL */}
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

        {/* SEO */}
        <Section icon={Search} title="SEO & OG Preview" hint="Used for search engines and link previews." testId="settings-seo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="SEO Title" className="md:col-span-2">
              <Input value={config.seoTitle} onChange={update('seoTitle')} className={stdInput} data-testid="settings-seo-title" />
            </Field>
            <Field label="SEO Description (155–160 chars)" className="md:col-span-2">
              <Textarea value={config.seoDescription} onChange={update('seoDescription')} className="mt-2 bg-neutral-900 border-neutral-800 text-white min-h-[80px]" data-testid="settings-seo-desc" />
              <div className="text-[10px] text-neutral-500 mt-1">{(config.seoDescription || '').length} characters</div>
            </Field>
            <div className="md:col-span-2">
              <Label className="text-neutral-400 text-[11px] uppercase tracking-widest">Open Graph image (1200×630 recommended)</Label>
              <div className="mt-2 flex items-start gap-4">
                <div className="w-40 h-20 bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2">
                  {config.ogImageUrl ? <img src={config.ogImageUrl} alt="OG" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-neutral-500">No image</span>}
                </div>
                <div className="flex-1">
                  <input ref={ogFileRef} type="file" accept="image/*" onChange={handleOgUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => ogFileRef.current?.click()} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-9 text-xs">
                    <ImageIcon className="w-4 h-4 mr-2" /> {config.ogImageUrl ? 'Replace' : 'Upload OG image'}
                  </Button>
                  <p className="text-[10px] text-neutral-500 mt-2">JPG/PNG up to 4 MB. Will be used as default Open Graph preview.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* DOMAIN */}
        <Section icon={Globe} title="Domain & Hosting" hint="Connect your custom domain (e.g. masterpiece-tools.com). Done at the hosting layer; this just records the canonical URL." testId="settings-domain">
          <Field label="Primary Domain" className="max-w-md">
            <Input value={config.primaryDomain} onChange={update('primaryDomain')} className={stdInput} placeholder="www.masterpiece-tools.com" data-testid="settings-primary-domain" />
          </Field>
          <div className="mt-5 border border-orange-500/30 bg-orange-500/5 p-4">
            <div className="text-orange-300 text-xs tracking-widest uppercase font-bold mb-2 inline-flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> How to connect a custom domain
            </div>
            <ol className="text-xs text-neutral-300 space-y-1 list-decimal list-inside">
              <li>From your hosting dashboard, open <strong>Domains → Add custom domain</strong>.</li>
              <li>Enter <code className="text-orange-400">{config.primaryDomain || 'www.your-domain.com'}</code>.</li>
              <li>At your DNS provider (e.g. GoDaddy, Cloudflare, Hover), add a <strong>CNAME</strong> record pointing your sub-domain to the hosting target shown in the dashboard, OR an <strong>A</strong> record for the apex.</li>
              <li>Wait for DNS propagation (5–30 minutes). HTTPS is provisioned automatically.</li>
              <li>Update the "Website URL (canonical)" field above so SEO + structured data point to your domain.</li>
            </ol>
          </div>
        </Section>

        {/* COUNTRIES */}
        <Section icon={MapPin} title="Allowed Countries for RFQ" hint="Restrict which countries appear in the Request-a-Quote country picker. Empty = allow ALL." testId="settings-countries">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-xs text-neutral-400" data-testid="settings-countries-count">
              {(config.allowedCountries || []).length === 0
                ? <>Currently allowing <span className="text-orange-500 font-bold">ALL {ALL_COUNTRIES.length}</span> countries.</>
                : <>Allowing <span className="text-orange-500 font-bold">{config.allowedCountries.length}</span> of {ALL_COUNTRIES.length} countries.</>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={allowAllCountries} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs" data-testid="settings-countries-all">Allow all</Button>
              <Button size="sm" variant="outline" onClick={() => selectOnlyCountries(['NL', 'DE', 'FR', 'BE', 'LU', 'GB', 'IT', 'ES', 'PT', 'IE', 'DK', 'SE', 'FI', 'NO', 'AT', 'CH', 'PL', 'CZ', 'HU'])} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs" data-testid="settings-countries-eu">EU/UK only</Button>
              <Button size="sm" variant="outline" onClick={() => selectOnlyCountries([])} className="border-neutral-700 hover:border-red-500 hover:text-red-500 bg-transparent text-white rounded-none h-8 text-xs">Clear</Button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="Search countries" className="pl-9 bg-neutral-900 border-neutral-800 text-white h-9" data-testid="settings-countries-search" />
          </div>
          <div className="max-h-64 overflow-y-auto border border-neutral-800 bg-neutral-900 p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
              {filteredCountries.map((c) => {
                const checked = allowedSet.size === 0 || allowedSet.has(c.code);
                const explicit = allowedSet.has(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.code)}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs border ${explicit ? 'border-orange-500 bg-orange-500/10 text-white' : checked ? 'border-neutral-800 text-neutral-300' : 'border-neutral-900 text-neutral-600'} hover:border-orange-500/60 transition-colors`}
                    data-testid={`settings-country-${c.code}`}
                  >
                    <span className="truncate">{c.name}</span>
                    {explicit && <Check className="w-3.5 h-3.5 text-orange-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* EMAIL PROVIDER */}
        <Section icon={Mail} title="Email Provider" hint="Used in Phase 2 backend to send RFQ notifications. Credentials are encrypted server-side." testId="settings-email">
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
            <Field label="Owner Notification Email"><Input value={config.notifyEmail} onChange={update('notifyEmail')} className={stdInput} data-testid="settings-notify-email" /></Field>
          </div>
          {config.emailProvider === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-900">
              <Field label="SMTP Host"><Input value={config.smtpHost} onChange={update('smtpHost')} className={stdInput} /></Field>
              <Field label="Port"><Input value={config.smtpPort} onChange={update('smtpPort')} className={stdInput} /></Field>
              <Field label="Username"><Input value={config.smtpUser} onChange={update('smtpUser')} className={stdInput} /></Field>
              <Field label="Password / App Password"><Input type="password" value={config.smtpPassword} onChange={update('smtpPassword')} className={stdInput} /></Field>
            </div>
          )}
        </Section>

        {/* NOTIFICATIONS */}
        <Section icon={Bell} title="Notifications" testId="settings-notifications">
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

        {/* DEFAULTS */}
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
          All settings persist in browser storage (MOCKED). Phase 2 backend will sync to database and encrypt SMTP credentials. {Object.keys(SITE_CONFIG_DEFAULTS).length} configurable fields available.
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
