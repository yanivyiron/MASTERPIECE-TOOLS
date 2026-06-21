import React from 'react';
import { Crosshair, BadgeCheck, Settings2, Truck } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { PILLARS } from '../../mock';
import { useInView } from '../../hooks/useInView';

const ICONS = { Crosshair, BadgeCheck, Settings2, Truck };

const PillarCard = ({ p, index }) => {
  const { t } = useLang();
  const [ref, inView] = useInView();
  const Icon = ICONS[p.icon];
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 90}ms` }}
      className={`group relative p-7 border border-neutral-800 bg-gradient-to-b from-neutral-950 to-neutral-900/60 hover:border-orange-500/60 transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/0 group-hover:via-orange-500/70 to-transparent transition-all duration-500" />
      <div className="w-12 h-12 mb-5 flex items-center justify-center border border-neutral-800 group-hover:border-orange-500/60 group-hover:bg-orange-500/10 transition-colors">
        {Icon && <Icon className="w-5 h-5 text-orange-500" />}
      </div>
      <h3 className="text-white font-bold tracking-wide uppercase text-sm mb-2">{t(p.titleKey)}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{t(p.descKey)}</p>
    </div>
  );
};

const Features = () => {
  const { t } = useLang();
  return (
    <section id="features" className="relative bg-black py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="max-w-2xl">
          <div className="text-orange-500 text-xs tracking-[0.25em] uppercase font-semibold mb-3">{t('section.experts')}</div>
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05]">{t('section.experts')}</h2>
          <p className="text-neutral-400 mt-5 max-w-xl text-base leading-relaxed">{t('section.expertsDesc')}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PILLARS.map((p, i) => <PillarCard key={p.titleKey} p={p} index={i} />)}
        </div>
      </div>
    </section>
  );
};

export default Features;
