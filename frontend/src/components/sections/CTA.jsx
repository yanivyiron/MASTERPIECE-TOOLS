import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { Button } from '../ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';

export const CallToAction = () => {
  const { t } = useLang();
  return (
    <section className="relative bg-black py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.pexels.com/photos/8865187/pexels-photo-8865187.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">{t('section.needQuote')}</h2>
        <p className="text-neutral-300 mt-5 text-base sm:text-lg">{t('section.needQuoteDesc')}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button asChild className="bg-orange-500 hover:bg-orange-400 rounded-none h-12 px-7 text-sm font-semibold tracking-widest uppercase shadow-xl shadow-orange-500/30">
            <Link to="/request-a-quote">{t('hero.cta1')} <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
          <Button asChild variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-500 bg-transparent text-white rounded-none h-12 px-7 text-sm font-semibold tracking-widest uppercase">
            <a href="mailto:yaniv@masterpiece-innovations.com"><MessageSquare className="w-4 h-4 mr-2" />{t('btn.sendMessage')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export const TrustedClients = () => {
  const { t } = useLang();
  const logos = ['AEROSPACE CO.', 'DEFENSE SYS.', 'PRECISION MFG.', 'AERO IND.', 'CNC SOLUTIONS', 'MED DEV.', 'TECHJET', 'IND. GROUP'];
  return (
    <section className="bg-neutral-950 border-y border-neutral-900 py-14">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center text-neutral-500 text-xs tracking-[0.25em] uppercase font-semibold mb-8">{t('section.trusted')}</div>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map(l => (
            <div key={l} className="text-neutral-500 hover:text-white text-sm tracking-[0.2em] font-bold transition-colors duration-300 cursor-default">
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const MicronPrecision = () => {
  const { t } = useLang();
  const items = [
    { tk: 'section.advGeo', dk: 'section.advGeoDesc' },
    { tk: 'section.subGrades', dk: 'section.subGradesDesc' },
    { tk: 'section.premCarb', dk: 'section.premCarbDesc' },
    { tk: 'section.authQA', dk: 'section.authQADesc' }
  ];
  return (
    <section className="bg-black py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('section.micronTitle')}</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase">{t('section.micronTitle')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <div key={it.tk} className="group p-7 border border-neutral-800 hover:border-orange-500/60 bg-neutral-950 hover:bg-neutral-900/60 transition-all duration-500">
              <div className="text-orange-500 text-xs tracking-widest font-bold">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="text-white font-bold uppercase text-base mt-3">{t(it.tk)}</h3>
              <p className="text-neutral-400 mt-3 text-sm leading-relaxed">{t(it.dk)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PrecisionShowcase = () => {
  const { t } = useLang();
  return (
    <section className="relative bg-black py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800">
            <img src="https://images.pexels.com/photos/10290630/pexels-photo-10290630.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Calibration" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">Aerospace Grade</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05]">Aerospace-Grade Precision.<br/>Fully Traceable Calibration.</h2>
          <ul className="mt-8 space-y-5">
            <li className="border-l-2 border-orange-500 pl-4"><p className="text-neutral-200 font-medium">Absolute Sub-Micron Tolerances</p><p className="text-neutral-400 text-sm mt-1">for mission-critical aerospace components.</p></li>
            <li className="border-l-2 border-orange-500 pl-4"><p className="text-neutral-200 font-medium">ISO/EN compliant traceable certificates</p><p className="text-neutral-400 text-sm mt-1">suitable for aerospace and defense audits.</p></li>
            <li className="border-l-2 border-orange-500 pl-4"><p className="text-neutral-200 font-medium">Rapid European turn-around</p><p className="text-neutral-400 text-sm mt-1">ensuring zero downtime for mission-critical facilities.</p></li>
          </ul>
          <Link to="/request-a-quote" className="inline-flex items-center gap-2 mt-9 px-7 h-12 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold tracking-widest uppercase transition-colors shadow-xl shadow-orange-500/30">
            {t('hero.cta1')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
