import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const GridBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lines = containerRef.current.querySelectorAll('.grid-line');
    
    lines.forEach((line, i) => {
      gsap.fromTo(line, 
        { opacity: 0.05 },
        {
          opacity: 0.15,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2,
          ease: 'sine.inOut',
        }
      );
    });

    return () => {
      lines.forEach((line) => gsap.killTweensOf(line));
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* Horizontal lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`h-${i}`}
          className="grid-line absolute left-0 right-0 h-px bg-neon-cyan/10"
          style={{ top: `${(i + 1) * 5}%` }}
        />
      ))}
      
      {/* Vertical lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="grid-line absolute top-0 bottom-0 w-px bg-neon-cyan/10"
          style={{ left: `${(i + 1) * 5}%` }}
        />
      ))}
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
    </div>
  );
};

export { GridBackground };
