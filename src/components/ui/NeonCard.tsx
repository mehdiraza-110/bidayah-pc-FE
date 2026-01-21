import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'green' | 'rgb';
  hover?: boolean;
}

const NeonCard: React.FC<NeonCardProps> = ({ 
  children, 
  className,
  glowColor = 'cyan',
  hover = true 
}) => {
  const glowStyles = {
    cyan: "hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.3)]",
    purple: "hover:shadow-[0_0_30px_hsl(var(--neon-purple)/0.3)]",
    green: "hover:shadow-[0_0_30px_hsl(var(--neon-green)/0.3)]",
    rgb: "rgb-border",
  };

  const borderStyles = {
    cyan: "border-neon-cyan/30 hover:border-neon-cyan",
    purple: "border-neon-purple/30 hover:border-neon-purple",
    green: "border-neon-green/30 hover:border-neon-green",
    rgb: "border-transparent",
  };

  return (
    <motion.div 
      className={cn(
        "relative bg-card border rounded-lg overflow-hidden transition-all duration-300",
        hover && glowColor !== 'rgb' && borderStyles[glowColor],
        hover && glowStyles[glowColor],
        !hover && "border-border",
        className
      )}
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export { NeonCard };
