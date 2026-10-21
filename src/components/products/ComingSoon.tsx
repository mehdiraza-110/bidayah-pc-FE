import React from 'react';
import { Link } from 'react-router-dom';
import { CyberButton } from '@/components/ui/CyberButton';

// Shown wherever a listing has nothing to show because the range isn't
// stocked yet (e.g. Laptops) — points shoppers to the team for custom orders.
export const ComingSoon: React.FC = () => (
  <div className="py-20 text-center">
    <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono-tech text-primary mb-5">
      NOT AVAILABLE YET
    </span>
    <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mb-4">
      Coming <span className="text-primary">Soon</span>
    </h2>
    <p className="text-muted-foreground text-lg mb-8">You can inquire with our agent for custom order</p>
    <Link to="/contact">
      <CyberButton size="lg">Contact Us</CyberButton>
    </Link>
  </div>
);
