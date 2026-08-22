import { useEffect } from 'react';

interface SEOFields {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

const setMeta = (selector: string, attr: 'content', value: string | undefined) => {
  if (!value) return;
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

// This is a pure client-side-rendered app (no SSR/prerendering), so this
// can't help a crawler that doesn't execute JS — but it does drive the
// browser tab title, and updates the tags social previews/some crawlers
// read, straight from whatever the admin set on a blog post (or any other
// page that wants per-page SEO control). Restores the site-wide defaults
// from index.html on unmount so navigating away doesn't leak a stale title.
export const useDocumentSEO = ({ title, description, keywords, ogImage }: SEOFields) => {
  useEffect(() => {
    const defaultTitle = document.title;
    const defaultDescription = document.head.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const defaultOgTitle = document.head.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const defaultOgDescription = document.head.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const defaultOgImage = document.head.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const defaultKeywords = document.head.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

    if (title) document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[name="keywords"]', 'content', keywords);

    return () => {
      document.title = defaultTitle;
      setMeta('meta[name="description"]', 'content', defaultDescription);
      setMeta('meta[property="og:title"]', 'content', defaultOgTitle);
      setMeta('meta[property="og:description"]', 'content', defaultOgDescription);
      setMeta('meta[property="og:image"]', 'content', defaultOgImage);
      setMeta('meta[name="keywords"]', 'content', defaultKeywords);
    };
  }, [title, description, keywords, ogImage]);
};
