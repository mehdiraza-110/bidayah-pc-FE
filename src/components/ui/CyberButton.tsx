import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CyberButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** @deprecated kept for backward compatibility, no longer changes appearance */
  glowColor?: 'cyan' | 'purple' | 'green';
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', onMouseEnter, onMouseLeave, ...props }, ref) => {
    const [sweep, setSweep] = useState<{ active: boolean; origin: 'left' | 'right' }>({
      active: false,
      origin: 'left',
    });

    const sideFromEvent = (e: React.MouseEvent<HTMLButtonElement>): 'left' | 'right' => {
      const rect = e.currentTarget.getBoundingClientRect();
      return e.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
    };

    const baseStyles = "relative inline-flex items-center justify-center font-orbitron font-semibold uppercase tracking-wider overflow-hidden transition-colors duration-300 rounded-md";

    const variants = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border-2 border-primary bg-transparent text-primary hover:text-primary-foreground",
      ghost: "bg-transparent text-primary hover:text-primary-foreground",
    };

    const sweepFill = {
      primary: "bg-foreground/10",
      secondary: "bg-foreground/10",
      outline: "bg-primary",
      ghost: "bg-primary/80",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={(e) => {
          setSweep({ active: true, origin: sideFromEvent(e) });
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setSweep({ active: false, origin: sideFromEvent(e) });
          onMouseLeave?.(e);
        }}
        {...props}
      >
        <motion.span
          aria-hidden
          className={cn("absolute inset-0", sweepFill[variant])}
          style={{ transformOrigin: sweep.origin === 'left' ? '0% 50%' : '100% 50%' }}
          initial={false}
          animate={{ scaleX: sweep.active ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap [&_svg]:shrink-0">
          {children}
        </span>
      </motion.button>
    );
  }
);

CyberButton.displayName = 'CyberButton';

export { CyberButton };
