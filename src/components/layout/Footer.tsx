import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getPublicCategories, getPublicSiteSettings, type Category } from '@/services/api';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { InstagramIcon, YouTubeIcon, TikTokIcon, XIcon, ThreadsIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { sortByCategoryPriority } from '@/lib/categoryPriority';

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  // Same number as the WhatsApp chat button — managed in Admin → Settings.
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

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

    getPublicSiteSettings().then((response) => {
      if (response.success && response.data?.whatsapp_number) {
        setPhoneNumber(response.data.whatsapp_number);
      }
    });
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
      { name: 'Contact Us', path: '/contact' },
      { name: 'FAQ', path: '/faq' },
      { name: 'Warranty', path: '/warranty' },
      { name: 'Returns', path: '/returns' },
    ],
    company: [
      { name: 'Blog', path: '/blog' },
      { name: 'News', path: '/news' },
      { name: 'About Us', path: '/about' },
      { name: 'Our Team', path: '/our-team' },
    ],
  };

  const socialLinks = [
    { icon: TikTokIcon, href: 'https://www.tiktok.com/@mr.freepc.guy?_r=1&_t=ZS-99W3KduncG5', label: 'TikTok' },
    { icon: YouTubeIcon, href: 'https://www.youtube.com/@bidayahpc', label: 'YouTube' },
    { icon: InstagramIcon, href: 'https://www.instagram.com/bidayahpc?stkn=MTljeGtpa2ZsZ3N6cQ%3D%3D&utm_source=qr', label: 'Instagram' },
    { icon: XIcon, href: 'https://x.com/sultan_fraz?s=11', label: 'X' },
    { icon: ThreadsIcon, href: 'https://www.threads.com/@bidayahpc?igshid=NTc4MTIwNjQ2YQ==', label: 'Threads' },
    { icon: FacebookIcon, href: 'https://www.facebook.com/share/1Efs7ct9PA/?mibextid=wwXIfr', label: 'Facebook' },
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src="/Bidayah-New.png" alt="Bidayah PC" className="h-14 w-14 object-contain" />
              <span className="font-brand text-2xl font-bold tracking-wide">
                BIDAYAH<span className="text-primary"> PC</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Custom gaming PCs and genuine hardware, hand-built and backed by a 1-year warranty on every system.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
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
            {phoneNumber && (
              <div className="flex items-center gap-3">
                <a
                  href={`tel:+${phoneNumber.replace(/[^0-9]/g, '')}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span dir="ltr">{phoneNumber}</span>
                </a>
                <a
                  href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
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
