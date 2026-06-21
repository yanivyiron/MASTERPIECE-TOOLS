import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { PRODUCTS, CATEGORIES, SUBCATEGORIES } from '../mock';
import ProductCard from '../components/ProductCard';
import { useLang } from '../context/LanguageContext';
import { Input } from '../components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';

const Products = () => {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSub, setActiveSub] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (activeSub !== 'all' && p.subcategory !== activeSub) return false;
      if (search && !t(p.nameKey).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, activeSub, search, t]);

  const visibleSubs = activeCategory === 'all' ? SUBCATEGORIES : SUBCATEGORIES.filter(s => s.parent === activeCategory);

  return (
    <div className="bg-black min-h-screen">
      <Helmet><title>All Products — Masterpiece Tools</title></Helmet>

      {/* Page header */}
      <div className="relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.unsplash.com/photo-1711418235334-8895331a6cf9?crop=entropy&cs=srgb&fm=jpg&w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 py-20">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('nav.products')}</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase">Technical Catalog</h1>
          <p className="text-neutral-300 mt-4 max-w-2xl">Explore precision gauges, custom cutting tools and metrology solutions — engineered for aerospace, defense and advanced manufacturing.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-[72px] z-40 bg-black/95 backdrop-blur-md border-b border-neutral-900">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setActiveCategory('all'); setActiveSub('all'); }} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-colors ${activeCategory === 'all' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'}`}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setActiveCategory(c.id); setActiveSub('all'); }} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-colors ${activeCategory === c.id ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'}`}>{t(c.nameKey)}</button>
            ))}
          </div>
          <div className="hidden lg:block w-px h-6 bg-neutral-800" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveSub('all')} className={`px-2.5 py-1 text-[11px] uppercase tracking-widest border transition-colors ${activeSub === 'all' ? 'border-orange-500 text-orange-500' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>All Types</button>
            {visibleSubs.map(s => (
              <button key={s.id} onClick={() => setActiveSub(s.id)} className={`px-2.5 py-1 text-[11px] uppercase tracking-widest border transition-colors ${activeSub === s.id ? 'border-orange-500 text-orange-500' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>{t(s.nameKey)}</button>
            ))}
          </div>
          <div className="flex-1 lg:max-w-xs lg:ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 h-10 focus-visible:ring-orange-500" />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-sm text-neutral-500 mb-6">{filtered.length} {filtered.length === 1 ? 'product' : 'products'} found</div>
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">No products match these filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
