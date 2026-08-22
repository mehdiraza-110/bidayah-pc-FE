import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { Loader } from '@/components/ui/Loader';
import { getPublicBlogBySlug, type Blog as BlogPost } from '@/services/api';
import { useDocumentSEO } from '@/hooks/useDocumentSEO';
import '@/components/ui/rich-text-editor.css';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setIsLoading(true);
      setNotFound(false);
      const response = await getPublicBlogBySlug(slug);
      if (response.success && response.data) {
        setPost(response.data);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    };

    load();
  }, [slug]);

  // Admin-controlled SEO: falls back to the post's own title/excerpt/image
  // whenever a specific SEO field was left blank.
  useDocumentSEO({
    title: post ? `${post.seo_title || post.title} | Bidayah PC` : undefined,
    description: post?.seo_description || post?.excerpt,
    keywords: post?.seo_keywords,
    ogImage: post?.og_image || post?.featured_image,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="py-24 text-center">
          <Loader label="Loading post..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-orbitron text-2xl font-bold mb-4">Post not found</h1>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 text-primary font-rajdhani font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <CartDrawer />

      <main className="pt-12 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-rajdhani font-semibold uppercase tracking-wider text-primary hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {post.category && (
            <span className="inline-block rounded border border-primary/30 bg-primary/10 px-3 py-1 font-mono-tech text-xs text-primary mb-4">
              {post.category}
            </span>
          )}

          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground mb-4">
            {post.title}
          </h1>

          {post.published_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.published_at)}
            </div>
          )}

          {post.featured_image && (
            <div className="mb-10 overflow-hidden rounded-lg border border-border">
              <img src={post.featured_image} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div
            className="blog-content text-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default BlogDetailPage;
