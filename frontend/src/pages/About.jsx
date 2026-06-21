import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../context/LanguageContext';
import { CallToAction } from '../components/sections/CTA';
import { ProcessSection, IndustriesSection } from '../components/sections/Pillars';
import Features from '../components/sections/Features';

const About = () => {
  const { t } = useLang();
  return (
    <div className="bg-black min-h-screen">
      <Helmet><title>{`${t('about.title')} — Masterpiece Tools`}</title></Helmet>

      <div className="relative border-b border-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1711418235334-8895331a6cf9?crop=entropy&cs=srgb&fm=jpg&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 py-24 lg:py-32">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('nav.about')}</div>
          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight uppercase leading-[1]">{t('about.title')}</h1>
          <p className="text-neutral-300 mt-5 max-w-2xl text-lg lg:text-xl leading-relaxed">{t('about.lead')}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6 text-neutral-300 leading-relaxed text-base">
          <p>{t('about.body1')}</p>
          <p>{t('about.body2')}</p>

          {/* Company details card */}
          <div className="mt-8 border border-neutral-800 bg-neutral-950 p-6 space-y-3">
            <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-bold">Company Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Legal Entity</div>
                <div className="text-white mt-1">Masterpiece Innovations B.V.</div>
              </div>
              <div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Headquarters</div>
                <div className="text-white mt-1">Van Heuven Goedhartlaan<br/>1181 LE Amstelveen, Netherlands</div>
              </div>
              <div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Phone</div>
                <a href="tel:+31625363610" className="text-white hover:text-orange-500 mt-1 inline-block">+31 6 25363610</a>
              </div>
              <div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Email</div>
                <a href="mailto:yaniv@masterpiece-innovations.com" className="text-white hover:text-orange-500 mt-1 inline-block break-all">yaniv@masterpiece-innovations.com</a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[{ k: '15+', v: 'Years' }, { k: '±0.001', v: 'mm Tolerance' }, { k: '500+', v: 'B2B Clients' }, { k: '24-48h', v: 'RFQ Response' }].map((m) => (
              <div key={m.v} className="border border-neutral-800 p-4 text-center">
                <div className="text-orange-500 text-2xl sm:text-3xl font-black">{m.k}</div>
                <div className="text-neutral-400 text-xs uppercase tracking-widest mt-1">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] border border-neutral-800 overflow-hidden">
            <img src="https://images.pexels.com/photos/8865187/pexels-photo-8865187.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <Features />
      <ProcessSection />
      <IndustriesSection />
      <CallToAction />
    </div>
  );
};

export default About;
