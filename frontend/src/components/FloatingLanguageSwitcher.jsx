import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Check, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const DISMISS_KEY = 'mpt_lang_switcher_dismissed';

// Always-on language switcher on mobile (bottom-left). Hidden on lg+ where the header
// already has a dropdown. Mirrors the WhatsApp button's pattern on the opposite side.
const FloatingLanguageSwitcher = () => {
  const { lang, setLang, languages } = useLang();
  const [open, setOpen] = useState(false);
  const [appeared, setAppeared] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const wrapRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const dismiss = (e) => {
    e.stopPropagation();
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
    setOpen(false);
  };

  if (dismissed) return null;

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-5 left-5 z-[90] flex flex-col items-start gap-3 lg:hidden"
      data-testid="floating-language-wrapper"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="bg-neutral-950 border border-neutral-800 shadow-2xl min-w-[200px] overflow-hidden"
            data-testid="floating-language-card"
          >
            <div className="bg-neutral-900 px-4 py-2.5 border-b border-neutral-800 inline-flex items-center gap-2 w-full">
              <Languages className="w-4 h-4 text-orange-500" />
              <div className="text-white text-xs font-semibold tracking-widest uppercase">Language</div>
            </div>
            <ul className="py-1" role="listbox">
              {languages.map((l) => {
                const selected = l.code === lang;
                return (
                  <li key={l.code} role="option" aria-selected={selected}>
                    <button
                      onClick={() => { setLang(l.code); setOpen(false); }}
                      data-testid={`floating-lang-${l.code}`}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                        selected ? 'text-orange-500 bg-orange-500/5' : 'text-neutral-200 hover:bg-neutral-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-bold w-7 text-[12px] tracking-widest">{l.label}</span>
                        <span className="text-neutral-500 text-xs">{l.name}</span>
                      </span>
                      {selected && <Check className="w-4 h-4 text-orange-500" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: appeared ? 1 : 0, opacity: appeared ? 1 : 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          aria-label="Change language"
          aria-expanded={open}
          data-testid="floating-language-btn"
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-950 border-2 border-orange-500 text-orange-500 shadow-[0_8px_30px_rgba(255,107,26,0.35)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors"
        >
          <span className="absolute inset-0 rounded-full ring-2 ring-white/10" />
          <span className="text-sm font-bold tracking-widest">{current.label}</span>
        </motion.button>

        {/* Dismiss X — sits at the top-right edge of the floating button */}
        <button
          onClick={dismiss}
          aria-label="Hide language switcher"
          data-testid="floating-language-dismiss"
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 flex items-center justify-center shadow-lg transition-colors"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default FloatingLanguageSwitcher;
