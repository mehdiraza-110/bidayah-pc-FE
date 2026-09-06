import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Users } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Loader } from '@/components/ui/Loader';
import { getPublicTeamBanner, getPublicTeamMembers, type TeamPageBanner, type TeamMember } from '@/services/api';
import { useDocumentSEO } from '@/hooks/useDocumentSEO';

// Ease-out-quint — matches the site's other entrance motion.
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const OurTeamPage: React.FC = () => {
  const [banner, setBanner] = useState<TeamPageBanner | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useDocumentSEO({
    title: 'Our Team | Bidayah PC',
    description: 'Meet the people behind Bidayah PC.',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [bannerResponse, membersResponse] = await Promise.all([
        getPublicTeamBanner(),
        getPublicTeamMembers(),
      ]);

      if (bannerResponse.success && bannerResponse.data) {
        setBanner(bannerResponse.data);
      }
      if (membersResponse.success && membersResponse.data) {
        setMembers(membersResponse.data);
      }
      setIsLoading(false);
    };

    load();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-24 pt-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb — same convention as GamingPcDetail / PcSeriesLanding */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Our Team</span>
          </div>

          {/* Heading — plain text, not overlaid on a photo */}
          <div className="mb-10 max-w-2xl">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground text-balance">
              {banner?.heading || 'Meet Our Team'}
            </h1>
            {banner?.subtext && (
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{banner.subtext}</p>
            )}
          </div>

          {/* Banner photo — a wide landscape crop of the (portrait-shot)
              group photo. Heads and chests are the point; legs below the
              waist are the acceptable trade-off for a proper banner shape,
              so the crop is biased toward the top of the frame.
              Animates in on mount (not scroll-gated): it sits above the
              fold, and a scroll-triggered reveal computed before this async
              image finishes loading is exactly what left it stuck invisible
              before — see the members grid below for the same reasoning. */}
          {banner?.image_url && (
            <motion.figure
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="relative mb-16 aspect-[16/9] overflow-hidden rounded-lg border border-border bg-card"
            >
              <img
                src={banner.image_url}
                alt="The Bidayah PC team"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: '50% 30%' }}
              />
            </motion.figure>
          )}

          {isLoading ? (
            <div className="py-16 text-center">
              <Loader label="Loading team..." />
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Our team page is being set up. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.06 }}
                  className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: '50% 20%' }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="font-orbitron text-base font-bold text-primary truncate">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default OurTeamPage;
