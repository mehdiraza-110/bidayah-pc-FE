import React from 'react';
import { cn } from '@/lib/utils';

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
}

const GlitchText: React.FC<GlitchTextProps> = ({ 
  children, 
  className,
  as: Component = 'span' 
}) => {
  return (
    <Component 
      className={cn("glitch font-orbitron", className)}
      data-text={children}
    >
      {children}
    </Component>
  );
};

export { GlitchText };
