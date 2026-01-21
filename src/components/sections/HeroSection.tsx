import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, Zap, Shield, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlitchText } from '@/components/ui/GlitchText';
import { CyberButton } from '@/components/ui/CyberButton';
import { ParticleField } from '@/components/effects/ParticleField';
import { GridBackground } from '@/components/effects/GridBackground';
import { getPublicHeroMedia, type HeroMediaItem } from '@/services/api';
import heroImage from '@/assets/hero-gaming-pc.jpg';

gsap.registerPlugin(ScrollTrigger);

const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [heroMedia, setHeroMedia] = useState<HeroMediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHeroMedia();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax effect on hero image
      gsap.to(imageRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Fade out content on scroll
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -100,
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
  }, [heroMedia]);

  useEffect(() => {
    // Auto-rotate through media if there are multiple items
    if (heroMedia.length > 1) {
      const interval = setInterval(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [heroMedia]);

  const loadHeroMedia = async () => {
    setIsLoading(true);
    try {
      const response = await getPublicHeroMedia();
      if (response.success && response.data) {
        // Sort by index to ensure correct order
        const sortedMedia = [...response.data].sort((a, b) => a.index - b.index);
        setHeroMedia(sortedMedia);
      }
    } catch (error) {
      console.error('Error loading hero media:', error);
      // Fallback to static image on error
      setHeroMedia([]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextMedia = () => {
    if (heroMedia.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length);
    }
  };

  const previousMedia = () => {
    if (heroMedia.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + heroMedia.length) % heroMedia.length);
    }
  };

  const stats = [
    { icon: Cpu, value: '500+', label: 'Custom Builds' },
    { icon: Zap, value: '99.9%', label: 'Uptime' },
    { icon: Shield, value: '3yr', label: 'Warranty' },
  ];

  return (
    <section ref={containerRef} className="relative overflow-hidden min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <GridBackground />
        <ParticleField particleCount={60} />
      </div>

      {/* Hero media with parallax */}
      <div 
        ref={imageRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full max-w-[100vw] mx-auto px-0 md:px-0 flex items-center justify-center"
            >
              <img
                src={heroImage}
                alt="Gaming PC"
                className="w-full h-full max-h-[100vh] object-cover drop-shadow-[0_0_100px_hsl(var(--neon-cyan)/0.3)]"
              />
              <div className="absolute inset-0 bg-gradient-radial-cyan opacity-30 blur-3xl" />
            </motion.div>
          ) : heroMedia.length > 0 ? (
            <motion.div
              key={heroMedia[currentMediaIndex]?.id || currentMediaIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="relative w-full h-full max-w-[100vw] mx-auto px-0 md:px-0 flex items-center justify-center"
            >
              {heroMedia[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={heroMedia[currentMediaIndex].url}
                  alt={`Hero media ${currentMediaIndex + 1}`}
                  className="w-full h-full max-h-[100vh] object-cover drop-shadow-[0_0_100px_hsl(var(--neon-cyan)/0.3)]"
                />
              ) : (
                <video
                  src={heroMedia[currentMediaIndex].url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full max-h-[100vh] object-cover drop-shadow-[0_0_100px_hsl(var(--neon-cyan)/0.3)]"
                />
              )}
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-radial-cyan opacity-30 blur-3xl" />
              
              {/* Navigation arrows (if multiple media) */}
              {heroMedia.length > 1 && (
                <>
                  <button
                    onClick={previousMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-background/50 backdrop-blur-sm border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors pointer-events-auto"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-6 h-6 text-primary" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-background/50 backdrop-blur-sm border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors pointer-events-auto"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-6 h-6 text-primary" />
                  </button>
                  
                  {/* Media indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 pointer-events-auto">
                    {heroMedia.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMediaIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentMediaIndex
                            ? 'w-8 bg-primary'
                            : 'w-2 bg-muted-foreground/50 hover:bg-muted-foreground'
                        }`}
                        aria-label={`Go to media ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="relative w-full h-full max-w-[100vw] mx-auto px-0 md:px-0 flex items-center justify-center"
            >
              <img
                src={heroImage}
                alt="Gaming PC"
                className="w-full h-full max-h-[100vh] object-cover drop-shadow-[0_0_100px_hsl(var(--neon-cyan)/0.3)]"
              />
              <div className="absolute inset-0 bg-gradient-radial-cyan opacity-30 blur-3xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 mt-20 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-4"
        >
          <span className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full font-mono-tech text-sm text-primary">
            [ NEXT-GEN GAMING HARDWARE ]
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <GlitchText
            as="h1"
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-2"
          >
            POWER YOUR
          </GlitchText>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-bold tracking-tight text-primary text-glow-cyan">
            GAME
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-rajdhani"
        >
          Premium gaming PCs and peripherals engineered for victory. 
          Dominate every frame.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/products">
            <CyberButton size="lg" glowColor="cyan">
              SHOP NOW
            </CyberButton>
          </Link>
          <Link to="/products?category=Gaming+PC">
            <CyberButton variant="outline" size="lg" glowColor="purple">
              EXPLORE BUILDS
            </CyberButton>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="font-orbitron text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-mono-tech">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-mono-tech tracking-widest">SCROLL</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
