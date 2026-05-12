import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CyberButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: 'cyan' | 'purple' | 'green';
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', glowColor = 'cyan', ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-orbitron font-semibold uppercase tracking-wider overflow-hidden transition-all duration-300";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
      ghost: "bg-transparent text-primary hover:bg-primary/10",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    const glowColors = {
      cyan: "hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5),0_0_40px_hsl(var(--neon-cyan)/0.3)]",
      purple: "hover:shadow-[0_0_20px_hsl(var(--neon-purple)/0.5),0_0_40px_hsl(var(--neon-purple)/0.3)]",
      green: "hover:shadow-[0_0_20px_hsl(var(--neon-green)/0.5),0_0_40px_hsl(var(--neon-green)/0.3)]",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowColors[glowColor],
          "clip-path-cyber",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {/* Animated streak */}
        <motion.span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          animate={{ translateX: ['100%', '-100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
        <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
        <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
        <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
        
        <span className="relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap [&_svg]:shrink-0">
          {children}
        </span>
      </motion.button>
    );
  }
);

CyberButton.displayName = 'CyberButton';

export { CyberButton };
