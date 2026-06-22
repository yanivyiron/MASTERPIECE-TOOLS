import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../lib/api';

// Global, fully editable site configuration.
// - Hydrated on app boot from GET /api/settings (public, sensitive fields stripped)
// - localStorage acts as a fast cache + offline fallback
// - Admin presses Save → PUT /api/admin/settings (full config, sensitive fields included)

const STORAGE_KEY = 'mpt_site_config';

export const SITE_CONFIG_DEFAULTS = {
  // Company
  companyName: 'Masterpiece Innovations B.V.',
  companyTagline: 'Aerospace-grade precision gauges & custom cutting tools',
  companyAddress: 'Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands',

  // Logo / brand
  logoText: 'Masterpiece Tools',
  logoImageDataUrl: '',

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

  // Allowed countries (ISO codes). Empty = ALL.
  allowedCountries: [],

  // Domain / SEO
  primaryDomain: 'www.masterpiece-tools.com',
  ogImageUrl: '',
  seoTitle: 'Masterpiece Tools — Aerospace-Grade Precision Gauges',
  seoDescription: 'ISO-certified precision gauges and custom carbide cutting tools for aerospace, defense and advanced manufacturing. European supply with full traceability and 24-48h RFQ response.',

  // Email provider — admin-editable. Password kept server-side after first save.
  emailProvider: 'smtp',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',         // write-only; the public GET strips it
  smtpUseTls: 'true',
  fromEmail: 'noreply@masterpiece-tools.com',
  fromName: 'Masterpiece Innovations B.V.',
  notifyOnNewQuote: true,
  notifyOnReply: true,

  // Per-product overrides + admin-added custom products
  productOverrides: {},
  customProducts: [],

  // Wix-like visual editor — every editable text/image on the public site is stored here
  // under a stable key (e.g. "home.hero.eyebrow", "footer.legal").
  site_overrides: {},

  // Analytics & tracking — injected into the public site <head>
  analyticsGa4Id: '',          // e.g. G-XXXXXXXXXX
  analyticsGtmId: '',          // e.g. GTM-XXXXXXX
  analyticsMetaPixelId: '',    // Facebook/Meta Pixel ID
  analyticsLinkedInPartnerId: '',
  analyticsCustomHead: '',     // raw HTML pasted into <head> (Hotjar, Clarity, etc.)
};

const SiteConfigContext = createContext({
  config: SITE_CONFIG_DEFAULTS,
  updateConfig: () => {},
  resetConfig: () => {},
  setProductOverride: () => {},
  addCustomProduct: () => {},
  removeCustomProduct: () => {},
  saveToServer: async () => {},
  hydrating: false,
  serverSynced: false,
  // Visual editor
  text: (key, fallback) => fallback,
  setOverride: async () => {},
  resetOverride: async () => {},
  editMode: false,
  setEditMode: () => {},
});

const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('SiteConfigContext: cannot read local cache:', e?.message || e);
    return null;
  }
};

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => ({ ...SITE_CONFIG_DEFAULTS, ...(readLocal() || {}) }));
  const [hydrating, setHydrating] = useState(true);
  const [serverSynced, setServerSynced] = useState(false);
  const [editMode, setEditMode] = useState(() => {
    try { return localStorage.getItem('mpt_edit_mode') === '1'; }
    catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('SiteConfigContext: cannot read edit-mode flag:', e?.message || e);
      return false;
    }
  });

  // Keep editMode in sync with localStorage
  useEffect(() => {
    try { localStorage.setItem('mpt_edit_mode', editMode ? '1' : '0'); }
    catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('SiteConfigContext: cannot persist edit-mode flag:', e?.message || e);
    }
  }, [editMode]);

  // Hydrate from backend on boot (overrides cached values)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getSettings();
        if (!cancelled && res?.data && Object.keys(res.data).length > 0) {
          setConfig((c) => ({ ...c, ...res.data, smtpPassword: '' /* never expose */ }));
          setServerSynced(true);
        }
      } catch (e) {
        // Backend unreachable — silently keep local cache so the site still works
        /* eslint-disable-next-line no-console */
        console.warn('Settings hydration failed, using local cache:', e?.message);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist to localStorage on every change (fast cache; client-only fields like logoImageDataUrl)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }
    catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('SiteConfigContext: cannot persist config cache:', e?.message || e);
    }
  }, [config]);

  const saveToServer = useCallback(async () => {
    // Push the whole config. Backend strips smtpPassword from public GET.
    const payload = { ...config };
    await api.adminPutSettings(payload);
    setServerSynced(true);
    // Wipe local smtpPassword once it's been persisted server-side
    setConfig((c) => ({ ...c, smtpPassword: '' }));
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
    saveToServer,
    hydrating,
    serverSynced,
    // ---- Visual editor (Wix-like) ----
    text: (key, fallback) => {
      const ov = config.site_overrides || {};
      const v = ov[key];
      return (v === undefined || v === null || v === '') ? fallback : v;
    },
    setOverride: async (key, value) => {
      // Optimistic local update
      setConfig((c) => ({ ...c, site_overrides: { ...(c.site_overrides || {}), [key]: value } }));
      try {
        await api.adminPutOverride(key, value);
        return { ok: true };
      } catch (e) {
        console.warn('Override save failed:', e?.message);
        return { ok: false, error: e?.message };
      }
    },
    resetOverride: async (key) => {
      setConfig((c) => {
        const next = { ...(c.site_overrides || {}) };
        delete next[key];
        return { ...c, site_overrides: next };
      });
      try {
        await api.adminDeleteOverride(key);
        return { ok: true };
      } catch (e) {
        console.warn('Override reset failed:', e?.message);
        return { ok: false, error: e?.message };
      }
    },
    editMode,
    setEditMode,
  }), [config, hydrating, serverSynced, saveToServer, editMode]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => useContext(SiteConfigContext);
