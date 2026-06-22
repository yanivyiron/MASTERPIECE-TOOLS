import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Edit3, Loader2, RotateCcw, Save, ExternalLink, Search } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { useSiteConfig } from '../../context/SiteConfigContext';

/**
 * Site Content editor — replaces the old in-page Wix-style floating editor.
 * Lists every editable text block on the public site, grouped by section.
 * Each entry: current value (overridable) + Reset to default.
 */
const SECTIONS = [
  {
    id: 'home.hero',
    title: 'Homepage — Hero',
    page: '/',
    fields: [
      { k: 'home.hero.badge',          label: 'Eyebrow / badge',        type: 'text',     placeholder: 'AEROSPACE-GRADE PRECISION' },
      { k: 'home.hero.title',          label: 'Main title (single line)',type: 'text' },
      { k: 'home.hero.title1',         label: 'Title — line 1',          type: 'text' },
      { k: 'home.hero.title2',         label: 'Title — line 2',          type: 'text' },
      { k: 'home.hero.subtitle',       label: 'Subtitle / lead paragraph', type: 'multiline' },
      { k: 'home.hero.cta1',           label: 'Primary CTA label',       type: 'text' },
      { k: 'home.hero.cta2',           label: 'Secondary CTA label',     type: 'text' },
      { k: 'home.hero.featured',       label: 'Featured pill label',     type: 'text' },
      { k: 'home.hero.featuredTitle',  label: 'Featured card title',     type: 'text' },
      { k: 'home.hero.featuredSub',    label: 'Featured card subtitle',  type: 'text' },
    ],
  },
  {
    id: 'home.micron',
    title: 'Homepage — Micron Precision band',
    page: '/',
    fields: [
      { k: 'home.micron.eyebrow', label: 'Eyebrow',  type: 'text' },
      { k: 'home.micron.title',   label: 'Headline', type: 'text' },
    ],
  },
  {
    id: 'home.showcase',
    title: 'Homepage — Precision Showcase',
    page: '/',
    fields: [
      { k: 'home.showcase.eyebrow', label: 'Eyebrow',     type: 'text' },
      { k: 'home.showcase.title1',  label: 'Title line 1', type: 'text' },
      { k: 'home.showcase.title2',  label: 'Title line 2', type: 'text' },
    ],
  },
  {
    id: 'home.cta',
    title: 'Homepage — Call-to-action band',
    page: '/',
    fields: [
      { k: 'home.cta.title', label: 'Title',       type: 'text' },
      { k: 'home.cta.desc',  label: 'Description', type: 'multiline' },
    ],
  },
  {
    id: 'legal.imprint',
    title: 'Legal — Imprint overrides',
    page: '/legal/imprint',
    fields: [
      { k: 'legal.imprint.kvk',         label: 'KVK / Chamber of Commerce nr.', type: 'text' },
      { k: 'legal.imprint.vat',         label: 'VAT / BTW number',              type: 'text' },
      { k: 'legal.imprint.responsible', label: 'Responsible person',            type: 'text' },
    ],
  },
];

const SiteContentEditor = () => {
  const { config, setOverride, resetOverride, hydrating } = useSiteConfig();
  const [drafts, setDrafts] = useState({});       // {key: value}
  const [savingKey, setSavingKey] = useState(null);
  const [query, setQuery] = useState('');

  const overrides = config.site_overrides || {};

  // Seed drafts from existing overrides whenever config hydrates
  useEffect(() => {
    setDrafts((d) => ({ ...overrides, ...d }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrating]);

  const visibleSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, fields: s.fields.filter((f) => f.k.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)) }))
      .filter((s) => s.fields.length > 0);
  }, [query]);

  const valueFor = (k) => (drafts[k] !== undefined ? drafts[k] : (overrides[k] ?? ''));
  const isDirty = (k) => (drafts[k] !== undefined) && (drafts[k] !== (overrides[k] ?? ''));
  const hasOverride = (k) => overrides[k] !== undefined && overrides[k] !== null && overrides[k] !== '';

  const onSave = async (k) => {
    setSavingKey(k);
    const res = await setOverride(k, drafts[k] ?? '');
    setSavingKey(null);
    if (res?.ok) {
      toast({ title: 'Saved ✓', description: k });
      // Drop the local draft so the value falls back to context override
      setDrafts((d) => { const next = { ...d }; delete next[k]; return next; });
    } else {
      toast({ title: 'Save failed', description: res?.error || 'Network error' });
    }
  };

  const onReset = async (k) => {
    setSavingKey(k);
    const res = await resetOverride(k);
    setSavingKey(null);
    if (res?.ok) {
      toast({ title: 'Reset to default', description: k });
      setDrafts((d) => { const next = { ...d }; delete next[k]; return next; });
    } else {
      toast({ title: 'Reset failed', description: res?.error || 'Network error' });
    }
  };

  return (
    <div className="p-8 max-w-5xl" data-testid="admin-site-content">
      <Helmet><title>Site content — Owner Panel</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-orange-500">Wix-style editing</div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight inline-flex items-center gap-2"><Edit3 className="w-6 h-6 text-orange-500" /> Site content</h1>
          <p className="text-neutral-500 text-sm mt-1">Edit every headline, sub-heading and CTA on the public site. Changes go live immediately across all visitors.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter fields…" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-64 focus-visible:ring-orange-500" data-testid="content-search" />
        </div>
      </div>

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <div key={section.id} className="border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-3">
              <div>
                <div className="text-white font-bold text-sm">{section.title}</div>
                <div className="text-[10px] tracking-widest uppercase text-neutral-500">{section.fields.length} field{section.fields.length === 1 ? '' : 's'}</div>
              </div>
              <a href={section.page} target="_blank" rel="noreferrer" className="text-[10px] tracking-widest uppercase text-orange-500 hover:text-orange-400 inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Preview {section.page}
              </a>
            </div>
            <div className="divide-y divide-neutral-900">
              {section.fields.map((f) => {
                const dirty = isDirty(f.k);
                const overridden = hasOverride(f.k);
                return (
                  <div key={f.k} className="px-5 py-4 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-start">
                    <div>
                      <div className="text-white text-sm font-medium">{f.label}</div>
                      <div className="text-[10px] text-neutral-500 font-mono break-all">{f.k}</div>
                      {overridden && <div className="mt-1 inline-flex items-center text-[9px] tracking-widest uppercase text-orange-400 border border-orange-500/30 px-1.5 py-0.5">Custom value</div>}
                    </div>
                    <div>
                      {f.type === 'multiline' ? (
                        <Textarea
                          value={valueFor(f.k)}
                          onChange={(e) => setDrafts((d) => ({ ...d, [f.k]: e.target.value }))}
                          placeholder={f.placeholder || '(uses default from the page)'}
                          className="bg-neutral-900 border-neutral-800 text-white min-h-[80px]"
                          data-testid={`content-input-${f.k}`}
                        />
                      ) : (
                        <Input
                          value={valueFor(f.k)}
                          onChange={(e) => setDrafts((d) => ({ ...d, [f.k]: e.target.value }))}
                          placeholder={f.placeholder || '(uses default from the page)'}
                          className="bg-neutral-900 border-neutral-800 text-white"
                          data-testid={`content-input-${f.k}`}
                        />
                      )}
                    </div>
                    <div className="flex md:flex-col gap-2 md:w-28">
                      <Button
                        size="sm"
                        onClick={() => onSave(f.k)}
                        disabled={!dirty || savingKey === f.k}
                        className="bg-orange-500 hover:bg-orange-400 rounded-none h-8 text-xs disabled:opacity-40 w-full"
                        data-testid={`content-save-${f.k}`}
                      >
                        {savingKey === f.k ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Save</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReset(f.k)}
                        disabled={!overridden || savingKey === f.k}
                        className="rounded-none bg-transparent border-neutral-800 text-amber-300 hover:border-amber-400 h-8 text-xs disabled:opacity-40 w-full"
                        data-testid={`content-reset-${f.k}`}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteContentEditor;
