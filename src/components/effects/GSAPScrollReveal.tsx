import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GSAPScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale' | 'stagger';
  duration?: number;
  delay?: number;
  staggerAmount?: number;
  className?: string;
}

const GSAPScrollReveal: React.FC<GSAPScrollRevealProps> = ({
  children,
  animation = 'fadeUp',
  duration = 1,
  delay = 0,
  staggerAmount = 0.1,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const childElements = element.querySelectorAll('.reveal-child');

    const ctx = gsap.context(() => {
      let animProps: gsap.TweenVars = {};

      switch (animation) {
        case 'fadeUp':
          gsap.set(element, { opacity: 0, y: 60 });
          animProps = { opacity: 1, y: 0 };
          break;
        case 'fadeIn':
          gsap.set(element, { opacity: 0 });
          animProps = { opacity: 1 };
          break;
        case 'slideLeft':
          gsap.set(element, { opacity: 0, x: -100 });
          animProps = { opacity: 1, x: 0 };
          break;
        case 'slideRight':
          gsap.set(element, { opacity: 0, x: 100 });
          animProps = { opacity: 1, x: 0 };
          break;
        case 'scale':
          gsap.set(element, { opacity: 0, scale: 0.8 });
          animProps = { opacity: 1, scale: 1 };
          break;
        case 'stagger':
          gsap.set(childElements, { opacity: 0, y: 40 });
          gsap.to(childElements, {
            opacity: 1,
            y: 0,
            duration,
            delay,
            stagger: staggerAmount,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          });
          return;
      }

      gsap.to(element, {
        ...animProps,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [animation, duration, delay, staggerAmount]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export { GSAPScrollReveal };
