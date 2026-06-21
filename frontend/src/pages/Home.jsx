import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import ProductGrid from '../components/sections/ProductGrid';
import { ProcessSection, IndustriesSection, StrategicSection } from '../components/sections/Pillars';
import { CallToAction, TrustedClients, MicronPrecision, PrecisionShowcase } from '../components/sections/CTA';
import { useLang } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLang();
  return (
    <>
      <Helmet>
        <title>Masterpiece Tools — Aerospace-Grade Precision Gauges & Custom Cutting Tools</title>
        <meta name="description" content="ISO-certified precision gauges and custom carbide cutting tools for aerospace, defense and advanced manufacturing. European supply with full traceability and 24-48h RFQ response." />
        <meta property="og:title" content="Masterpiece Tools — Aerospace-Grade Precision Gauges" />
        <meta property="og:description" content="ISO-certified precision gauges and custom cutting tools for mission-critical aerospace applications." />
      </Helmet>
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
