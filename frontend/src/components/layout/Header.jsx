import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import { useLang } from '../../context/LanguageContext';
import { useBasket } from '../../context/BasketContext';
import { ShoppingBasket, Menu, X, ChevronDown, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const Header = () => {
  const { lang, setLang, t, languages } = useLang();
  const { count, setDrawerOpen } = useBasket();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLink = ({ isActive }) =>
    `relative text-[13px] tracking-[0.18em] uppercase font-medium transition-colors duration-200 ${
      isActive ? 'text-white' : 'text-neutral-300 hover:text-white'
    }`;

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <div className="hidden md:block bg-black/95 text-[11px] text-neutral-400 border-b border-neutral-800/70">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> yaniv@masterpiece-innovations.com</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +31 (0) 20 000 0000</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-500">ISO/EN compliant • Aerospace Approved</span>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-neutral-800' : 'bg-black'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="shrink-0" aria-label="Masterpiece Tools">
              <Logo />
            </Link>

            <nav className="hidden lg:flex items-center gap-9">
              <NavLink to="/about" className={navLink}>{t('nav.about')}</NavLink>
              <NavLink to="/category/custom-cutting-tools" className={navLink}>{t('nav.cuttingTools')}</NavLink>
              <NavLink to="/category/precision-gauges" className={navLink}>{t('nav.precisionGauges')}</NavLink>
              <NavLink to="/products" className={navLink}>{t('nav.products')}</NavLink>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:inline-flex items-center gap-1.5 text-[12px] tracking-wider text-neutral-300 hover:text-white px-2.5 py-1.5 rounded border border-neutral-800 hover:border-neutral-600 transition-colors">
                    {currentLang.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200 min-w-[160px]">
                  <DropdownMenuLabel className="text-neutral-500 text-xs">{t('lang.label')}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  {languages.map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`cursor-pointer focus:bg-neutral-800 focus:text-white ${l.code === lang ? 'text-orange-500' : ''}`}
                    >
                      <span className="font-medium mr-2">{l.label}</span>
                      <span className="text-neutral-500 text-xs">{l.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setDrawerOpen(true)}
                aria-label={t('nav.basket')}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 transition-colors"
              >
                <ShoppingBasket className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">{count}</span>
                )}
              </button>

              <Button
                onClick={() => navigate('/request-a-quote')}
                className="hidden md:inline-flex bg-orange-500 hover:bg-orange-400 text-white font-semibold tracking-wide rounded-none h-10 px-5 shadow-lg shadow-orange-500/20"
              >
                {t('nav.requestQuote')}
              </Button>

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded border border-neutral-800 text-neutral-300 hover:text-white">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-black border-l border-neutral-800 text-white w-[300px]">
                  <div className="flex items-center justify-between mb-8">
                    <Logo />
                    <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <nav className="flex flex-col gap-5">
                    <NavLink to="/about" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-200 hover:text-orange-500">{t('nav.about')}</NavLink>
                    <NavLink to="/category/custom-cutting-tools" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-200 hover:text-orange-500">{t('nav.cuttingTools')}</NavLink>
                    <NavLink to="/category/precision-gauges" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-200 hover:text-orange-500">{t('nav.precisionGauges')}</NavLink>
                    <NavLink to="/products" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-200 hover:text-orange-500">{t('nav.products')}</NavLink>
                  </nav>
                  <div className="mt-8 border-t border-neutral-800 pt-6">
                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">{t('lang.label')}</div>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => setLang(l.code)}
                          className={`px-3 py-1.5 text-xs border rounded ${l.code === lang ? 'border-orange-500 text-orange-500' : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => { setMobileOpen(false); navigate('/request-a-quote'); }}
                    className="mt-8 w-full bg-orange-500 hover:bg-orange-400 text-white rounded-none h-11"
                  >
                    {t('nav.requestQuote')}
                  </Button>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
