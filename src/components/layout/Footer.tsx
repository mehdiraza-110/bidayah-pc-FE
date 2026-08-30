import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MapPin } from 'lucide-react';
import { getPublicCategories, type Category } from '@/services/api';
import { TwitterIcon, InstagramIcon, YouTubeIcon, TwitchIcon } from '@/components/icons/SocialIcons';
import { sortByCategoryPriority } from '@/lib/categoryPriority';

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getPublicCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Convert categories to footer links format — core PC-build components
  // first (CPU, GPU, Motherboard, ...), same priority order used elsewhere
  // (homepage tabs, product filters), so unrelated/miscellaneous categories
  // never crowd out the ones customers actually expect here. Limited to top
  // 5 to keep the footer compact.
  const productLinks = sortByCategoryPriority(categories).slice(0, 5).map(category => ({
    name: category.category_name,
    path: `/products?category_id=${category.id}`,
  }));

  const footerLinks = {
    products: productLinks,
    support: [
      { name: 'Contact Us', path: '#' },
      { name: 'FAQ', path: '#' },
      { name: 'Warranty', path: '#' },
      { name: 'Returns', path: '#' },
    ],
    company: [
      { name: 'Blog', path: '/blog' },
      { name: 'About Us', path: '#' },
      { name: 'Careers', path: '#' },
      { name: 'Press', path: '#' },
      { name: 'Partners', path: '#' },
    ],
  };

  const socialLinks = [
    { icon: TwitterIcon, href: '#', label: 'Twitter' },
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: YouTubeIcon, href: '#', label: 'YouTube' },
    { icon: TwitchIcon, href: '#', label: 'Twitch' },
  ];

  return (
    <footer className="relative bg-card border-t border-neon-cyan/20 overflow-hidden">
      {/* Animated border glow */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src="/Bidayah-New.png" alt="Bidayah PC" className="h-14 w-14 object-contain" />
              <span className="font-brand text-2xl font-bold tracking-wide">
                BIDAYAH<span className="text-primary"> PC</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Custom gaming PCs and genuine hardware, hand-built and backed by a 3-year warranty on every system.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-all border border-transparent hover:border-primary/30 hover:bg-muted/70"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-orbitron text-sm font-bold uppercase tracking-wider text-primary mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-muted-foreground hover:text-foreground transition-colors relative group"
                    >
                      <span>{link.name}</span>
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-8 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>support@bidayahpc.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>United Arab Emirates</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-mono-tech">
            © 2026 Bidayah PC. All rights reserved.
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial-cyan opacity-10 blur-3xl pointer-events-none" />
    </footer>
  );
};

export default Footer;
