import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { Loader } from '@/components/ui/Loader';
import { getPublicBlogs, type Blog as BlogPost } from '@/services/api';
import { useDocumentSEO } from '@/hooks/useDocumentSEO';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useDocumentSEO({
    title: 'Blog | Bidayah PC',
    description: 'Hardware guides, buying advice, and PC building tips from Bidayah PC.',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await getPublicBlogs();
      if (response.success && response.data) {
        setPosts(response.data);
      }
      setIsLoading(false);
    };

    load();
  }, []);

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
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground">
              The <span className="text-primary">Blog</span>
            </h1>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Hardware guides, buying advice, and setup tips.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <Loader label="Loading posts..." />
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No blog posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group overflow-hidden rounded-lg border border-border bg-card"
                >
                  <Link to={`/blog/${post.slug || post.id}`} className="block">
                    <div className="relative h-48 overflow-hidden bg-muted">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Newspaper className="h-10 w-10 text-muted-foreground opacity-40" />
                        </div>
                      )}
                      {post.category && (
                        <span className="absolute left-4 top-4 rounded border border-primary/30 bg-background/80 px-3 py-1 font-mono-tech text-xs text-primary backdrop-blur">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      {post.published_at && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </div>
                      )}
                      <h3 className="font-orbitron text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-5 inline-flex items-center gap-2 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary">
                        Read More
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default BlogPage;
