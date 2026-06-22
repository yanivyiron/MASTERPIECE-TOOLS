/**
 * Sanitize untrusted HTML before rendering with dangerouslySetInnerHTML.
 *
 * Centralised so we apply a consistent allowlist across every "HTML preview"
 * surface in the panel (email-blast composer, email template editor,
 * per-customer mail dialog, public site testimonials, etc.).
 *
 * DOMPurify's defaults already strip <script>, on* handlers, javascript: URLs,
 * <iframe>, <object>, <embed>, etc.
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup',
  'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img',
  'li', 'ol', 'p', 'pre', 'small', 'span', 'strong', 'sub', 'sup',
  'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'figure', 'figcaption',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class',
  'colspan', 'rowspan', 'align', 'border', 'cellpadding', 'cellspacing',
  'target', 'rel',
];

export function sanitizeHtml(html) {
  if (html == null) return '';
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'meta', 'base', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true,
  });
}

/** Convenience React prop builder for sanitized HTML. */
export function safeHtml(html) {
  return { __html: sanitizeHtml(html) };
}

/**
 * Safe encoder for inline JSON-LD `<script type="application/ld+json">` blocks.
 *
 * Even though browsers do NOT execute application/ld+json as JavaScript, a stray
 * `</script>` inside a string value would terminate the script tag early and let
 * everything after it bleed into the DOM. We escape it defensively.
 */
export function jsonLd(obj) {
  return JSON.stringify(obj || {})
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
