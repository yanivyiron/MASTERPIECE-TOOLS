import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CATEGORIES, PRODUCTS, SUBCATEGORIES } from '../mock';
import ProductCard from '../components/ProductCard';
import { useLang } from '../context/LanguageContext';
import { ProcessSection } from '../components/sections/Pillars';
import { CallToAction } from '../components/sections/CTA';

const CategoryPage = () => {
  const { slug } = useParams();
  const { t } = useLang();
  const cat = CATEGORIES.find(c => c.slug === slug);
  if (!cat) return <div className="bg-black min-h-screen text-white py-32 text-center">Category not found</div>;
  const items = PRODUCTS.filter(p => p.category === cat.id);
  const subs = SUBCATEGORIES.filter(s => s.parent === cat.id);

  return (
    <div className="bg-black min-h-screen">
      <Helmet><title>{`${t(cat.nameKey)} — Masterpiece Tools`}</title></Helmet>

      <div className="relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={cat.image} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 py-24 lg:py-32">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">Category</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight uppercase leading-[1]">{t(cat.nameKey)}</h1>
          <p className="text-neutral-300 mt-5 max-w-2xl text-base lg:text-lg leading-relaxed">{t(cat.descKey)}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {subs.map(s => (
              <span key={s.id} className="px-3 py-1.5 text-xs uppercase tracking-widest border border-neutral-800 text-neutral-300">{t(s.nameKey)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>

      <ProcessSection />
      <CallToAction />
    </div>
  );
};

export default CategoryPage;
