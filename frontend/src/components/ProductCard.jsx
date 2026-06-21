import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useBasket } from '../context/BasketContext';
import { Plus, ArrowUpRight, BadgeCheck } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

const BADGE_MAP = {
  aerospace: { label: 'AEROSPACE', color: 'text-orange-400 border-orange-500/40' },
  iso: { label: 'ISO/EN', color: 'text-emerald-400 border-emerald-500/40' },
  precision: { label: 'PRECISION', color: 'text-sky-400 border-sky-500/40' },
  carbide: { label: 'CARBIDE', color: 'text-amber-400 border-amber-500/40' }
};

const ProductCard = ({ product, variant = 'default' }) => {
  const { t } = useLang();
  const { addItem } = useBasket();
  const [adding, setAdding] = React.useState(false);
  const badge = product.badge ? BADGE_MAP[product.badge] : null;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAdding(true);
    toast({ title: `${t(product.nameKey)} — ${t('btn.added')}`, description: t('btn.viewBasket') });
    setTimeout(() => setAdding(false), 1400);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative block bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
        <img
          src={product.image}
          alt={t(product.nameKey)}
          loading="lazy"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.06] transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {badge && (
          <div className={`absolute top-3 left-3 px-2 py-1 text-[10px] tracking-[0.15em] font-semibold border ${badge.color} bg-black/60 backdrop-blur-sm`}>
            <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> {badge.label}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-white font-bold tracking-wide text-base sm:text-lg uppercase leading-tight">{t(product.nameKey)}</h3>
              <div className="mt-1 text-[11px] text-neutral-300/80 tracking-wider uppercase">{product.specs?.standard || t('sub.thread')}</div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300" />
          </div>
        </div>
      </div>

      {variant !== 'compact' && (
        <div className="p-4 border-t border-neutral-900 flex items-center justify-between gap-2">
          <div className="text-[11px] text-neutral-500 tracking-wider">{product.leadTime || ''}</div>
          <Button
            type="button"
            onClick={handleAdd}
            size="sm"
            className={`rounded-none h-8 px-3 text-[11px] tracking-widest font-semibold transition-colors ${
              adding ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-400'
            } text-white`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> {adding ? t('btn.added') : t('btn.addBasket')}
          </Button>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
