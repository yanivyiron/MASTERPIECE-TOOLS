import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Mail, ShieldCheck, Save, Bell, Globe, Building2, MessageCircle, Linkedin, RotateCcw, ImageIcon, MapPin, Search, Check, ExternalLink, KeyRound, SendHorizontal, Loader2, CloudCheck, CloudOff, BarChart3, Database, AlertTriangle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { useSiteConfig, SITE_CONFIG_DEFAULTS } from '../../context/SiteConfigContext';
import { useAuth } from '../../context/AuthContext';
import { ALL_COUNTRIES } from '../../data/countries';
import { SMTP_PRESETS } from '../../data/smtpPresets';
import { api } from '../../lib/api';

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
  const { config, updateConfig, resetConfig, saveToServer, serverSynced, hydrating } = useSiteConfig();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const logoFileRef = useRef(null);
  const ogFileRef = useRef(null);
  const [countryQuery, setCountryQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

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

  const save = async () => {
    setSaving(true);
    try {
      await saveToServer();
      toast({ title: 'Settings saved', description: 'Changes live across every device.' });
    } catch (e) {
      toast({ title: 'Save failed', description: e?.message || 'Backend unreachable. Settings remain in browser cache.' });
    } finally {
      setSaving(false);
    }
  };
  const reset = () => {
    if (window.confirm('Reset all site settings to defaults? Your logo, products and overrides will be cleared.')) {
      resetConfig();
      toast({ title: 'Settings reset', description: 'Defaults restored. Press Save to push to server.' });
    }
  };

  const runEmailTest = async () => {
    const to = (testEmail || config.notifyEmail || '').trim();
    if (!to) { toast({ title: 'Pick a recipient', description: 'Enter an email to receive the test message.' }); return; }
    setTestingEmail(true);
    try {
      // Make sure latest SMTP creds are on the server before testing
      await saveToServer();
      const res = await api.adminEmailTest(to);
      if (res.ok && res.mode === 'smtp') {
        toast({ title: 'Test email sent ✓', description: `Delivered to ${to}.` });
      } else if (res.mode === 'mock') {
        toast({ title: 'SMTP not configured', description: 'Fill in host/user/password above, save, and try again.' });
      } else {
        toast({ title: 'Test failed', description: res.error || 'Check your SMTP credentials.' });
      }
    } catch (e) {
      toast({ title: 'Test failed', description: e?.message || 'Network error' });
    } finally {
      setTestingEmail(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) { toast({ title: 'Fill all fields' }); return; }
    if (pwForm.next.length < 8) { toast({ title: 'Password too short', description: 'At least 8 characters.' }); return; }
    if (pwForm.next !== pwForm.confirm) { toast({ title: 'Passwords do not match' }); return; }
    setSavingPw(true);
    try {
      await api.adminChangePassword(pwForm.current, pwForm.next);
      toast({ title: 'Password changed ✓', description: 'Use the new password next time you sign in.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      toast({ title: 'Could not change password', description: e?.message || 'Please try again' });
    } finally {
      setSavingPw(false);
    }
  };

  // SMTP preset picker — auto-fills host/port/tls
  const [openPreset, setOpenPreset] = useState(null); // id of expanded preset card
  const applyPreset = (preset) => {
    updateConfig({
      smtpHost: preset.host || config.smtpHost,
      smtpPort: preset.port || config.smtpPort,
      smtpUseTls: preset.useTls || 'true',
    });
    setOpenPreset(preset.id);
    toast({ title: `${preset.name} preset applied`, description: 'Now enter your username + password below and press Save.' });
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
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase">
            {hydrating ? (
              <span className="text-neutral-500 inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Syncing…</span>
            ) : serverSynced ? (
              <span className="text-emerald-400 inline-flex items-center gap-1.5"><CloudCheck className="w-3.5 h-3.5" /> Synced with server</span>
            ) : (
              <span className="text-amber-400 inline-flex items-center gap-1.5"><CloudOff className="w-3.5 h-3.5" /> Local-only — press Save to push</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={reset} variant="outline" className="border-neutral-700 hover:border-orange-500 text-neutral-200 hover:text-orange-500 bg-transparent rounded-none h-10" data-testid="settings-reset-btn">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10 disabled:opacity-60" data-testid="settings-save-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving…' : 'Save'}
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
        <Section icon={Mail} title="Email Provider" hint="Pick a free SMTP provider below — each has a built-in tutorial. Credentials are encrypted server-side." testId="settings-email">
          {!isOwner && (
            <div className="text-[11px] text-amber-300 border border-amber-500/30 bg-amber-500/5 px-3 py-2 mb-3" data-testid="settings-owner-only-banner">
              <strong>Owner-only.</strong> SMTP credentials, the RFQ notification address, KVK/VAT legal IDs and the custom &lt;head&gt; HTML block can only be edited by the site owner. Anything you change here will revert when you save.
            </div>
          )}
          {/* Free SMTP provider picker */}
          <div className="mb-6">
            <Label className="text-neutral-400 text-[11px] uppercase tracking-widest">Quick setup — pick a free provider</Label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SMTP_PRESETS.map((p) => {
                const active = config.smtpHost === p.host && p.host;
                const open = openPreset === p.id;
                return (
                  <div key={p.id} className={`border ${active ? 'border-orange-500 bg-orange-500/5' : 'border-neutral-800 bg-neutral-900'} transition-colors`}>
                    <button
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full text-left p-3 hover:bg-neutral-800/60 transition-colors"
                      data-testid={`smtp-preset-${p.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-white font-bold text-sm">{p.name}</div>
                        {p.tag && <span className={`text-[9px] tracking-widest px-1.5 py-0.5 border ${active ? 'border-orange-500 text-orange-400' : 'border-neutral-700 text-neutral-400'}`}>{p.tag}</span>}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1.5">{p.free}</div>
                      <div className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{p.bestFor}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenPreset(open ? null : p.id)}
                      className="w-full text-[10px] tracking-widest uppercase text-orange-500 hover:text-orange-400 border-t border-neutral-800 py-1.5"
                      data-testid={`smtp-preset-tutorial-${p.id}`}
                    >
                      {open ? '↑ Hide tutorial' : '↓ Show tutorial'}
                    </button>
                    {open && (
                      <div className="border-t border-neutral-800 p-3 bg-black/50">
                        <div className="text-[10px] tracking-widest text-orange-500 uppercase mb-2 inline-flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> ~{p.setupMinutes} min setup
                        </div>
                        <ol className="text-[11px] text-neutral-300 space-y-1.5 list-decimal list-inside leading-snug">
                          {p.steps.map((s) => <li key={s}>{s}</li>)}
                        </ol>
                        {(p.signupUrl || p.docUrl) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.signupUrl && (
                              <a href={p.signupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-2 py-1 transition-colors">
                                <ExternalLink className="w-3 h-3" /> Sign up
                              </a>
                            )}
                            {p.docUrl && (
                              <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase border border-neutral-700 text-neutral-300 hover:border-orange-500 hover:text-orange-400 px-2 py-1 transition-colors">
                                <ExternalLink className="w-3 h-3" /> Docs
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Provider type">
              <select value={config.emailProvider} onChange={update('emailProvider')} className="w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid (uses SMTP)</option>
                <option value="resend">Resend (uses SMTP)</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </Field>
            <Field label="From Name"><Input value={config.fromName} onChange={update('fromName')} className={stdInput} /></Field>
            <Field label="From Email"><Input value={config.fromEmail} onChange={update('fromEmail')} className={stdInput} /></Field>
            <Field label="Owner Notification Email"><Input value={config.notifyEmail} onChange={update('notifyEmail')} className={stdInput} data-testid="settings-notify-email" /></Field>
          </div>
          {config.emailProvider === 'smtp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-900">
              <Field label="SMTP Host"><Input value={config.smtpHost} onChange={update('smtpHost')} placeholder="smtp.gmail.com" className={stdInput} data-testid="settings-smtp-host" /></Field>
              <Field label="Port"><Input value={config.smtpPort} onChange={update('smtpPort')} placeholder="587" className={stdInput} /></Field>
              <Field label="Username"><Input value={config.smtpUser} onChange={update('smtpUser')} placeholder="you@gmail.com" className={stdInput} data-testid="settings-smtp-user" /></Field>
              <Field label="Password / App Password">
                <Input
                  type="password"
                  value={config.smtpPassword}
                  onChange={update('smtpPassword')}
                  placeholder={serverSynced ? '(stored — leave empty to keep)' : 'xxxx xxxx xxxx xxxx'}
                  className={stdInput}
                  data-testid="settings-smtp-password"
                />
                <p className="text-[10px] text-neutral-500 mt-1">For Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">create an App Password</a> (requires 2-Step Verification).</p>
              </Field>
            </div>
          )}
          {/* Send test email */}
          <div className="mt-5 pt-5 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-end gap-3">
            <Field label="Send a test email to" className="flex-1">
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder={config.notifyEmail} className={stdInput} data-testid="settings-test-email-to" />
            </Field>
            <Button onClick={runEmailTest} disabled={testingEmail} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10 px-5 disabled:opacity-60" data-testid="settings-test-email-btn">
              {testingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SendHorizontal className="w-4 h-4 mr-2" />}
              {testingEmail ? 'Sending…' : 'Send test'}
            </Button>
          </div>
          <p className="text-[11px] text-neutral-500 mt-3 inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Password is encrypted at rest on the server and never exposed via the public API.</p>
        </Section>

        {/* CHANGE PASSWORD */}
        <Section icon={KeyRound} title="Owner Account" hint="Change your sign-in password from here. Used for /admin/login + OTP flow." testId="settings-account">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Current Password">
              <Input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className={stdInput} data-testid="settings-pw-current" />
            </Field>
            <Field label="New Password (≥ 8 chars)">
              <Input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className={stdInput} data-testid="settings-pw-new" />
            </Field>
            <Field label="Confirm New Password">
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className={stdInput} data-testid="settings-pw-confirm" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={changePassword} disabled={savingPw} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10 disabled:opacity-60" data-testid="settings-pw-save">
              {savingPw ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              {savingPw ? 'Saving…' : 'Change password'}
            </Button>
            <span className="text-[11px] text-neutral-500">Password is stored as a bcrypt hash on the server.</span>
          </div>
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

        {/* ANALYTICS / PIXELS */}
        <Section icon={BarChart3} title="Analytics & Tracking Pixels" hint="IDs are injected into the public site <head> only (never on /admin). Leave blank to disable a tracker." testId="settings-analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Google Analytics 4 — Measurement ID">
              <Input value={config.analyticsGa4Id || ''} onChange={update('analyticsGa4Id')} placeholder="G-XXXXXXXXXX" className={stdInput} data-testid="settings-ga4-id" />
              <p className="text-[10px] text-neutral-500 mt-1">Find it at analytics.google.com → Admin → Data Streams.</p>
            </Field>
            <Field label="Google Tag Manager — Container ID">
              <Input value={config.analyticsGtmId || ''} onChange={update('analyticsGtmId')} placeholder="GTM-XXXXXXX" className={stdInput} data-testid="settings-gtm-id" />
              <p className="text-[10px] text-neutral-500 mt-1">Loads all of your GTM tags in one go.</p>
            </Field>
            <Field label="Meta / Facebook Pixel ID">
              <Input value={config.analyticsMetaPixelId || ''} onChange={update('analyticsMetaPixelId')} placeholder="123456789012345" className={stdInput} data-testid="settings-meta-pixel-id" />
              <p className="text-[10px] text-neutral-500 mt-1">Find it at business.facebook.com → Events Manager.</p>
            </Field>
            <Field label="LinkedIn Insight — Partner ID">
              <Input value={config.analyticsLinkedInPartnerId || ''} onChange={update('analyticsLinkedInPartnerId')} placeholder="1234567" className={stdInput} data-testid="settings-li-partner-id" />
              <p className="text-[10px] text-neutral-500 mt-1">Find it at LinkedIn Campaign Manager → Account assets → Insight tag.</p>
            </Field>
            <Field label="Custom <head> HTML (Hotjar, Clarity, custom pixels…)" className="md:col-span-2">
              <Textarea value={config.analyticsCustomHead || ''} onChange={update('analyticsCustomHead')} placeholder="<script>/* your code here */</script>" className="mt-2 bg-neutral-900 border-neutral-800 text-white min-h-[120px] font-mono text-xs" data-testid="settings-analytics-custom-head" />
              <p className="text-[10px] text-neutral-500 mt-1">Pasted as-is into the public <code className="text-orange-400">&lt;head&gt;</code>. Only the site owner can edit this — handle carefully.</p>
            </Field>
          </div>
        </Section>

        {/* DANGER ZONE — DB WIPE */}
        <Section icon={Database} title="Data Maintenance" hint="One-shot maintenance actions. Use with care — destructive operations are not reversible." testId="settings-maintenance">
          <div className="border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-white font-bold text-sm mb-1">Wipe test data</div>
                <p className="text-xs text-neutral-400 mb-3">
                  Permanently deletes <strong>all quotes</strong>, <strong>customer overrides</strong>, <strong>AI conversation threads</strong>, and <strong>email history</strong>.
                  Keeps your settings, products, categories, templates, team, AI actions and visual-editor overrides.
                </p>
                <Button
                  onClick={async () => {
                    if (!window.confirm('Permanently delete ALL quotes, customers and AI conversations? This cannot be undone.')) return;
                    try {
                      const res = await api.adminWipeTestData();
                      const d = res?.deleted || {};
                      toast({ title: 'Test data wiped ✓', description: `Quotes: ${d.quotes || 0}, customers: ${d.customers || 0}, AI: ${d.ai_conversations || 0}, emails: ${d.email_history || 0}` });
                    } catch (e) {
                      toast({ title: 'Wipe failed', description: e?.message || 'Owner-only action' });
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 rounded-none h-9 text-xs"
                  data-testid="settings-wipe-btn"
                >
                  <Database className="w-3.5 h-3.5 mr-2" /> Wipe test data
                </Button>
              </div>
            </div>
          </div>
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
