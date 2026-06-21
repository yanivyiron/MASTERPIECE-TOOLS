import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { ArrowRight, BadgeCheck, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

const Hero = () => {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-50 scale-105 animate-[heroZoom_18s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,107,26,0.12),transparent_55%)]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 pt-20 sm:pt-28 lg:pt-32 pb-28 lg:pb-40 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-orange-500/40 bg-orange-500/5 text-orange-400 text-xs tracking-[0.18em] uppercase mb-7 backdrop-blur-sm">
            <BadgeCheck className="w-3.5 h-3.5" />
            {t('hero.badge')}
          </div>
          <h1 className="text-white font-black tracking-tight leading-[0.95] text-[44px] sm:text-[64px] lg:text-[88px]">
            <span className="block opacity-95">{t('hero.title1')}</span>
            <span className="block">
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{t('hero.title2')}</span>
                <span className="absolute -bottom-2 left-0 h-[6px] w-full bg-orange-500/25 blur-sm" />
              </span>
            </span>
          </h1>
          <p className="mt-7 text-neutral-300 text-base sm:text-lg max-w-xl leading-relaxed">{t('hero.subtitle')}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild className="bg-orange-500 hover:bg-orange-400 text-white rounded-none h-12 px-7 text-sm font-semibold tracking-widest uppercase shadow-xl shadow-orange-500/30">
              <Link to="/request-a-quote">
                {t('hero.cta1')} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-12 px-7 text-sm font-semibold tracking-widest uppercase">
              <Link to="/products">{t('hero.cta2')}</Link>
            </Button>
          </div>

          <div className="mt-14 flex items-center gap-8 text-xs uppercase tracking-widest text-neutral-500">
            <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">15+</span><span>Years</span></div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">±0.001</span><span>mm</span></div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">24-48h</span><span>RFQ</span></div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800 bg-neutral-900">
            <img
              src="https://images.pexels.com/photos/10290630/pexels-photo-10290630.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="Precision Gauge"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-[11px] tracking-[0.2em] text-orange-400 uppercase font-semibold">Featured</div>
              <div className="mt-1 text-white font-bold text-xl">Aerospace-Grade Precision</div>
              <div className="text-neutral-300 text-sm mt-1">ISO 1502 — Sub-micron tolerance</div>
            </div>
          </div>
        </div>
      </div>

      <a href="#features" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-500 hover:text-orange-500 animate-bounce" aria-label="Scroll">
        <ChevronDown className="w-6 h-6" />
      </a>

      <style>{`@keyframes heroZoom { from { transform: scale(1.05); } to { transform: scale(1.12); } }`}</style>
    </section>
  );
};

export default Hero;
