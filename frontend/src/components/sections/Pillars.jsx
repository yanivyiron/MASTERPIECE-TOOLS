import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { PROCESS_STEPS, INDUSTRIES } from '../../mock';
import { Plane, Shield, Stethoscope, Cpu, Car, Factory, ArrowRight } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const IND_ICONS = { Plane, Shield, Stethoscope, Cpu, Car, Factory };

const StepCard = ({ s, i, t }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${i * 80}ms` }}
      className={`group relative p-5 border border-neutral-800 hover:border-orange-500/50 bg-neutral-950 hover:bg-neutral-900/70 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="text-[42px] font-black text-neutral-800 group-hover:text-orange-500/80 leading-none transition-colors">{s.num}</div>
      <div className="mt-3 text-white font-bold text-sm uppercase tracking-wide">{t(s.titleKey)}</div>
      <div className="mt-1 text-xs text-neutral-500 leading-relaxed">{t(s.descKey)}</div>
    </div>
  );
};

export const ProcessSection = () => {
  const { t } = useLang();
  return (
    <section className="bg-neutral-950 py-20 lg:py-28 border-y border-neutral-900">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('section.process')}</div>
            <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05]">{t('section.fromConcept')}<br/>{t('section.toVerification')}</h2>
          </div>
          <div className="text-neutral-400 text-sm max-w-md">{t('section.processDesc')}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PROCESS_STEPS.map((s, i) => <StepCard key={s.num} s={s} i={i} t={t} />)}
        </div>
      </div>
    </section>
  );
};

export const IndustriesSection = () => {
  const { t } = useLang();
  return (
    <section className="bg-black py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('section.industries')}</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight">{t('section.industries')}</h2>
          <p className="text-neutral-400 mt-4">{t('section.industriesDesc')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {INDUSTRIES.map((i) => {
            const Icon = IND_ICONS[i.icon];
            return (
              <div key={i.nameKey} className="group border border-neutral-800 hover:border-orange-500/60 bg-neutral-950 hover:bg-neutral-900/60 p-6 flex flex-col items-center text-center transition-all duration-300">
                {Icon && <Icon className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />}
                <div className="mt-4 text-white text-sm font-semibold tracking-wide uppercase">{t(i.nameKey)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const StrategicSection = () => {
  const { t } = useLang();
  const blocks = [
    { k: '01', tk: 'section.indFocus', t1: 'section.aeroCNC', d: 'section.aeroCNCDesc' },
    { k: '02', tk: 'section.qualStd', t1: 'section.micronAcc', d: 'section.micronAccDesc' },
    { k: '03', tk: 'section.logTitle', t1: 'section.relEU', d: 'section.relEUDesc' },
    { k: '04', tk: 'section.qualified', t1: 'pillar.certified', d: 'pillar.certifiedDesc' }
  ];
  return (
    <section className="relative bg-neutral-950 border-y border-neutral-900 py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-25">
        <img src="https://images.pexels.com/photos/8956445/pexels-photo-8956445.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('section.rfqGateway')}</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-[1.05]">{t('section.strategic')}</h2>
          <p className="text-neutral-300 mt-5 max-w-xl text-base leading-relaxed">{t('section.rfqGatewayDesc')}</p>
          <Link to="/request-a-quote" className="inline-flex items-center gap-2 mt-8 px-7 h-12 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold tracking-widest uppercase transition-colors shadow-xl shadow-orange-500/30">
            {t('section.uploadRFQ')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-4">
            {blocks.map((b) => (
              <div key={b.k} className="p-5 bg-black/70 border border-neutral-800 hover:border-orange-500/50 transition-colors">
                <div className="text-orange-500 text-xs tracking-widest font-bold">{b.k}</div>
                <div className="mt-2 text-neutral-500 text-[10px] tracking-widest uppercase">{t(b.tk)}</div>
                <div className="mt-1 text-white font-bold text-sm uppercase">{t(b.t1)}</div>
                <div className="mt-2 text-neutral-400 text-xs leading-relaxed line-clamp-3">{t(b.d)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
