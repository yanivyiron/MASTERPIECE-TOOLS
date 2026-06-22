import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useBasket } from '../context/BasketContext';
import { Plus, ArrowUpRight, BadgeCheck, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { Tilt3D, SpotlightCard } from './animations';
import { productName, productDesc } from '../hooks/useResolvedProducts';

const BADGE_MAP = {
  aerospace: { label: 'AEROSPACE', color: 'text-orange-300 border-orange-500/50 bg-orange-500/10' },
  iso: { label: 'ISO/EN', color: 'text-emerald-300 border-emerald-500/50 bg-emerald-500/10' },
  precision: { label: 'PRECISION', color: 'text-sky-300 border-sky-500/50 bg-sky-500/10' },
  carbide: { label: 'CARBIDE', color: 'text-amber-300 border-amber-500/50 bg-amber-500/10' }
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
    toast({ title: `${productName(product, t)} — ${t('btn.added')}`, description: t('btn.viewBasket') });
    setTimeout(() => setAdding(false), 1400);
  };

  return (
    <Tilt3D max={5} className="h-full">
      <Link
        to={`/product/${product.slug}`}
        className="group relative block h-full bg-neutral-950 border border-neutral-900 hover:border-orange-500/60 transition-all duration-500 overflow-hidden"
      >
        <SpotlightCard className="h-full" size={300}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/0 group-hover:via-orange-500 to-transparent transition-all duration-700" />

          {/* Product image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
            {/* Animated radial light behind product */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,107,26,0.2),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img
              src={product.image}
              alt={productName(product, t)}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain p-6 transition-all duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2 drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
              onError={(e) => { e.currentTarget.style.opacity = '0.4'; }}
            />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Top badge */}
            {badge && (
              <div className={`absolute top-3 left-3 px-2 py-1 text-[10px] tracking-[0.15em] font-bold border ${badge.color} backdrop-blur-sm`}>
                <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> {badge.label}</span>
              </div>
            )}

            {/* Hover arrow */}
            <div className="absolute top-3 right-3 w-9 h-9 border border-orange-500/0 group-hover:border-orange-500/60 group-hover:bg-orange-500/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <ArrowUpRight className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          {/* Info section */}
          <div className="relative p-4 border-t border-neutral-900 bg-gradient-to-b from-neutral-950 to-black">
            <div className="text-[10px] tracking-[0.2em] uppercase text-orange-500/80 font-semibold">{product.specs?.standard?.split(' /')[0] || 'PRECISION GAUGE'}</div>
            <h3 className="text-white font-bold tracking-wide text-base uppercase mt-1 leading-tight line-clamp-2">{productName(product, t)}</h3>
            <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">{productDesc(product, t)}</p>

            {variant !== 'compact' && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-[10px] text-neutral-500 tracking-wider inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {product.leadTime || t('pp.inStock')}
                </div>
                <Button
                  type="button"
                  onClick={handleAdd}
                  size="sm"
                  className={`rounded-none h-8 px-3 text-[11px] tracking-widest font-bold transition-all duration-300 ${
                    adding ? 'bg-emerald-600 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-orange-500 hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/40'
                  } text-white shadow-md`}
                >
                  {adding ? <><Check className="w-3.5 h-3.5 mr-1" /> {t('btn.added')}</> : <><Plus className="w-3.5 h-3.5 mr-1" /> {t('btn.addBasket')}</>}
                </Button>
              </div>
            )}
          </div>
        </SpotlightCard>
      </Link>
    </Tilt3D>
  );
};

export default ProductCard;
