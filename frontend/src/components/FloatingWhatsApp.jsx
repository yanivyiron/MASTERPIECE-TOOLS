import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useLang } from '../context/LanguageContext';

// Floating WhatsApp button — bottom right, animated tooltip on first scroll
const FloatingWhatsApp = () => {
  const { config } = useSiteConfig();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    const tmr = setTimeout(() => setAppeared(true), 1200);
    return () => clearTimeout(tmr);
  }, []);

  // Strip non-digits for the wa.me link
  const waNumber = (config.whatsappNumber || '+31625363610').replace(/\D/g, '');
  const message = encodeURIComponent(t('wa.message'));
  const href = `https://wa.me/${waNumber}?text=${message}`;

  if (!config.whatsappEnabled) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3" data-testid="floating-whatsapp-wrapper">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="bg-neutral-950 border border-neutral-800 shadow-2xl w-[280px] sm:w-[320px] overflow-hidden"
            data-testid="whatsapp-card"
          >
            {/* Card header */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Masterpiece Tools</div>
                <div className="text-emerald-200 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> {t('wa.online')}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white" aria-label={t('btn.close')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Card body */}
            <div className="bg-[radial-gradient(circle_at_top_left,#1c1c1c,#0a0a0a)] px-4 py-5">
              <div className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-sm p-3 rounded-tr-md rounded-br-md rounded-bl-md max-w-[85%]">
                <div className="text-[10px] tracking-widest text-orange-500 mb-1 uppercase">{t('wa.salesTeam')}</div>
                {t('wa.greeting')}
              </div>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold text-sm tracking-wide py-3 transition-colors"
                data-testid="whatsapp-start-chat"
              >
                <MessageCircle className="w-4 h-4" /> {t('wa.startChat')}
              </a>
              <div className="text-[10px] text-neutral-500 mt-2 text-center">{config.whatsappNumber || '+31 6 25363610'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: appeared ? 1 : 0, opacity: appeared ? 1 : 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        aria-label="Open WhatsApp chat"
        data-testid="floating-whatsapp-btn"
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.45)] flex items-center justify-center"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping" />
        <span className="absolute inset-0 rounded-full ring-2 ring-white/15" />
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 relative z-10" />
      </motion.button>
    </div>
  );
};

export default FloatingWhatsApp;
