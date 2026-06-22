import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useBasket } from '../context/BasketContext';
import { useLang } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Minus, Plus, Trash2, ShoppingBasket } from 'lucide-react';
import { productName } from '../hooks/useResolvedProducts';

const BasketDrawer = () => {
  const { items, updateQty, updateNotes, removeItem, drawerOpen, setDrawerOpen, count } = useBasket();
  const { t } = useLang();
  const navigate = useNavigate();

  const goToBasket = () => { setDrawerOpen(false); navigate('/basket'); };
  const goToQuote = () => { setDrawerOpen(false); navigate('/request-a-quote'); };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="bg-neutral-950 border-l border-neutral-800 text-white w-full sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-neutral-800">
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBasket className="w-5 h-5 text-orange-500" />
            {t('basket.title')} <span className="text-orange-500">({count})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800">
                <ShoppingBasket className="w-7 h-7 text-neutral-600" />
              </div>
              <p className="text-white font-semibold">{t('basket.empty')}</p>
              <p className="text-sm text-neutral-500 mt-2 max-w-[260px]">{t('basket.emptyDesc')}</p>
              <Button onClick={() => { setDrawerOpen(false); navigate('/products'); }} className="mt-6 bg-orange-500 hover:bg-orange-400 rounded-none">
                {t('btn.continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded">
                  <img src={it.image} alt={productName(it, t)} className="w-20 h-20 object-contain p-1 rounded bg-gradient-to-br from-neutral-900 to-black border border-neutral-800" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-white truncate">{productName(it, t)}</div>
                      <button onClick={() => removeItem(it.id)} aria-label="Remove" className="text-neutral-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateQty(it.id, it.qty - 1)} className="w-7 h-7 inline-flex items-center justify-center border border-neutral-800 hover:border-orange-500 hover:text-orange-500"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-8 text-center">{it.qty}</span>
                      <button onClick={() => updateQty(it.id, it.qty + 1)} className="w-7 h-7 inline-flex items-center justify-center border border-neutral-800 hover:border-orange-500 hover:text-orange-500"><Plus className="w-3 h-3" /></button>
                    </div>
                    <Input
                      value={it.notes || ''}
                      onChange={(e) => updateNotes(it.id, e.target.value)}
                      placeholder={t('basket.notes')}
                      className="mt-2 bg-neutral-950 border-neutral-800 text-xs h-8 focus-visible:ring-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-neutral-800 space-y-2 bg-neutral-950">
            <Button onClick={goToQuote} className="w-full bg-orange-500 hover:bg-orange-400 rounded-none h-11 font-semibold">{t('btn.checkout')}</Button>
            <Button onClick={goToBasket} variant="outline" className="w-full border-neutral-700 hover:bg-neutral-900 hover:text-white rounded-none bg-transparent text-white">{t('btn.viewBasket')}</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default BasketDrawer;
