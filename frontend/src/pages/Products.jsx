import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResolvedProducts, productName } from '../hooks/useResolvedProducts';
import { CATEGORIES } from '../mock';
import { useLang } from '../context/LanguageContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import ProductCard from '../components/ProductCard';
import { Input } from '../components/ui/input';
import SEO from '../components/SEO';
import { SlidersHorizontal, Search } from 'lucide-react';

const Products = () => {
  const { t } = useLang();
  const { config } = useSiteConfig();
  const products = useResolvedProducts();
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (subcategory !== 'all' && p.subcategory !== subcategory) return false;
      if (q) {
        const name = productName(p, t).toLowerCase();
        if (!name.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [products, category, subcategory, q, t]);

  const activeCategory = CATEGORIES.find((c) => c.slug === category);
  const seoTitle = `${t('pp.catalog')} — ${config.companyName}`;

  return (
    <div className="bg-black min-h-screen">
      <SEO title={seoTitle} description={t('pp.catalogDesc')} path="/products" />

      <div className="border-b border-neutral-900">
        <div className="max-w-[1400px] mx-auto px-6 py-14 lg:py-20">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('pp.catalog')}</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase">{t('hero.title2')}</h1>
          <p className="text-neutral-400 mt-4 max-w-2xl text-base sm:text-lg">{t('pp.catalogDesc')}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="border border-neutral-800 bg-neutral-950 p-5 sticky top-[100px]">
            <div className="flex items-center gap-2 text-white font-bold tracking-wide uppercase mb-5">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" /> {t('pp.filters')}
            </div>
            <div className="relative mb-5">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pp.search')} className="pl-9 bg-neutral-900 border-neutral-800 text-white h-10" data-testid="products-search" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{t('pp.filters')}</div>
              <button onClick={() => { setCategory('all'); setSubcategory('all'); }} className={`block w-full text-left text-sm py-1.5 ${category === 'all' ? 'text-orange-500' : 'text-neutral-300 hover:text-white'}`}>{t('pp.all')}</button>
              {CATEGORIES.map((c) => (
                <div key={c.slug}>
                  <button onClick={() => { setCategory(c.slug); setSubcategory('all'); }} className={`block w-full text-left text-sm py-1.5 ${category === c.slug ? 'text-orange-500' : 'text-neutral-300 hover:text-white'}`}>{t(c.nameKey)}</button>
                  {category === c.slug && c.subcategories && (
                    <div className="ml-3 pl-3 border-l border-neutral-800 mt-1 mb-2">
                      <button onClick={() => setSubcategory('all')} className={`block w-full text-left text-xs py-1 ${subcategory === 'all' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}>{t('pp.allTypes')}</button>
                      {c.subcategories.map((s) => (
                        <button key={s.slug} onClick={() => setSubcategory(s.slug)} className={`block w-full text-left text-xs py-1 ${subcategory === s.slug ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}>{t(s.nameKey)}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-neutral-400">
              {filtered.length === 1 ? `1 ${t('pp.productFound')}` : `${filtered.length} ${t('pp.productsFound')}`}
            </div>
            {activeCategory && (
              <div className="text-xs text-orange-500 uppercase tracking-widest">{t(activeCategory.nameKey)}</div>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="border border-neutral-800 bg-neutral-950 p-10 text-center text-neutral-400">{t('pp.noResults')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
