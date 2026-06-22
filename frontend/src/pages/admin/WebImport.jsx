import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Globe, Loader2, CheckSquare, Square, Download, Package, FileText, Image as ImageIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const Section = ({ children, title, count, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-900 bg-neutral-950">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-2 flex items-center justify-between hover:bg-neutral-900/40">
        <span className="text-white font-semibold text-sm">{title}</span>
        <span className="text-xs text-neutral-500">{count} · {open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-neutral-900 p-3">{children}</div>}
    </div>
  );
};

const WebImport = () => {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(6);
  const [crawling, setCrawling] = useState(false);
  const [pages, setPages] = useState([]);                  // [{url,title,description,headings,text,images,links}]
  // Selections — keyed by `pageIdx:type:idx`
  const [picked, setPicked] = useState({});
  const [importing, setImporting] = useState(false);

  const crawl = async () => {
    if (!url.trim()) return;
    setCrawling(true);
    setPages([]);
    setPicked({});
    try {
      const res = await api.adminWebCrawl({ url: url.trim(), max_pages: Number(maxPages) || 6, same_domain: true });
      setPages(res.pages || []);
      toast({ title: `Crawled ${res.count} pages` });
    } catch (e) {
      toast({ title: 'Crawl failed', description: e.message });
    } finally {
      setCrawling(false);
    }
  };

  const togglePage = (idx) => setPicked((p) => ({ ...p, [`page:${idx}`]: !p[`page:${idx}`] }));
  const toggleImage = (pi, ii) => setPicked((p) => ({ ...p, [`img:${pi}:${ii}`]: !p[`img:${pi}:${ii}`] }));
  const toggleHeading = (pi, hi) => setPicked((p) => ({ ...p, [`h:${pi}:${hi}`]: !p[`h:${pi}:${hi}`] }));
  const selectAll = () => {
    const next = {};
    pages.forEach((pg, pi) => {
      next[`page:${pi}`] = true;
      (pg.images || []).forEach((_, ii) => { next[`img:${pi}:${ii}`] = true; });
      (pg.headings || []).forEach((_, hi) => { next[`h:${pi}:${hi}`] = true; });
    });
    setPicked(next);
  };
  const clearAll = () => setPicked({});

  const selectionStats = useMemo(() => {
    const keys = Object.entries(picked).filter(([, v]) => v).map(([k]) => k);
    return {
      pages: keys.filter(k => k.startsWith('page:')).length,
      images: keys.filter(k => k.startsWith('img:')).length,
      headings: keys.filter(k => k.startsWith('h:')).length,
    };
  }, [picked]);

  const importSelection = async (mode) => {
    // mode: 'product' | 'document'
    const items = [];
    pages.forEach((pg, pi) => {
      const pageOn = picked[`page:${pi}`];
      // Collect images picked for this page
      const imgs = (pg.images || []).filter((_, ii) => picked[`img:${pi}:${ii}`]);
      const heads = (pg.headings || []).filter((_, hi) => picked[`h:${pi}:${hi}`]);
      if (!pageOn && imgs.length === 0 && heads.length === 0) return;
      if (mode === 'product') {
        const name = (heads[0]?.text) || pg.title || pg.url;
        items.push({
          type: 'product',
          name,
          desc: pg.description || pg.text?.slice(0, 600) || '',
          image: imgs[0] || '',
          sourceUrl: pg.url,
          autoTranslate: true,
        });
      } else {
        const md = [
          `# ${pg.title || pg.url}`,
          pg.description ? `> ${pg.description}` : '',
          '',
          ...heads.map(h => `${'#'.repeat(Math.min(h.level + 1, 6))} ${h.text}`),
          '',
          pg.text?.slice(0, 4000) || '',
          '',
          imgs.length ? '## Images' : '',
          ...imgs.map(u => `![image](${u})`),
          '',
          `_Source: ${pg.url}_`,
        ].filter(Boolean).join('\n');
        items.push({
          type: 'document',
          title: pg.title || pg.url,
          content: md,
          sourceUrl: pg.url,
        });
      }
    });
    if (items.length === 0) {
      toast({ title: 'Nothing selected', description: 'Tick a page (or its images/headings) first.' });
      return;
    }
    setImporting(true);
    try {
      const res = await api.adminWebImport({ items });
      toast({ title: 'Imported', description: `${res.products?.length || 0} products · ${res.documents?.length || 0} documents` });
      setPicked({});
    } catch (e) {
      toast({ title: 'Import failed', description: e.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8" data-testid="admin-import">
      <Helmet><title>Web importer — Owner Panel</title></Helmet>
      <div className="mb-6">
        <div className="text-[10px] tracking-widest uppercase text-orange-500">Importer</div>
        <h1 className="text-2xl font-black text-white">Import from a website</h1>
        <p className="text-sm text-neutral-500 mt-1">Crawl any public website, then tick the pages / headings / images you want. Send the selection to products or documents — translations + slug are generated automatically.</p>
      </div>

      <div className="border border-neutral-900 bg-neutral-950 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input data-testid="import-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.competitor.com/catalog" className="bg-neutral-900 border-neutral-800 flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">Max pages</span>
            <Input type="number" min={1} max={25} value={maxPages} onChange={(e) => setMaxPages(e.target.value)} className="bg-neutral-900 border-neutral-800 w-20" />
          </div>
          <Button onClick={crawl} disabled={crawling || !url.trim()} className="bg-orange-500 hover:bg-orange-400 rounded-none" data-testid="import-crawl">
            {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Globe className="w-4 h-4 mr-2" /> Crawl</>}
          </Button>
        </div>
        {pages.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-neutral-900 pt-3">
            <div className="text-xs text-neutral-400">
              Selected: <strong className="text-orange-400">{selectionStats.pages}</strong> pages · {selectionStats.images} images · {selectionStats.headings} headings
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[10px] uppercase tracking-widest text-orange-400 hover:text-orange-300">Select all</button>
              <button onClick={clearAll} className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white">Clear</button>
              <Button onClick={() => importSelection('product')} disabled={importing} className="bg-emerald-600 hover:bg-emerald-500 rounded-none h-8 text-xs" data-testid="import-as-product">
                <Package className="w-3.5 h-3.5 mr-1.5" /> Import as products
              </Button>
              <Button onClick={() => importSelection('document')} disabled={importing} className="bg-purple-600 hover:bg-purple-500 rounded-none h-8 text-xs" data-testid="import-as-doc">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Import as documents
              </Button>
            </div>
          </div>
        )}
      </div>

      {pages.length === 0 && !crawling && (
        <div className="text-center text-neutral-500 py-16 border border-dashed border-neutral-900">
          Paste a URL above and press <span className="text-orange-400">Crawl</span> to see structured content here.
        </div>
      )}

      <div className="space-y-3">
        {pages.map((pg, pi) => (
          <Section key={pg.url || `page-${pi}`} title={pg.title || pg.url} count={`${pg.headings?.length || 0} headings · ${pg.images?.length || 0} images`}>
            <div className="flex items-center justify-between mb-3">
              <a href={pg.url} target="_blank" rel="noreferrer" className="text-xs text-neutral-400 hover:text-orange-400 inline-flex items-center gap-1"><LinkIcon className="w-3 h-3" />{pg.url}<ExternalLink className="w-3 h-3" /></a>
              <label className="inline-flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input type="checkbox" checked={!!picked[`page:${pi}`]} onChange={() => togglePage(pi)} data-testid={`import-page-${pi}`} />
                Use this page
              </label>
            </div>
            {pg.description && <div className="text-sm text-neutral-300 mb-3 italic border-l-2 border-orange-500/40 pl-3">{pg.description}</div>}
            {pg.headings?.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Headings</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {pg.headings.map((h, hi) => (
                    <label key={`${pi}-h${hi}-${h.text?.slice(0, 30)}`} className="flex items-start gap-2 text-xs text-neutral-300 cursor-pointer hover:bg-neutral-900/40 px-2 py-1">
                      <input type="checkbox" checked={!!picked[`h:${pi}:${hi}`]} onChange={() => toggleHeading(pi, hi)} data-testid={`import-h-${pi}-${hi}`} />
                      <span className="text-neutral-500 font-mono text-[10px] mt-0.5">H{h.level}</span>
                      <span>{h.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {pg.images?.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Images</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {pg.images.map((src, ii) => (
                    <label key={`${pi}-img-${src}`} className={`relative border ${picked[`img:${pi}:${ii}`] ? 'border-orange-500' : 'border-neutral-800'} bg-black aspect-square overflow-hidden cursor-pointer block`}>
                      <input type="checkbox" className="absolute top-1 left-1 z-10" checked={!!picked[`img:${pi}:${ii}`]} onChange={() => toggleImage(pi, ii)} data-testid={`import-img-${pi}-${ii}`} />
                      <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <details className="text-xs text-neutral-500">
              <summary className="cursor-pointer hover:text-white">Preview text ({Math.min(pg.text?.length || 0, 4000)} chars)</summary>
              <div className="mt-2 max-h-60 overflow-y-auto border border-neutral-900 p-2 text-neutral-400 whitespace-pre-wrap">{pg.text?.slice(0, 4000)}</div>
            </details>
          </Section>
        ))}
      </div>
    </div>
  );
};

export default WebImport;
