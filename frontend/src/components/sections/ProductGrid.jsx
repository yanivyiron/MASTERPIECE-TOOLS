import React from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../../mock';
import ProductCard from '../ProductCard';
import { useLang } from '../../context/LanguageContext';
import { ArrowRight } from 'lucide-react';

const ProductGrid = ({ limit, category, showHeading = true, title, kicker, variant = 'default' }) => {
  const { t } = useLang();
  const list = (category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS).slice(0, limit || PRODUCTS.length);

  return (
    <section className="relative bg-black py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        {showHeading && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              {kicker && <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{kicker}</div>}
              <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">{title || t('section.precisionGauges')}</h2>
            </div>
            <Link to="/products" className="group inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-orange-500 uppercase tracking-widest font-semibold">
              {t('nav.products')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {list.map(p => <ProductCard key={p.id} product={p} variant={variant} />)}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
