import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';
import { useLang } from '../../context/LanguageContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { Mail, Phone, MapPin, Linkedin, Globe, Building2, Clock, Languages } from 'lucide-react';

const Footer = () => {
  const { t, lang, setLang, languages } = useLang();
  const { config } = useSiteConfig();
  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400">
      {/* Mobile-first language switcher — always visible, useful on small screens */}
      <div className="lg:hidden border-b border-neutral-900">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-3" data-testid="footer-language-bar">
          <div className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-neutral-500">
            <Languages className="w-3.5 h-3.5 text-orange-500" /> {t('lang.label')}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-label={l.name}
                aria-pressed={l.code === lang}
                data-testid={`footer-lang-${l.code}`}
                className={`px-2.5 py-1.5 text-[11px] tracking-widest uppercase font-semibold border transition-colors ${l.code === lang ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-5 text-sm text-neutral-400 max-w-md leading-relaxed">{t('footer.about')}</p>
            <div className="mt-5 text-xs text-neutral-500 space-y-1">
              <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" /><span>{config.companyName}</span></div>
              <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" /><span>{config.companyAddress}</span></div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a href={config.linkedinUrl || '#'} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-testid="footer-linkedin" className="w-9 h-9 inline-flex items-center justify-center border border-neutral-800 hover:border-orange-500 hover:text-orange-500 rounded transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={config.websiteUrl || 'https://www.masterpiece-tools.com'} target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-9 h-9 inline-flex items-center justify-center border border-neutral-800 hover:border-orange-500 hover:text-orange-500 rounded transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-white text-sm font-semibold tracking-widest uppercase mb-4">{t('footer.products')}</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/category/custom-cutting-tools" className="hover:text-orange-500">{t('nav.cuttingTools')}</Link></li>
              <li><Link to="/category/precision-gauges" className="hover:text-orange-500">{t('nav.precisionGauges')}</Link></li>
              <li><Link to="/products" className="hover:text-orange-500">{t('nav.products')}</Link></li>
              <li><Link to="/request-a-quote" className="hover:text-orange-500">{t('nav.requestQuote')}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-white text-sm font-semibold tracking-widest uppercase mb-4">{t('footer.company')}</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-orange-500">{t('nav.about')}</Link></li>
              <li><Link to="/admin/login" className="hover:text-orange-500">{t('nav.admin')}</Link></li>
              <li><a href="#" className="hover:text-orange-500">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-orange-500">{t('footer.terms')}</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-white text-sm font-semibold tracking-widest uppercase mb-4">{t('footer.contact')}</div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" /> <a href={`mailto:${config.contactEmail}`} className="hover:text-orange-500 break-all">{config.contactEmail}</a></li>
              <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" /> <a href={`tel:${(config.contactPhone || '').replace(/\s/g, '')}`} className="hover:text-orange-500">{config.contactPhone}</a></li>
              <li className="flex items-start gap-2"><Clock className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" /> <span>{t('about.rfqResponse')} {config.rfqResponseTime}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} {config.companyName}. {t('footer.rights')}.</span>
          <span className="tracking-wider">{config.certifications}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
