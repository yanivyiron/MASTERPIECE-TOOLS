import { useMemo } from 'react';
import { PRODUCTS as BASE_PRODUCTS } from '../mock';
import { useSiteConfig } from '../context/SiteConfigContext';

// Merges base catalog with admin-added custom products + per-product overrides.
// Hidden products (override.hidden===true) are filtered out for public consumption.
export const useResolvedProducts = ({ includeHidden = false } = {}) => {
  const { config } = useSiteConfig();
  return useMemo(() => {
    const overrides = config.productOverrides || {};
    const baseResolved = BASE_PRODUCTS.map((p) => {
      const o = overrides[p.id];
      if (!o) return p;
      return {
        ...p,
        ...(o.customImageDataUrl ? { image: o.customImageDataUrl } : {}),
        ...(o.specSheetDataUrl ? { specSheet: o.specSheetDataUrl } : {}),
        ...(o.hidden ? { hidden: true } : {}),
      };
    });
    const custom = (config.customProducts || []).map((c) => ({
      ...c,
      specs: c.specs || {},
      features: c.features || [],
    }));
    const all = [...custom, ...baseResolved];
    return includeHidden ? all : all.filter((p) => !p.hidden);
  }, [config.productOverrides, config.customProducts, includeHidden]);
};

// Resolves a single product by slug (custom + base)
export const useResolvedProduct = (slug) => {
  const products = useResolvedProducts({ includeHidden: true });
  return useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
};

// Helper: produce display name regardless of whether product uses translation key or literal name
export const productName = (p, t) => p.nameKey ? t(p.nameKey) : (p.name || '');
export const productDesc = (p, t) => p.descKey ? t(p.descKey) : (p.desc || '');
