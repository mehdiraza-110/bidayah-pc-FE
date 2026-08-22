import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { getPublicFeaturedBlogs, type Blog } from '@/services/api';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

// Homepage "Latest Blogs" grid — only ever shows posts an admin has both
// published AND marked featured (see AdminBlogs). Renders nothing if there
// are none yet, same pattern as FeaturedSection does for products.
const FeaturedBlogsSection: React.FC = () => {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await getPublicFeaturedBlogs(3);
      if (response.success && response.data) {
        setPosts(response.data);
      }
      setIsLoading(false);
    };

    load();
  }, []);

  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <h2 className="font-orbitron text-4xl font-bold text-foreground md:text-5xl">
              Latest <span className="text-primary">Blogs</span>
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Short hardware guides and setup advice for smarter buying decisions.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-rajdhani text-sm font-semibold uppercase tracking-wider text-primary hover:text-foreground"
          >
            View All Posts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    {post.category && (
                      <span className="absolute left-4 top-4 rounded border border-primary/30 bg-primary/10 px-3 py-1 font-mono-tech text-xs text-primary">
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
                    <h3 className="font-orbitron text-xl font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
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
    </section>
  );
};

export default FeaturedBlogsSection;
