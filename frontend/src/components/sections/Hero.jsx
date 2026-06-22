import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { ArrowRight, BadgeCheck, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { SITE_IMAGES, STATS } from '../../mock';
import { AnimatedCounter } from '../animations';

const Hero = () => {
  const { t } = useLang();
  const heroImageRef = React.useRef(null);
  const orbRef = React.useRef(null);

  // Magnetic / parallax cursor follow on hero image
  React.useEffect(() => {
    const onMove = (e) => {
      const img = heroImageRef.current;
      const orb = orbRef.current;
      if (!img) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.05)`;
      if (orb) orb.style.transform = `translate3d(${-x * 1.5}px, ${-y * 1.5}px, 0)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="relative overflow-hidden bg-black min-h-[88vh] flex items-center">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#FFF_1px,transparent_1px),linear-gradient(to_bottom,#FFF_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Glow orb (follows cursor inverse) */}
      <div ref={orbRef} className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.25),transparent_60%)] blur-3xl transition-transform duration-700 ease-out pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,107,26,0.12),transparent_60%)] blur-3xl pointer-events-none" />

      {/* Edge gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/80 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 lg:pt-20 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
        <div className="lg:col-span-7 relative z-10">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-orange-500/40 bg-orange-500/5 text-orange-300 text-[11px] tracking-[0.2em] uppercase mb-7 backdrop-blur-sm animate-[badgePulse_3s_ease-in-out_infinite]">
            <BadgeCheck className="w-3.5 h-3.5" />
            {t('hero.badge')}
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          </div>

          <h1 className="text-white font-black tracking-tight leading-[0.92] text-[42px] sm:text-[58px] lg:text-[80px] xl:text-[88px] hyphens-auto break-words">
            <span className="block opacity-95 animate-[slideInLeft_0.8s_ease-out_0.1s_both]">{t('hero.title1')}</span>
            <span className="block animate-[slideInLeft_0.8s_ease-out_0.3s_both]">
              <span className="relative inline-block max-w-full">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-orange-600">{t('hero.title2')}</span>
                <Sparkles className="absolute -top-3 -right-8 w-6 h-6 text-orange-400 animate-[twinkle_2.5s_ease-in-out_infinite]" />
                <span className="absolute -bottom-2 left-0 h-[8px] w-full bg-orange-500/30 blur-md" />
              </span>
            </span>
          </h1>

          <p className="mt-7 text-neutral-300 text-base sm:text-lg max-w-xl leading-relaxed animate-[fadeIn_1s_ease-out_0.6s_both]">{t('hero.subtitle')}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-[fadeIn_1s_ease-out_0.8s_both]">
            <Button asChild className="group relative bg-orange-500 hover:bg-orange-400 text-white rounded-none h-12 px-7 text-sm font-bold tracking-widest uppercase shadow-2xl shadow-orange-500/40 overflow-hidden">
              <Link to="/request-a-quote">
                <span className="relative z-10 flex items-center">{t('hero.cta1')} <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></span>
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-neutral-700 hover:border-orange-500 hover:text-orange-400 bg-transparent text-white rounded-none h-12 px-7 text-sm font-bold tracking-widest uppercase backdrop-blur-sm">
              <Link to="/products">{t('hero.cta2')}</Link>
            </Button>
          </div>

          {/* Animated stats row */}
          <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 animate-[fadeIn_1s_ease-out_1.1s_both]">
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight tabular-nums">
                  <AnimatedCounter value={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} decimals={s.decimals || 0} />
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-1">{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero image with parallax */}
        <div className="hidden lg:block lg:col-span-5 relative z-10">
          <div className="relative">
            {/* Glow behind */}
            <div className="absolute inset-0 -translate-x-8 translate-y-8 bg-gradient-to-br from-orange-500/30 to-orange-600/0 blur-3xl" />
            <div className="absolute inset-8 border border-orange-500/30 -z-10" />
            <div className="absolute -inset-px border border-orange-500/10" />

            <div className="relative aspect-square overflow-hidden border border-neutral-800 bg-gradient-to-br from-neutral-900 to-black">
              <img
                ref={heroImageRef}
                src={SITE_IMAGES.precisionGaugeCloseup}
                alt="Precision Gauge"
                className="w-full h-full object-cover transition-transform duration-300 ease-out will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              {/* Scan line */}
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/70 to-transparent animate-[scanLine_4s_ease-in-out_infinite]" />

              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-orange-500" />
              <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-orange-500" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-orange-500" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-orange-500" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-[11px] tracking-[0.25em] text-orange-400 uppercase font-bold">Featured</div>
                <div className="mt-1 text-white font-bold text-xl">Aerospace-Grade Precision</div>
                <div className="text-neutral-300 text-sm mt-1">ISO 1502 · Sub-micron tolerance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a href="#features" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-500 hover:text-orange-500 animate-bounce z-10" aria-label="Scroll">
        <ChevronDown className="w-6 h-6" />
      </a>

      <style>{`
        @keyframes badgePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,26,0.4); } 50% { box-shadow: 0 0 0 8px rgba(255,107,26,0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.4; transform: scale(0.9) rotate(0); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
        @keyframes scanLine { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>
    </section>
  );
};

export default Hero;
