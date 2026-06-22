import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Global site configuration — editable from Admin Settings.
// Frontend reads from this context so every change in Admin reflects everywhere.
// Persisted in localStorage today; will be replaced by backend GET/PUT /api/admin/settings.

const STORAGE_KEY = 'mpt_site_config';

export const SITE_CONFIG_DEFAULTS = {
  // Company
  companyName: 'Masterpiece Innovations B.V.',
  companyTagline: 'Aerospace-grade precision gauges & custom cutting tools',
  companyAddress: 'Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands',

  // Contact
  contactEmail: 'yaniv@masterpiece-innovations.com',
  contactPhone: '+31 6 25363610',
  notifyEmail: 'yaniv@masterpiece-innovations.com',

  // WhatsApp
  whatsappEnabled: true,
  whatsappNumber: '+31 6 25363610',

  // Social links
  linkedinUrl: 'https://www.linkedin.com/company/masterpiece-innovations-b-v/?viewAsMember=true',
  websiteUrl: 'https://www.masterpiece-tools.com',

  // Hero / homepage CMS
  heroTitle1: '',
  heroTitle2: '',
  heroSubtitle: '',
  heroBadge: '',
  heroCta1: '',
  heroCta2: '',

  // Site defaults
  defaultLanguage: 'en',
  rfqResponseTime: '24-48h',
  certifications: 'ISO/EN compliant • Aerospace Approved',

  // Email provider (stays mocked until backend phase)
  emailProvider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  fromEmail: 'noreply@masterpiece-tools.com',
  fromName: 'Masterpiece Innovations B.V.',
  notifyOnNewQuote: true,
  notifyOnReply: true,
};

const SiteConfigContext = createContext({
  config: SITE_CONFIG_DEFAULTS,
  updateConfig: () => {},
  resetConfig: () => {},
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
  }), [config]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => useContext(SiteConfigContext);
