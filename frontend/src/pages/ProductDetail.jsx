import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PRODUCTS } from '../mock';
import { useLang } from '../context/LanguageContext';
import { useBasket } from '../context/BasketContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Plus, Minus, ShoppingBasket, BadgeCheck, ChevronLeft, Award, Truck, FileText } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { toast } from '../hooks/use-toast';

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useLang();
  const { addItem } = useBasket();
  const navigate = useNavigate();
  const product = PRODUCTS.find(p => p.slug === slug);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  if (!product) {
    return (
      <div className="bg-black min-h-screen py-32 text-center text-white">
        <h1 className="text-3xl font-bold">Product not found</h1>
        <Link to="/products" className="text-orange-500 mt-4 inline-block hover:underline">Browse all products</Link>
      </div>
    );
  }

  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
    addItem(product, qty, notes);
    setAdding(true);
    toast({ title: `${t(product.nameKey)} — ${t('btn.added')}`, description: `${qty} × ${t(product.nameKey)}` });
    setTimeout(() => setAdding(false), 1500);
  };

  const handleQuote = () => { addItem(product, qty, notes); navigate('/request-a-quote'); };

  return (
    <div className="bg-black min-h-screen">
      <Helmet>
        <title>{`${t(product.nameKey)} — Masterpiece Tools`}</title>
        <meta name="description" content={t(product.descKey)} />
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-6 pt-8">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-orange-500">
          <ChevronLeft className="w-4 h-4" /> Back to catalog
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square border border-neutral-900 bg-neutral-950 overflow-hidden">
            <img src={product.image} alt={t(product.nameKey)} className="w-full h-full object-cover" />
            {product.badge && (
              <div className="absolute top-4 left-4 px-2.5 py-1 text-[10px] tracking-[0.15em] font-semibold border border-orange-500/40 text-orange-400 bg-black/60 backdrop-blur-sm">
                <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> {product.badge.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{product.specs?.standard}</div>
          <h1 className="text-white font-black text-3xl sm:text-4xl tracking-tight uppercase">{t(product.nameKey)}</h1>
          <p className="text-neutral-300 mt-5 text-base leading-relaxed">{t(product.descKey)}</p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {Object.entries(product.specs || {}).map(([k, v]) => (
              <div key={k} className="border border-neutral-900 bg-neutral-950 p-3">
                <div className="text-[10px] tracking-widest text-neutral-500 uppercase">{k}</div>
                <div className="text-white text-sm font-medium mt-1">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="text-xs uppercase tracking-widest text-neutral-500">{t('basket.quantity')}</div>
            <div className="flex items-center">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-white"><Minus className="w-4 h-4 mx-auto" /></button>
              <div className="w-12 h-9 border-y border-neutral-800 text-white text-center leading-9">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-white"><Plus className="w-4 h-4 mx-auto" /></button>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs uppercase tracking-widest text-neutral-500">{t('basket.notes')}</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. M12x1.5 6H, GO/NOGO pair, ISO 17025 certificate required" className="mt-2 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-orange-500 min-h-[90px]" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleAdd} className={`rounded-none h-12 px-7 text-sm tracking-widest uppercase font-semibold ${adding ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-400'}`}>
              <ShoppingBasket className="w-4 h-4 mr-2" /> {adding ? t('btn.added') : t('btn.addBasket')}
            </Button>
            <Button onClick={handleQuote} variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-12 px-7 text-sm tracking-widest uppercase font-semibold">
              {t('btn.requestQuote')}
            </Button>
          </div>

          <div className="mt-8 border-t border-neutral-900 pt-6 grid grid-cols-3 gap-4">
            <div className="flex items-start gap-2"><Award className="w-4 h-4 text-orange-500 mt-0.5" /><div className="text-xs text-neutral-400"><div className="text-white font-semibold">ISO Certified</div>Traceable calibration</div></div>
            <div className="flex items-start gap-2"><Truck className="w-4 h-4 text-orange-500 mt-0.5" /><div className="text-xs text-neutral-400"><div className="text-white font-semibold">EU Logistics</div>{product.leadTime}</div></div>
            <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-orange-500 mt-0.5" /><div className="text-xs text-neutral-400"><div className="text-white font-semibold">Custom Drawing</div>RFQ in 24-48h</div></div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-white font-bold text-2xl uppercase tracking-wide">Related Products</h2>
            <Link to="/products" className="text-sm text-orange-500 hover:underline tracking-widest uppercase">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
