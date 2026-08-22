import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { getPublicSiteSettings } from '@/services/api';

const WhatsAppWidget: React.FC = () => {
  const location = useLocation();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    getPublicSiteSettings().then((response) => {
      if (response.success && response.data?.whatsapp_number) {
        setWhatsappNumber(response.data.whatsapp_number);
      }
    });
  }, []);

  // Storefront only — not on admin pages.
  if (location.pathname.startsWith('/admin')) return null;
  if (!whatsappNumber) return null;

  const href = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center group"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-card text-sm shadow-lg border border-border pl-4 pr-8 py-3 -mr-6 transition-transform group-hover:-translate-x-1">
        <span className="text-muted-foreground">Need Help?</span>
        <span className="font-bold text-foreground">Chat with us</span>
      </span>
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform group-hover:scale-105">
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
        <WhatsAppIcon className="relative h-7 w-7" />
      </span>
    </a>
  );
};

export { WhatsAppWidget };
