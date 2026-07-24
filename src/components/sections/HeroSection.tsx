import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CyberButton } from '@/components/ui/CyberButton';
import { getPublicHeroMedia, getPublicHeroContent, type HeroMediaItem, type HeroContent } from '@/services/api';
import heroImage from '@/assets/hero-gaming-pc.jpg';

gsap.registerPlugin(ScrollTrigger);

// Shown until the admin configures hero media/content, or if either fetch fails.
const FALLBACK_SLIDE: HeroMediaItem = {
  id: 'fallback',
  index: 0,
  type: 'image',
  url: heroImage,
};

const FALLBACK_CONTENT: HeroContent = {
  mode: 'single',
  headline_line_1: 'Gaming PCs,',
  headline_line_2: 'Built To Win.',
  subtext: 'Hand-built rigs with real component transparency and a 3-year warranty. Configure your own build or shop ready-to-ship systems today.',
  button_1_text: 'Shop Gaming PCs',
  button_1_link: '/products',
  button_2_text: 'Start Custom Build',
  button_2_link: '/pc-builder',
};

// Hero button links are admin-editable and may be internal paths or full URLs.
const HeroLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  if (/^https?:\/\//i.test(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link to={to}>{children}</Link>;
};

const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [heroMedia, setHeroMedia] = useState<HeroMediaItem[]>([FALLBACK_SLIDE]);
  const [heroContent, setHeroContent] = useState<HeroContent>(FALLBACK_CONTENT);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    const loadHero = async () => {
      const [mediaResponse, contentResponse] = await Promise.all([
        getPublicHeroMedia(),
        getPublicHeroContent(),
      ]);

      if (mediaResponse.success && mediaResponse.data && mediaResponse.data.length > 0) {
        setHeroMedia(mediaResponse.data.sort((a, b) => a.index - b.index));
      }

      if (contentResponse.success && contentResponse.data) {
        setHeroContent(contentResponse.data);
      }
    };

    loadHero();
  }, []);

  // In "single" mode we only ever show the first configured slide as a
  // static background — no cycling, no arrows/dots — even if more slides
  // happen to be stored from a previous slideshow configuration.
  const isSlideshow = heroContent.mode === 'slideshow';
  const activeSlides = isSlideshow ? heroMedia : heroMedia.slice(0, 1);

  useEffect(() => {
    if (isSlideshow && activeSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % activeSlides.length);
      }, 5000);

      return () => clearInterval(interval);
    }
    setCurrentMediaIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSlideshow, activeSlides.length]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'center center',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isSlideshow]);

  const nextMedia = () => setCurrentMediaIndex((prev) => (prev + 1) % activeSlides.length);
  const previousMedia = () => setCurrentMediaIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  const activeMedia = activeSlides[currentMediaIndex] || FALLBACK_SLIDE;
  const showSlideControls = isSlideshow && activeSlides.length > 1;

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden min-h-[calc(100dvh-208px)] md:min-h-[calc(100dvh-188px)] flex items-center"
    >
      {/* Full-bleed slider background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {activeMedia.type === 'image' ? (
            <motion.img
              key={activeMedia.id || currentMediaIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              src={activeMedia.url}
              alt={`Bidayah PC promotion ${currentMediaIndex + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <motion.video
              key={activeMedia.id || currentMediaIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              src={activeMedia.url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </AnimatePresence>

        {/* Legibility scrim so the copy reads over any slide — only needed when text is shown */}
        {!isSlideshow && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
          </>
        )}
      </div>

      {/* Slide arrows, anchored to the section edges */}
      {showSlideControls && (
        <>
          <button
            onClick={previousMedia}
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/50 text-foreground backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary md:left-6"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextMedia}
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/50 text-foreground backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary md:right-6"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentMediaIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Content — hidden in slideshow mode so only the images/videos show */}
      {!isSlideshow && (
      <div ref={contentRef} className="container relative z-10 mx-auto px-4">
        <div className="max-w-xl text-center md:text-left">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-6 h-1 w-16 origin-left rounded-full bg-primary md:mx-0"
          />

          <h1 className="font-orbitron text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl overflow-hidden">
            {[heroContent.headline_line_1, heroContent.headline_line_2].filter(Boolean).map((line, i) => (
              <motion.span
                key={`${line}-${i}`}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={i === 1 ? 'block text-primary' : 'block'}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-6 max-w-md text-lg text-muted-foreground md:mx-0"
          >
            {heroContent.subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="mt-9 flex flex-col items-center gap-4 sm:flex-row md:justify-start"
          >
            <HeroLink to={heroContent.button_1_link}>
              <CyberButton size="lg">
                {heroContent.button_1_text}
              </CyberButton>
            </HeroLink>
            <HeroLink to={heroContent.button_2_link}>
              <CyberButton variant="outline" size="lg">
                {heroContent.button_2_text}
              </CyberButton>
            </HeroLink>
          </motion.div>
        </div>
      </div>
      )}
    </section>
  );
};

export default HeroSection;
