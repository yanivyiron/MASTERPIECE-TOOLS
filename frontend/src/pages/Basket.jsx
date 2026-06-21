import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBasket } from '../context/BasketContext';
import { useLang } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, Plus, Minus, ShoppingBasket, ArrowRight, ChevronLeft } from 'lucide-react';

const Basket = () => {
  const { t } = useLang();
  const { items, count, updateQty, updateNotes, removeItem, clear } = useBasket();
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen">
      <Helmet><title>{`${t('basket.title')} — Masterpiece Tools`}</title></Helmet>

      <div className="max-w-[1400px] mx-auto px-6 pt-8">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-orange-500">
          <ChevronLeft className="w-4 h-4" /> {t('btn.continueShopping')}
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <h1 className="text-white font-black text-3xl sm:text-4xl uppercase tracking-tight">{t('basket.title')} <span className="text-orange-500">({count})</span></h1>

        {items.length === 0 ? (
          <div className="mt-10 border border-neutral-900 bg-neutral-950 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4 border border-neutral-800">
              <ShoppingBasket className="w-7 h-7 text-neutral-600" />
            </div>
            <p className="text-white font-semibold text-lg">{t('basket.empty')}</p>
            <p className="text-neutral-500 mt-2">{t('basket.emptyDesc')}</p>
            <Button onClick={() => navigate('/products')} className="mt-6 bg-orange-500 hover:bg-orange-400 rounded-none h-11 px-6">{t('btn.continueShopping')}</Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-3">
              {items.map(it => (
                <div key={it.id} className="flex gap-4 p-4 border border-neutral-900 bg-neutral-950">
                  <img src={it.image} alt={t(it.nameKey)} className="w-24 h-24 sm:w-28 sm:h-28 object-contain p-2 bg-gradient-to-br from-neutral-900 to-black border border-neutral-800" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/product/${it.slug}`} className="text-white font-bold uppercase tracking-wide hover:text-orange-500">{t(it.nameKey)}</Link>
                      <button onClick={() => removeItem(it.id)} aria-label="Remove" className="text-neutral-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <Input value={it.notes || ''} onChange={(e) => updateNotes(it.id, e.target.value)} placeholder={t('basket.notes')} className="mt-2 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 text-sm h-9 focus-visible:ring-orange-500" />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-neutral-500">{t('basket.quantity')}</span>
                      <button onClick={() => updateQty(it.id, it.qty - 1)} className="w-8 h-8 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-white"><Minus className="w-3 h-3 mx-auto" /></button>
                      <div className="w-10 h-8 border-y border-neutral-800 text-white text-center text-sm leading-8">{it.qty}</div>
                      <button onClick={() => updateQty(it.id, it.qty + 1)} className="w-8 h-8 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-white"><Plus className="w-3 h-3 mx-auto" /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clear} className="text-xs text-neutral-500 hover:text-red-400 mt-3 underline-offset-4 hover:underline">Clear basket</button>
            </div>

            <div className="lg:col-span-4">
              <div className="border border-neutral-800 bg-neutral-950 p-6 sticky top-[100px]">
                <div className="text-white font-bold tracking-wide uppercase mb-4">Quote Summary</div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between text-neutral-300"><span>Items</span><span>{count}</span></div>
                  <div className="flex justify-between text-neutral-300"><span>Unique products</span><span>{items.length}</span></div>
                  <div className="flex justify-between text-neutral-300"><span>Pricing</span><span className="text-orange-500 font-semibold">On RFQ</span></div>
                </div>
                <Button onClick={() => navigate('/request-a-quote')} className="mt-6 w-full bg-orange-500 hover:bg-orange-400 rounded-none h-12 font-semibold tracking-widest uppercase">{t('btn.checkout')} <ArrowRight className="w-4 h-4 ml-2" /></Button>
                <p className="mt-4 text-xs text-neutral-500 leading-relaxed">Pricing & lead-time are provided per RFQ. Our engineering team will respond within 24-48 hours.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Basket;
