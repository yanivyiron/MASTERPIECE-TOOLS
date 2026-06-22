import React, { useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { CATEGORIES, PRODUCTS as BASE_PRODUCTS } from '../../mock';
import { useLang } from '../../context/LanguageContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit3, Trash2, Search, Package, Upload, FileText, ImageIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

// Promise-based file -> base64 dataURL conversion
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const emptyForm = {
  id: '',
  slug: '',
  name: '',
  desc: '',
  category: 'precision-gauges',
  subcategory: 'thread',
  image: '',
  imageDataUrl: '',
  specSheetDataUrl: '',
  specSheetName: '',
  tolerance: '', material: '', standard: '', range: '',
  leadTime: '2-4 weeks',
  badge: 'precision',
};

const AdminProducts = () => {
  const { t } = useLang();
  const { config, setProductOverride, addCustomProduct, removeCustomProduct } = useSiteConfig();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // 'NEW' | productId | null
  const [editingKind, setEditingKind] = useState(null); // 'BASE' | 'CUSTOM' | 'NEW'
  const [form, setForm] = useState(emptyForm);
  const imageFileRef = useRef(null);
  const pdfFileRef = useRef(null);

  // Compose unified list with overrides applied
  const products = useMemo(() => {
    const overrides = config.productOverrides || {};
    const baseList = BASE_PRODUCTS.map((p) => ({
      ...p,
      _kind: 'BASE',
      name: t(p.nameKey),
      desc: t(p.descKey),
      _override: overrides[p.id] || {},
      image: overrides[p.id]?.customImageDataUrl || p.image,
      specSheet: overrides[p.id]?.specSheetDataUrl || p.specSheet || '',
      hidden: overrides[p.id]?.hidden,
      tolerance: p.specs?.tolerance || '',
      material: p.specs?.material || '',
      standard: p.specs?.standard || '',
      range: p.specs?.range || '',
    }));
    const customList = (config.customProducts || []).map((p) => ({
      ...p,
      _kind: 'CUSTOM',
      tolerance: p.specs?.tolerance || '',
      material: p.specs?.material || '',
      standard: p.specs?.standard || '',
      range: p.specs?.range || '',
    }));
    return [...customList, ...baseList];
  }, [config.productOverrides, config.customProducts, t]);

  const filtered = products.filter((p) => !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.slug || '').toLowerCase().includes(search.toLowerCase()));

  const startEdit = (p) => {
    setEditing(p.id);
    setEditingKind(p._kind);
    setForm({
      id: p.id,
      slug: p.slug || '',
      name: p.name || '',
      desc: p.desc || '',
      category: p.category || 'precision-gauges',
      subcategory: p.subcategory || 'thread',
      image: p.image || '',
      imageDataUrl: p._override?.customImageDataUrl || '',
      specSheetDataUrl: p._override?.specSheetDataUrl || (typeof p.specSheet === 'string' && p.specSheet.startsWith('data:') ? p.specSheet : ''),
      specSheetName: p.specSheetName || '',
      tolerance: p.tolerance || '', material: p.material || '', standard: p.standard || '', range: p.range || '',
      leadTime: p.leadTime || '2-4 weeks',
      badge: p.badge || 'precision',
    });
  };

  const startNew = () => {
    setEditing('NEW');
    setEditingKind('NEW');
    setForm({ ...emptyForm, id: `custom-${Date.now()}` });
  };

  const handleImageUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast({ title: 'Image too large', description: 'Please keep image ≤ 4 MB' }); return; }
    const url = await fileToDataUrl(f);
    setForm((p) => ({ ...p, imageDataUrl: url }));
    toast({ title: 'Image uploaded', description: f.name });
  };

  const handlePdfUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast({ title: 'PDF too large', description: 'Please keep PDF ≤ 8 MB' }); return; }
    if (!f.type.includes('pdf')) { toast({ title: 'Invalid file', description: 'Please upload a PDF file' }); return; }
    const url = await fileToDataUrl(f);
    setForm((p) => ({ ...p, specSheetDataUrl: url, specSheetName: f.name }));
    toast({ title: 'PDF uploaded', description: f.name });
  };

  const save = () => {
    if (!form.name || !form.slug) { toast({ title: 'Missing fields', description: 'Name and slug are required' }); return; }

    if (editingKind === 'NEW') {
      addCustomProduct({
        id: form.id,
        slug: form.slug,
        name: form.name,
        desc: form.desc,
        category: form.category,
        subcategory: form.subcategory,
        image: form.imageDataUrl || form.image || 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
        specSheet: form.specSheetDataUrl || '',
        specSheetName: form.specSheetName || '',
        specs: { tolerance: form.tolerance, material: form.material, standard: form.standard, range: form.range },
        features: [],
        leadTime: form.leadTime,
        badge: form.badge,
      });
      toast({ title: 'Product created', description: form.name });
    } else if (editingKind === 'BASE') {
      // Apply override on a base product
      setProductOverride(editing, {
        customImageDataUrl: form.imageDataUrl || undefined,
        specSheetDataUrl: form.specSheetDataUrl || undefined,
      });
      toast({ title: 'Product override saved', description: form.name });
    } else if (editingKind === 'CUSTOM') {
      // Remove + re-add (simple)
      removeCustomProduct(editing);
      addCustomProduct({
        id: editing,
        slug: form.slug,
        name: form.name,
        desc: form.desc,
        category: form.category,
        subcategory: form.subcategory,
        image: form.imageDataUrl || form.image || 'https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
        specSheet: form.specSheetDataUrl || '',
        specSheetName: form.specSheetName || '',
        specs: { tolerance: form.tolerance, material: form.material, standard: form.standard, range: form.range },
        features: [],
        leadTime: form.leadTime,
        badge: form.badge,
      });
      toast({ title: 'Product updated', description: form.name });
    }
    setEditing(null);
    setEditingKind(null);
    setForm(emptyForm);
  };

  const remove = (p) => {
    if (p._kind === 'CUSTOM') {
      if (!window.confirm(`Delete "${p.name}"?`)) return;
      removeCustomProduct(p.id);
      toast({ title: 'Product removed' });
    } else {
      // Base products can't be deleted, only hidden
      setProductOverride(p.id, { hidden: true });
      toast({ title: 'Product hidden from catalog' });
    }
  };

  const toggleVisible = (p) => {
    if (p._kind === 'BASE') {
      setProductOverride(p.id, { hidden: !p.hidden });
      toast({ title: p.hidden ? 'Product visible' : 'Product hidden' });
    }
  };

  const stdInput = 'mt-2 bg-neutral-900 border-neutral-800 text-white';

  return (
    <div className="p-6 sm:p-8" data-testid="admin-products">
      <Helmet><title>Products — Owner Panel</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">{t('admin.products')}</h1>
          <p className="text-neutral-500 text-sm mt-1">Add new products with images & PDFs, edit existing catalog, hide items globally.</p>
        </div>
        <Button onClick={startNew} data-testid="admin-products-new" className="bg-orange-500 hover:bg-orange-400 rounded-none h-10"><Plus className="w-4 h-4 mr-2" /> New Product</Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-72 focus-visible:ring-orange-500" />
        </div>
        <div className="text-xs text-neutral-500">{filtered.length} of {products.length}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className={`border ${p.hidden ? 'border-neutral-900 opacity-50' : 'border-neutral-800'} bg-neutral-950 overflow-hidden`} data-testid={`admin-product-${p.id}`}>
            <div className="aspect-video bg-neutral-900 relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              {p._kind === 'CUSTOM' && <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] tracking-widest px-2 py-0.5">CUSTOM</div>}
              {p.specSheet && <div className="absolute top-2 right-2 bg-orange-500/90 text-white text-[10px] tracking-widest px-2 py-0.5 inline-flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</div>}
            </div>
            <div className="p-4">
              <div className="text-[10px] tracking-widest text-orange-500 uppercase">{p.category}</div>
              <div className="text-white font-bold mt-1 truncate">{p.name}</div>
              <div className="text-xs text-neutral-500 mt-1 truncate">{p.standard || '—'}</div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs" data-testid={`admin-product-edit-${p.id}`}><Edit3 className="w-3 h-3 mr-1" /> Edit</Button>
                {p._kind === 'BASE' && (
                  <Button size="sm" variant="outline" onClick={() => toggleVisible(p)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs">
                    {p.hidden ? <><Eye className="w-3 h-3 mr-1" /> Show</> : <><EyeOff className="w-3 h-3 mr-1" /> Hide</>}
                  </Button>
                )}
                {p._kind === 'CUSTOM' && (
                  <Button size="sm" variant="outline" onClick={() => remove(p)} className="border-neutral-700 hover:border-red-500 hover:text-red-500 bg-transparent text-white rounded-none h-8 text-xs"><Trash2 className="w-3 h-3" /></Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && (setEditing(null), setEditingKind(null))}>
        <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-orange-500" />{editingKind === 'NEW' ? 'New Product' : editingKind === 'BASE' ? 'Override Base Product' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="sm:col-span-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={stdInput} disabled={editingKind === 'BASE'} data-testid="admin-product-name" />
              {editingKind === 'BASE' && <p className="text-[10px] text-neutral-500 mt-1">Base product names are translated. Override image and PDF only.</p>}
            </div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={stdInput} disabled={editingKind === 'BASE'} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3" disabled={editingKind === 'BASE'}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            </div>

            {/* Image upload */}
            <div className="sm:col-span-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">Product Image</Label>
              <div className="mt-2 flex items-start gap-3">
                {(form.imageDataUrl || form.image) && (
                  <img src={form.imageDataUrl || form.image} alt="" className="w-24 h-24 object-contain bg-neutral-900 border border-neutral-800 p-1" />
                )}
                <div className="flex-1">
                  <input ref={imageFileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="admin-product-image-input" />
                  <Button type="button" variant="outline" onClick={() => imageFileRef.current?.click()} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-9 text-xs">
                    <ImageIcon className="w-4 h-4 mr-2" /> {form.imageDataUrl ? 'Replace image' : 'Upload image'}
                  </Button>
                  <p className="text-[10px] text-neutral-500 mt-2">JPG/PNG/WebP up to 4 MB. Or paste a URL below.</p>
                  <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…/image.png" className="mt-2 bg-neutral-900 border-neutral-800 text-white h-9 text-xs" />
                </div>
              </div>
            </div>

            {/* PDF upload */}
            <div className="sm:col-span-2">
              <Label className="text-neutral-400 text-xs uppercase tracking-widest">Technical Spec PDF</Label>
              <div className="mt-2 flex items-start gap-3">
                <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-500" />
                  <span className="text-[10px] text-neutral-500 mt-1">{form.specSheetDataUrl ? 'Uploaded' : 'No PDF'}</span>
                </div>
                <div className="flex-1">
                  <input ref={pdfFileRef} type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} className="hidden" data-testid="admin-product-pdf-input" />
                  <Button type="button" variant="outline" onClick={() => pdfFileRef.current?.click()} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-9 text-xs" data-testid="admin-product-pdf-btn">
                    <Upload className="w-4 h-4 mr-2" /> {form.specSheetDataUrl ? 'Replace PDF' : 'Upload PDF'}
                  </Button>
                  {form.specSheetName && <p className="text-[10px] text-neutral-400 mt-2 truncate">{form.specSheetName}</p>}
                  <p className="text-[10px] text-neutral-500 mt-1">PDF up to 8 MB. Stored in browser today; backed-up to server in Phase 2.</p>
                  {form.specSheetDataUrl && (
                    <button type="button" onClick={() => setForm({ ...form, specSheetDataUrl: '', specSheetName: '' })} className="text-[10px] text-red-400 mt-1 hover:underline">Remove PDF</button>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2"><Label className="text-neutral-400 text-xs uppercase tracking-widest">Description</Label><Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} disabled={editingKind === 'BASE'} className="mt-2 bg-neutral-900 border-neutral-800 text-white min-h-[80px]" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Tolerance</Label><Input value={form.tolerance} onChange={(e) => setForm({ ...form, tolerance: e.target.value })} disabled={editingKind === 'BASE'} className={stdInput} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} disabled={editingKind === 'BASE'} className={stdInput} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Standard</Label><Input value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} disabled={editingKind === 'BASE'} className={stdInput} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Range</Label><Input value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value })} disabled={editingKind === 'BASE'} className={stdInput} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Lead Time</Label><Input value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} disabled={editingKind === 'BASE'} className={stdInput} /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Badge</Label>
              <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="mt-2 w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3" disabled={editingKind === 'BASE'}>
                {['aerospace', 'iso', 'precision', 'carbide'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => { setEditing(null); setEditingKind(null); }} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none">Cancel</Button>
            <Button onClick={save} data-testid="admin-product-save" className="bg-orange-500 hover:bg-orange-400 rounded-none">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
