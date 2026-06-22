import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '../context/SiteConfigContext';
import EditableText from '../components/EditableText';

const Wrap = ({ title, k, children }) => {
  const { config } = useSiteConfig();
  return (
    <div className="bg-black text-white min-h-screen">
      <Helmet><title>{`${title} — ${config.companyName}`}</title></Helmet>
      <div className="max-w-3xl mx-auto px-6 py-20 lg:py-28">
        <EditableText k={`legal.${k}.title`} as="h1" className="text-4xl lg:text-5xl font-black tracking-tight mb-3">{title}</EditableText>
        <div className="text-[11px] uppercase tracking-widest text-orange-500 mb-10">Last updated: {new Date().toLocaleDateString('en-GB')}</div>
        <div className="prose prose-invert prose-orange max-w-none text-neutral-300 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const H2 = ({ children, k }) => (
  <EditableText k={`legal.${k}`} as="h2" className="text-white text-xl font-bold mt-10 mb-2 tracking-tight">{children}</EditableText>
);

export const Imprint = () => {
  const { config } = useSiteConfig();
  return (
    <Wrap title="Imprint / Legal notice" k="imprint">
      <p>Information required under Dutch and EU law (Article 3:15d Burgerlijk Wetboek and the EU E-Commerce Directive 2000/31/EC).</p>

      <H2 k="imprint.company">Company</H2>
      <p>
        <strong className="text-white">{config.companyName}</strong><br />
        {config.companyAddress}<br />
        The Netherlands
      </p>

      <H2 k="imprint.contact">Contact</H2>
      <p>
        Email: <a href={`mailto:${config.contactEmail}`} className="text-orange-400 hover:underline">{config.contactEmail}</a><br />
        Phone: <a href={`tel:${(config.contactPhone || '').replace(/\s/g, '')}`} className="text-orange-400 hover:underline">{config.contactPhone}</a><br />
        Website: <a href={config.websiteUrl} className="text-orange-400 hover:underline">{config.websiteUrl}</a>
      </p>

      <H2 k="imprint.registration">Registration</H2>
      <p>
        Chamber of Commerce (KvK): <EditableText k="legal.imprint.kvk" as="span">[Insert KvK number]</EditableText><br />
        VAT (BTW-id): <EditableText k="legal.imprint.vat" as="span">[Insert VAT number, e.g. NL000000000B01]</EditableText>
      </p>

      <H2 k="imprint.responsible">Responsible for content</H2>
      <p>
        <EditableText k="legal.imprint.responsible" as="span">Yaniv Bar — Director, {config.companyName}</EditableText>
      </p>

      <H2 k="imprint.disputes">Online dispute resolution</H2>
      <p>The European Commission provides an online dispute resolution platform at <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">ec.europa.eu/consumers/odr/</a>. We are not obligated nor willing to participate in dispute-resolution proceedings before a consumer arbitration board.</p>

      <H2 k="imprint.liability">Liability for content</H2>
      <p>The content of this website has been compiled with utmost care. However, no liability can be assumed for the correctness, completeness, or topicality of the contents. We are responsible for our own content on these pages pursuant to general legislation. We are not, however, obliged to monitor transmitted or stored third-party information.</p>

      <H2 k="imprint.copyright">Copyright</H2>
      <p>All content, images and trademarks on this site are © {new Date().getFullYear()} {config.companyName} unless explicitly stated otherwise. Any reproduction, modification or distribution requires our prior written consent.</p>
    </Wrap>
  );
};

export const Privacy = () => {
  const { config } = useSiteConfig();
  return (
    <Wrap title="Privacy policy" k="privacy">
      <p>This policy explains how <strong className="text-white">{config.companyName}</strong> collects, uses and protects your personal data in accordance with the EU General Data Protection Regulation (GDPR, Regulation 2016/679) and the Dutch Implementation Act (UAVG).</p>

      <H2 k="privacy.controller">Data controller</H2>
      <p>
        {config.companyName}<br />
        {config.companyAddress}<br />
        Email: <a href={`mailto:${config.contactEmail}`} className="text-orange-400 hover:underline">{config.contactEmail}</a>
      </p>

      <H2 k="privacy.collect">What we collect</H2>
      <p>When you submit a Request-for-Quote (RFQ) or contact us we collect: your name, company name, email address, phone number (optional), country, industry, the products and quantities you are interested in, any technical drawings/files you upload, and your free-text message.</p>
      <p>When you visit the site we may also automatically collect: language preference (stored in your browser), basket contents (stored locally only — never sent to us unless you submit a quote), and standard server logs (IP, user-agent, requested URL, timestamp) retained for security and abuse-prevention for a maximum of 30 days.</p>

      <H2 k="privacy.purpose">Why we use it</H2>
      <p>To respond to your RFQ, prepare a commercial offer, fulfil an order, comply with our tax and accounting obligations, and — only with your explicit prior consent — to send you occasional product updates.</p>

      <H2 k="privacy.basis">Legal basis</H2>
      <p>Performance of a contract or pre-contractual measures at your request (Art. 6(1)(b) GDPR), our legitimate interest in running our business (Art. 6(1)(f) GDPR) and your consent where applicable (Art. 6(1)(a) GDPR).</p>

      <H2 k="privacy.sharing">Sharing</H2>
      <p>We do not sell your data. We share it strictly with sub-processors necessary to operate the service: our email-delivery provider (SMTP), our hosting provider, our payment processor (if applicable to your order), and our accountant. All sub-processors are EU-based or covered by Standard Contractual Clauses.</p>

      <H2 k="privacy.retention">Retention</H2>
      <p>Quote data is kept for up to 7 years to comply with Dutch tax retention rules (Article 52 AWR). You can request earlier deletion of personal data not required for legal purposes at any time.</p>

      <H2 k="privacy.rights">Your rights</H2>
      <p>Under GDPR you have the right to access, rectify, erase, restrict or object to the processing of your personal data, and the right to data portability. To exercise any of these rights please email <a href={`mailto:${config.contactEmail}`} className="text-orange-400 hover:underline">{config.contactEmail}</a>. You also have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens, <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">autoriteitpersoonsgegevens.nl</a>).</p>

      <H2 k="privacy.cookies">Cookies</H2>
      <p>This website uses only strictly-necessary, first-party storage (localStorage) for language preference, basket contents, and admin sessions. We do not use third-party tracking, advertising or analytics cookies by default. If we later add analytics you will see a consent banner before any non-essential cookies are placed.</p>

      <H2 k="privacy.security">Security</H2>
      <p>Data is transmitted over TLS 1.2+, stored in encrypted databases inside the EU, and access is restricted to authorised personnel under role-based permissions.</p>

      <H2 k="privacy.changes">Changes to this policy</H2>
      <p>We may amend this policy as our service evolves. Material changes will be highlighted on this page with a new "last updated" date above.</p>
    </Wrap>
  );
};

export const Terms = () => {
  const { config } = useSiteConfig();
  return (
    <Wrap title="Terms of service" k="terms">
      <p>These Terms govern your use of <strong className="text-white">{config.websiteUrl}</strong> and any quote, sale or supply of goods by <strong className="text-white">{config.companyName}</strong>. By using the site or submitting an RFQ you accept these Terms.</p>

      <H2 k="terms.scope">1. Scope</H2>
      <p>We supply industrial precision gauges, custom carbide cutting tools and related engineering services on a strictly B2B basis. The site is not intended for consumer purchases.</p>

      <H2 k="terms.rfq">2. Requests for quote</H2>
      <p>RFQs submitted on the site are non-binding. Quotes we send you are valid for 30 days unless stated otherwise. An order is only formed when we send a written confirmation accepting your purchase order.</p>

      <H2 k="terms.prices">3. Prices &amp; payment</H2>
      <p>Prices are quoted in EUR, exclusive of VAT, exclusive of shipping, customs and any duties unless explicitly stated. Standard payment terms are 30 days net by bank transfer, unless agreed otherwise in writing. Late payments accrue statutory interest plus reasonable collection costs.</p>

      <H2 k="terms.delivery">4. Delivery &amp; lead times</H2>
      <p>Lead times shown on the site are indicative. Confirmed lead times are stated in the order confirmation. Risk passes to the buyer upon Ex-Works dispatch from our facility (Incoterms 2020) unless otherwise agreed.</p>

      <H2 k="terms.ip">5. Intellectual property</H2>
      <p>Any drawings, designs or technical data you share remain your property; we use them only to prepare your quote and produce your order. Conversely, all content, designs, photographs, drawings and trademarks shown on this site are our property and may not be reproduced without prior written consent.</p>

      <H2 k="terms.warranty">6. Warranty</H2>
      <p>Goods are warranted to conform to the specifications stated in the order confirmation for 12 months from delivery, subject to normal industrial use. We will repair or replace non-conforming goods at our option. Custom-machined items are non-returnable unless defective.</p>

      <H2 k="terms.liability">7. Liability</H2>
      <p>To the maximum extent permitted by law our aggregate liability under or in connection with an order is limited to the invoice value of that order. We are not liable for indirect or consequential damages including lost profits or production downtime.</p>

      <H2 k="terms.force">8. Force majeure</H2>
      <p>Neither party is liable for delays or failure to perform caused by events beyond reasonable control (war, sanctions, pandemic, strike, customs delays, supplier failure, energy/raw-material shortage).</p>

      <H2 k="terms.law">9. Governing law &amp; jurisdiction</H2>
      <p>These Terms and any non-contractual obligations arising out of them are governed by the laws of the Netherlands, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). The competent court in Amsterdam, the Netherlands, has exclusive jurisdiction.</p>

      <H2 k="terms.contact">10. Contact</H2>
      <p>Questions about these Terms? Email <a href={`mailto:${config.contactEmail}`} className="text-orange-400 hover:underline">{config.contactEmail}</a>.</p>
    </Wrap>
  );
};
