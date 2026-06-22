import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ExternalLink, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

// Inline industrial PDF viewer drawer — used on ProductDetail
const PdfViewerModal = ({ open, onClose, src, title }) => {
  const { t } = useLang();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            data-testid="pdf-modal-backdrop"
          />

          <motion.div
            className="relative w-full max-w-5xl h-full max-h-[92vh] bg-neutral-950 border border-neutral-800 shadow-[0_30px_120px_rgba(255,107,26,0.18)] flex flex-col"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            data-testid="pdf-modal"
          >
            {/* Industrial corner brackets */}
            <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-orange-500/60 pointer-events-none" />
            <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-orange-500/60 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-orange-500/60 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-orange-500/60 pointer-events-none" />

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-black/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 inline-flex items-center justify-center bg-orange-500/10 border border-orange-500/30 text-orange-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] tracking-[0.25em] text-orange-500 uppercase">{t('pdf.title')}</div>
                  <div className="text-white text-sm font-semibold truncate">{title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={src}
                  download
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs tracking-widest uppercase border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 px-3 py-2 transition-colors"
                  data-testid="pdf-download-btn"
                >
                  <Download className="w-3.5 h-3.5" /> {t('btn.downloadPdf')}
                </a>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs tracking-widest uppercase border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 px-3 py-2 transition-colors"
                  data-testid="pdf-fullscreen-btn"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="w-9 h-9 inline-flex items-center justify-center border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 transition-colors"
                  data-testid="pdf-close-btn"
                  aria-label={t('btn.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-neutral-900 relative">
              <object
                data={`${src}#toolbar=1&navpanes=0&statusbar=0&view=FitH`}
                type="application/pdf"
                className="w-full h-full"
                aria-label={title}
              >
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <FileText className="w-12 h-12 text-orange-500 mb-3" />
                  <div className="text-white font-semibold">PDF preview unavailable on this device.</div>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 text-sm tracking-widest uppercase font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" /> {t('btn.openFullscreen')}
                  </a>
                </div>
              </object>
            </div>

            {/* Mobile-only action bar */}
            <div className="sm:hidden flex items-center gap-2 px-4 py-3 border-t border-neutral-800 bg-black/60">
              <a href={src} download className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs tracking-widest uppercase bg-orange-500 hover:bg-orange-400 text-white px-3 py-2.5">
                <Download className="w-3.5 h-3.5" /> {t('btn.downloadPdf')}
              </a>
              <a href={src} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs tracking-widest uppercase border border-neutral-800 text-neutral-300 px-3 py-2.5">
                <ExternalLink className="w-3.5 h-3.5" /> {t('btn.openFullscreen')}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PdfViewerModal;
