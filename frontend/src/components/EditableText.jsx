import React from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';

/**
 * EditableText — read-only on the public site.
 *
 * Editing is now done exclusively in the admin panel at `/admin/content`,
 * which writes to the same `site_overrides` store. This component just looks
 * up the current value (override or fallback) and renders it.
 */
const EditableText = ({ k, as: Tag = 'span', children, className = '', ...rest }) => {
  const { text } = useSiteConfig();
  const fallback = typeof children === 'string'
    ? children
    : (React.Children.map(children, (c) => (typeof c === 'string' ? c : '')) || []).join('');
  const value = text(k, fallback);
  return <Tag className={className} {...rest}>{value}</Tag>;
};

export default EditableText;
