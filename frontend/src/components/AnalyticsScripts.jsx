import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '../context/SiteConfigContext';

/**
 * Injects tracking pixels into <head> based on admin-configured settings.
 * Only renders on the PUBLIC site (never inside /admin/*).
 * Supported:
 *   • Google Analytics 4  (analyticsGa4Id)
 *   • Google Tag Manager  (analyticsGtmId)
 *   • Meta / Facebook Pixel (analyticsMetaPixelId)
 *   • LinkedIn Insight Tag (analyticsLinkedInPartnerId)
 *   • Custom <head> HTML  (analyticsCustomHead)  — raw paste-in (Hotjar, Clarity, etc.)
 */
const AnalyticsScripts = () => {
  const { config } = useSiteConfig();
  const ga4 = (config.analyticsGa4Id || '').trim();
  const gtm = (config.analyticsGtmId || '').trim();
  const meta = (config.analyticsMetaPixelId || '').trim();
  const li = (config.analyticsLinkedInPartnerId || '').trim();
  const custom = (config.analyticsCustomHead || '').trim();

  // Skip on admin pages — analytics should only run on the public site
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Custom HTML — supports arbitrary tags (e.g. Hotjar's noscript + script combo).
  // We parse and re-create elements so inline <script> blocks actually execute.
  useEffect(() => {
    if (isAdmin || !custom) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = custom;
    const inserted = [];
    Array.from(wrapper.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        if (node.tagName === 'SCRIPT') {
          const s = document.createElement('script');
          for (const a of node.attributes) s.setAttribute(a.name, a.value);
          if (node.textContent) s.textContent = node.textContent;
          document.head.appendChild(s);
          inserted.push(s);
        } else {
          document.head.appendChild(node);
          inserted.push(node);
        }
      }
    });
    return () => { inserted.forEach((n) => n.parentNode && n.parentNode.removeChild(n)); };
  }, [custom, isAdmin]);

  if (isAdmin) return null;
  if (!ga4 && !gtm && !meta && !li) return null;

  return (
    <Helmet>
      {ga4 && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}></script>
      )}
      {ga4 && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga4}', { anonymize_ip: true });
        `}</script>
      )}
      {gtm && (
        <script>{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtm}');
        `}</script>
      )}
      {meta && (
        <script>{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${meta}');
          fbq('track', 'PageView');
        `}</script>
      )}
      {li && (
        <script>{`
          _linkedin_partner_id = "${li}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l) {
          if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[]}
          var s = document.getElementsByTagName("script")[0];
          var b = document.createElement("script");
          b.type = "text/javascript";b.async = true;
          b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b, s);})(window.lintrk);
        `}</script>
      )}
    </Helmet>
  );
};

export default AnalyticsScripts;
