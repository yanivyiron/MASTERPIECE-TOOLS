import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Global, fully editable site configuration. Persisted to localStorage today;
// will be replaced by backend GET/PUT /api/admin/settings + /api/admin/products in Phase 2.

const STORAGE_KEY = 'mpt_site_config';

export const SITE_CONFIG_DEFAULTS = {
  // Company
  companyName: 'Masterpiece Innovations B.V.',
  companyTagline: 'Aerospace-grade precision gauges & custom cutting tools',
  companyAddress: 'Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands',

  // Logo / brand
  logoText: 'Masterpiece Tools',
  logoImageDataUrl: '', // optional uploaded image (base64 data URL); empty → use default SVG mark + text

  // Contact
  contactEmail: 'yaniv@masterpiece-innovations.com',
  contactPhone: '+31 6 25363610',
  notifyEmail: 'yaniv@masterpiece-innovations.com',

  // WhatsApp
  whatsappEnabled: true,
  whatsappNumber: '+31 6 25363610',

  // Social
  linkedinUrl: 'https://www.linkedin.com/company/masterpiece-innovations-b-v/?viewAsMember=true',
  websiteUrl: 'https://www.masterpiece-tools.com',

  // Site defaults
  defaultLanguage: 'en',
  rfqResponseTime: '24-48h',
  certifications: 'ISO/EN compliant • Aerospace Approved',

  // Allowed countries for RFQ (ISO codes). Empty list = allow ALL.
  allowedCountries: [],

  // Domain / SEO
  primaryDomain: 'www.masterpiece-tools.com',
  ogImageUrl: '',
  seoTitle: 'Masterpiece Tools — Aerospace-Grade Precision Gauges',
  seoDescription: 'ISO-certified precision gauges and custom carbide cutting tools for aerospace, defense and advanced manufacturing. European supply with full traceability and 24-48h RFQ response.',

  // Email provider (used in Phase 2 backend)
  emailProvider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  fromEmail: 'noreply@masterpiece-tools.com',
  fromName: 'Masterpiece Innovations B.V.',
  notifyOnNewQuote: true,
  notifyOnReply: true,

  // Product overrides — { [productId]: { specSheetDataUrl, hidden, customImageDataUrl } }
  productOverrides: {},

  // Custom products added by admin (in addition to hardcoded ones)
  customProducts: [], // each: { id, slug, nameKey?, name, descKey?, desc, category, image, specs, features, leadTime, badge, specSheet (dataUrl), createdAt }
};

const SiteConfigContext = createContext({
  config: SITE_CONFIG_DEFAULTS,
  updateConfig: () => {},
  resetConfig: () => {},
  setProductOverride: () => {},
  addCustomProduct: () => {},
  removeCustomProduct: () => {},
});

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...SITE_CONFIG_DEFAULTS, ...JSON.parse(raw) } : SITE_CONFIG_DEFAULTS;
    } catch (e) {
      return SITE_CONFIG_DEFAULTS;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (e) { /* ignore */ }
  }, [config]);

  const value = useMemo(() => ({
    config,
    updateConfig: (patch) => setConfig((c) => ({ ...c, ...patch })),
    resetConfig: () => setConfig(SITE_CONFIG_DEFAULTS),
    setProductOverride: (productId, patch) => setConfig((c) => ({
      ...c,
      productOverrides: { ...c.productOverrides, [productId]: { ...(c.productOverrides[productId] || {}), ...patch } },
    })),
    addCustomProduct: (product) => setConfig((c) => ({
      ...c,
      customProducts: [{ ...product, id: product.id || `custom-${Date.now()}`, createdAt: new Date().toISOString() }, ...c.customProducts],
    })),
    removeCustomProduct: (id) => setConfig((c) => ({
      ...c,
      customProducts: c.customProducts.filter((p) => p.id !== id),
    })),
  }), [config]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => useContext(SiteConfigContext);
