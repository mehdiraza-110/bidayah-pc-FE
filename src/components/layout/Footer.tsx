import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Twitter, Instagram, Youtube, Twitch, Mail, MapPin, Phone } from 'lucide-react';
import { getPublicCategories, type Category } from '@/services/api';

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

  // Convert categories to footer links format
  const productLinks = categories.map(category => ({
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
      { name: 'About Us', path: '#' },
      { name: 'Careers', path: '#' },
      { name: 'Press', path: '#' },
      { name: 'Partners', path: '#' },
    ],
    admin: [
      { name: 'Admin Panel', path: '/admin/login' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Twitch, href: '#', label: 'Twitch' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Cpu className="w-8 h-8 text-primary" />
              <span className="font-orbitron text-xl font-bold">
                NEXUS<span className="text-primary">GEAR</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Premium gaming hardware and peripherals for the ultimate competitive edge. 
              Built by gamers, for gamers.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/30"
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
              <span>support@nexusgear.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>1-800-NEXUS-PC</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Los Angeles, CA</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-mono-tech">
            © 2024 NEXUSGEAR. All rights reserved. | 
            <span className="text-primary ml-1">POWER YOUR GAME</span>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-radial-cyan opacity-20 blur-3xl pointer-events-none" />
    </footer>
  );
};

export default Footer;
