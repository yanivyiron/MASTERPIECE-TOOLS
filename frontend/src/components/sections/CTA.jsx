import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { Button } from '../ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Marquee } from '../animations';

export const CallToAction = () => {
  const { t } = useLang();
  return (
    <section className="relative bg-black py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.pexels.com/photos/8865187/pexels-photo-8865187.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,26,0.15),transparent_60%)]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">{t('section.needQuote')}</h2>
        <p className="text-neutral-300 mt-5 text-base sm:text-lg">{t('section.needQuoteDesc')}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button asChild className="bg-orange-500 hover:bg-orange-400 rounded-none h-12 px-7 text-sm font-semibold tracking-widest uppercase shadow-xl shadow-orange-500/40">
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
  const logos = ['AEROSPACE CO.', 'DEFENSE SYS.', 'PRECISION MFG.', 'AERO IND.', 'CNC SOLUTIONS', 'MED DEVICES', 'TECHJET', 'IND. GROUP', 'EUROPEAN MFG', 'PRECISION GMBH', 'AERO OEM', 'DEFENSE INC.'];
  return (
    <section className="bg-neutral-950 border-y border-neutral-900 py-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center text-neutral-500 text-[11px] tracking-[0.3em] uppercase font-semibold mb-6">{t('section.trusted')}</div>
      </div>
      <Marquee speed={45}>
        {logos.map((l, i) => (
          <div key={`${l}-${i}`} className="shrink-0 px-6 text-neutral-600 hover:text-orange-400 text-base lg:text-lg tracking-[0.25em] font-bold transition-colors duration-300 cursor-default whitespace-nowrap inline-flex items-center gap-6">
            <span>{l}</span>
            <span className="text-orange-500/40">•</span>
          </div>
        ))}
      </Marquee>
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
            <div key={it.tk} className="group relative p-7 border border-neutral-800 hover:border-orange-500/60 bg-neutral-950 hover:bg-neutral-900/60 transition-all duration-500 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-orange-500/5 group-hover:bg-orange-500/15 blur-2xl transition-all duration-700" />
              <div className="relative">
                <div className="text-orange-500 text-xs tracking-widest font-bold">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-white font-bold uppercase text-base mt-3">{t(it.tk)}</h3>
                <p className="text-neutral-400 mt-3 text-sm leading-relaxed">{t(it.dk)}</p>
              </div>
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
    <section className="relative bg-black py-20 lg:py-28 overflow-hidden">
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.12),transparent_60%)] blur-3xl pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800 group">
            <img src="https://static.wixstatic.com/media/969172_7703292b5d0d44c3ab6943aa3a091949~mv2.png/v1/fill/w_1200,h_1500,al_c,q_90,enc_auto/Precision%20Gauge%20Closeup.png" alt="Calibration" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-orange-500" />
            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-orange-500" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-orange-500" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-orange-500" />
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">Aerospace Grade</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05]">Aerospace-Grade Precision.<br/>Fully Traceable Calibration.</h2>
          <ul className="mt-8 space-y-5">
            <li className="border-l-2 border-orange-500 pl-4 transition-transform hover:translate-x-1"><p className="text-neutral-200 font-medium">Absolute Sub-Micron Tolerances</p><p className="text-neutral-400 text-sm mt-1">for mission-critical aerospace components.</p></li>
            <li className="border-l-2 border-orange-500 pl-4 transition-transform hover:translate-x-1"><p className="text-neutral-200 font-medium">ISO/EN compliant traceable certificates</p><p className="text-neutral-400 text-sm mt-1">suitable for aerospace and defense audits.</p></li>
            <li className="border-l-2 border-orange-500 pl-4 transition-transform hover:translate-x-1"><p className="text-neutral-200 font-medium">Rapid European turn-around</p><p className="text-neutral-400 text-sm mt-1">ensuring zero downtime for mission-critical facilities.</p></li>
          </ul>
          <Link to="/request-a-quote" className="group inline-flex items-center gap-2 mt-9 px-7 h-12 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold tracking-widest uppercase transition-colors shadow-xl shadow-orange-500/30">
            {t('hero.cta1')} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};
