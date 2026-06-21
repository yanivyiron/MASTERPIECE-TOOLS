import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PRODUCTS, CATEGORIES } from '../../mock';
import { useLang } from '../../context/LanguageContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit3, Trash2, Search, Package } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const empty = { id: '', slug: '', nameKey: '', name: '', category: 'precision-gauges', subcategory: 'thread', image: '', description: '', tolerance: '', material: '', standard: '', range: '', leadTime: '2-4 weeks', badge: 'precision' };

const AdminProducts = () => {
  const { t } = useLang();
  const [products, setProducts] = useState(PRODUCTS.map(p => ({
    ...p,
    name: t(p.nameKey),
    description: t(p.descKey),
    tolerance: p.specs?.tolerance || '',
    material: p.specs?.material || '',
    standard: p.specs?.standard || '',
    range: p.specs?.range || ''
  })));
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (p) => { setEditing(p.id); setForm(p); };
  const startNew = () => { setEditing('NEW'); setForm({ ...empty, id: 'p' + (products.length + 1) }); };

  const save = () => {
    if (!form.name || !form.slug) { toast({ title: 'Missing fields', description: 'Name and slug are required' }); return; }
    if (editing === 'NEW') {
      setProducts(prev => [{ ...form, nameKey: form.slug, descKey: form.slug + '-desc' }, ...prev]);
      toast({ title: 'Product created', description: form.name });
    } else {
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p));
      toast({ title: 'Product updated', description: form.name });
    }
    setEditing(null);
    setForm(empty);
  };

  const remove = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Product removed' });
  };

  return (
    <div className="p-8">
      <Helmet><title>Products — Owner Panel</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight">{t('admin.products')}</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your catalog — add, edit, remove SKUs.</p>
        </div>
        <Button onClick={startNew} className="bg-orange-500 hover:bg-orange-400 rounded-none h-10"><Plus className="w-4 h-4 mr-2" /> New Product</Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9 bg-neutral-950 border-neutral-800 text-white h-9 w-72 focus-visible:ring-orange-500" />
        </div>
        <div className="text-xs text-neutral-500">{filtered.length} of {products.length}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="border border-neutral-800 bg-neutral-950 overflow-hidden">
            <div className="aspect-video bg-neutral-900">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="text-[10px] tracking-widest text-orange-500 uppercase">{p.category}</div>
              <div className="text-white font-bold mt-1 truncate">{p.name}</div>
              <div className="text-xs text-neutral-500 mt-1">{p.standard || '—'}</div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-8 text-xs"><Edit3 className="w-3 h-3 mr-1" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="border-neutral-700 hover:border-red-500 hover:text-red-500 bg-transparent text-white rounded-none h-8 text-xs"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-orange-500" /> {editing === 'NEW' ? 'New Product' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="sm:col-span-2"><Label className="text-neutral-400 text-xs uppercase tracking-widest">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Label className="text-neutral-400 text-xs uppercase tracking-widest">Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div className="sm:col-span-2"><Label className="text-neutral-400 text-xs uppercase tracking-widest">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white min-h-[80px]" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Tolerance</Label><Input value={form.tolerance} onChange={(e) => setForm({ ...form, tolerance: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Standard</Label><Input value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Range</Label><Input value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Lead Time</Label><Input value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} className="mt-2 bg-neutral-900 border-neutral-800 text-white" /></div>
            <div><Label className="text-neutral-400 text-xs uppercase tracking-widest">Badge</Label>
              <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="mt-2 w-full bg-neutral-900 border border-neutral-800 text-white h-10 px-3">
                {['aerospace', 'iso', 'precision', 'carbide'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditing(null)} className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none">Cancel</Button>
            <Button onClick={save} className="bg-orange-500 hover:bg-orange-400 rounded-none">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
