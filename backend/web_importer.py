"""Website importer — crawls a URL (and same-domain links) and returns clean structured
content for the Web Importer panel + the AI's `crawl_website` tool.

Goals:
- Same-domain crawl up to `max_pages` (default 6, hard cap 25).
- For each page: title, clean text, image URLs (resolved + de-duplicated), outbound links.
- Polite: small concurrency, short timeouts, ignores common asset/binary URLs.
- All HTTP only (no JS execution). Good enough for catalog-style sites.
"""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Dict, List, Set
from urllib.parse import urljoin, urlparse, urldefrag

import httpx

logger = logging.getLogger(__name__)

UA = "Mozilla/5.0 (compatible; MasterpieceImporter/1.0)"
SKIP_EXT = (
    ".pdf", ".zip", ".rar", ".7z", ".tar", ".gz", ".mp4", ".mp3", ".mov", ".avi",
    ".css", ".js", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot",
)
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif")


def _norm(url: str) -> str:
    url, _ = urldefrag(url)
    return url.rstrip("/")


def _is_html_link(url: str) -> bool:
    p = urlparse(url)
    if not p.scheme.startswith("http"):
        return False
    path = (p.path or "/").lower()
    return not any(path.endswith(e) for e in SKIP_EXT)


def _is_image(url: str) -> bool:
    return any(url.lower().split("?")[0].endswith(e) for e in IMG_EXT)


def _clean_text(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html or "", flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _title(html: str) -> str:
    m = re.search(r"<title>([^<]+)</title>", html or "", re.I)
    if m:
        return m.group(1).strip()[:200]
    m = re.search(r'<meta\s+[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']', html or "", re.I)
    if m:
        return m.group(1).strip()[:200]
    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html or "", re.I)
    return (m.group(1).strip()[:200] if m else "")


def _meta(html: str, name: str) -> str:
    m = re.search(rf'<meta\s+[^>]*(?:name|property)=["\']{name}["\'][^>]*content=["\']([^"\']+)["\']', html or "", re.I)
    return (m.group(1).strip()[:300] if m else "")


HEADING_RE = re.compile(r"<h([1-6])[^>]*>([\s\S]*?)</h\1>", re.I)


def _headings(html: str) -> List[Dict[str, str]]:
    out = []
    for m in HEADING_RE.finditer(html or ""):
        lvl = int(m.group(1))
        txt = _clean_text(m.group(2))
        if txt:
            out.append({"level": lvl, "text": txt[:200]})
        if len(out) >= 40:
            break
    return out


def _images(html: str, base: str) -> List[str]:
    out: List[str] = []
    seen: Set[str] = set()
    for m in re.finditer(r'<img\s+[^>]*src=["\']([^"\']+)["\']', html or "", re.I):
        u = urljoin(base, m.group(1))
        if not _is_image(u):
            continue
        n = _norm(u)
        if n in seen:
            continue
        seen.add(n)
        out.append(u)
        if len(out) >= 30:
            break
    return out


def _links(html: str, base: str) -> List[str]:
    out: List[str] = []
    seen: Set[str] = set()
    for m in re.finditer(r'<a\s+[^>]*href=["\']([^"\']+)["\']', html or "", re.I):
        u = urljoin(base, m.group(1))
        n = _norm(u)
        if n in seen or not _is_html_link(u):
            continue
        seen.add(n)
        out.append(u)
    return out


async def crawl_site(start_url: str, *, max_pages: int = 6, same_domain_only: bool = True) -> List[Dict]:
    """Crawl `start_url` and same-domain links up to `max_pages`. Returns a list of pages."""
    max_pages = max(1, min(int(max_pages), 25))
    start_url = start_url if start_url.startswith("http") else f"https://{start_url}"
    root_domain = urlparse(start_url).netloc.lower()
    queue: List[str] = [start_url]
    seen: Set[str] = set()
    pages: List[Dict] = []

    timeout = httpx.Timeout(20.0, connect=8.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent": UA}) as client:
        while queue and len(pages) < max_pages:
            url = queue.pop(0)
            n = _norm(url)
            if n in seen:
                continue
            seen.add(n)
            if same_domain_only and urlparse(url).netloc.lower() != root_domain:
                continue
            try:
                r = await client.get(url)
            except Exception as e:
                logger.warning("crawl GET failed %s: %s", url, e)
                continue
            if r.status_code >= 400 or "html" not in (r.headers.get("content-type") or "").lower():
                continue
            html = r.text or ""
            page = {
                "url": str(r.url),
                "title": _title(html),
                "description": _meta(html, "description") or _meta(html, "og:description"),
                "headings": _headings(html),
                "text": _clean_text(html)[:6000],
                "images": _images(html, str(r.url)),
                "links": _links(html, str(r.url))[:40],
            }
            pages.append(page)
            # Enqueue new same-domain links
            for link in page["links"]:
                if len(pages) + len(queue) >= max_pages * 3:
                    break
                if _norm(link) not in seen:
                    queue.append(link)
    return pages
