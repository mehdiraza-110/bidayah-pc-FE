import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ParticleFieldProps {
  particleCount?: number;
  colors?: string[];
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  particleCount = 50,
  colors = ['#00ffff', '#8b5cf6', '#00ff00']
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles = particlesRef.current;
    
    particles.forEach((particle, i) => {
      if (!particle) return;
      
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 4 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;

      gsap.set(particle, {
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      });

      gsap.to(particle, {
        y: -200,
        x: (Math.random() - 0.5) * 100,
        opacity: 0,
        duration,
        delay,
        repeat: -1,
        ease: 'none',
        onRepeat: () => {
          gsap.set(particle, {
            left: `${Math.random() * 100}%`,
            top: '100%',
            opacity: Math.random() * 0.5 + 0.3,
          });
        },
      });
    });

    return () => {
      particles.forEach((particle) => {
        if (particle) gsap.killTweensOf(particle);
      });
    };
  }, [colors]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
          className="absolute rounded-full opacity-50"
        />
      ))}
    </div>
  );
};

export { ParticleField };
