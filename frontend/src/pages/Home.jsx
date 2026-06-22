import React from 'react';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import ProductGrid from '../components/sections/ProductGrid';
import { ProcessSection, IndustriesSection, StrategicSection } from '../components/sections/Pillars';
import { CallToAction, TrustedClients, MicronPrecision, PrecisionShowcase } from '../components/sections/CTA';
import { useLang } from '../context/LanguageContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import SEO from '../components/SEO';
import { jsonLd } from '../lib/sanitize';

const Home = () => {
  const { t } = useLang();
  const { config } = useSiteConfig();

  // Organization + Website structured data
  const ldOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.companyName,
    url: config.websiteUrl,
    logo: config.logoImageDataUrl || `${config.websiteUrl}/logo.png`,
    address: { '@type': 'PostalAddress', streetAddress: config.companyAddress },
    contactPoint: [{ '@type': 'ContactPoint', telephone: config.contactPhone, contactType: 'sales', email: config.contactEmail, areaServed: 'EU' }],
    sameAs: [config.linkedinUrl].filter(Boolean),
  };
  const ldWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: config.websiteUrl,
    name: config.companyName,
    inLanguage: ['en', 'nl', 'de', 'fr', 'pt'],
  };

  return (
    <>
      <SEO path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ldOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ldWebsite) }} />
      <Hero />
      <TrustedClients />
      <PrecisionShowcase />
      <Features />
      <ProductGrid limit={8} kicker={t('section.precisionGauges')} title={t('section.precisionGauges')} />
      <MicronPrecision />
      <StrategicSection />
      <ProcessSection />
      <IndustriesSection />
      <CallToAction />
    </>
  );
};

export default Home;
