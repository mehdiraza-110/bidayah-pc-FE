import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxHeroProps {
  children: React.ReactNode;
  backgroundElement?: React.ReactNode;
  className?: string;
  speed?: number;
}

const ParallaxHero: React.FC<ParallaxHeroProps> = ({
  children,
  backgroundElement,
  className,
  speed = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !bgRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax background
      gsap.to(bgRef.current, {
        yPercent: 30 * speed,
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
        y: -50,
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
  }, [speed]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background layer */}
      <div 
        ref={bgRef}
        className="absolute inset-0 -top-20"
      >
        {backgroundElement}
      </div>

      {/* Content layer */}
      <div 
        ref={contentRef}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

export { ParallaxHero };
