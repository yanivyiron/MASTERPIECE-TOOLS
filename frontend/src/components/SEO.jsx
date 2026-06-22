import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../context/LanguageContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { LANGUAGES } from '../i18n/translations';

// Global SEO + hreflang generator. Use this inside each page Helmet alongside page-specific tags.
const SEO = ({ title, description, image, type = 'website', path = '' }) => {
  const { lang } = useLang();
  const { config } = useSiteConfig();
  const domain = (config.websiteUrl || 'https://www.masterpiece-tools.com').replace(/\/+$/, '');
  const pageTitle = title || config.seoTitle || `${config.companyName} — ${config.companyTagline}`;
  const pageDesc = description || config.seoDescription || '';
  const pageImage = image || config.ogImageUrl || `${domain}/og-default.jpg`;
  const url = `${domain}${path}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={url} />

      {/* hreflang — tell search engines about every translation */}
      {LANGUAGES.map((l) => (
        <link key={l.code} rel="alternate" hrefLang={l.code} href={`${domain}${path}?lang=${l.code}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={config.companyName} />
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : `${lang}_${lang.toUpperCase()}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />

      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="googlebot" content="index, follow" />

      {/* Theme color & favicons */}
      <meta name="theme-color" content="#FF6B1A" />
    </Helmet>
  );
};

export default SEO;
