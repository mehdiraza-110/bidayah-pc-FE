import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // Get message and order number from URL params
  const message = searchParams.get('message') || 'Thank you for your order!';
  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    if (containerRef.current && iconRef.current) {
      const ctx = gsap.context(() => {
        // Animate container
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );

        // Animate check icon
        gsap.fromTo(
          iconRef.current,
          { scale: 0, rotation: -180 },
          { 
            scale: 1, 
            rotation: 0, 
            duration: 0.6, 
            ease: 'back.out(1.7)',
            delay: 0.2
          }
        );

        // Pulse animation for icon
        gsap.to(iconRef.current, {
          scale: 1.1,
          duration: 0.5,
          repeat: 1,
          yoyo: true,
          ease: 'power2.inOut',
          delay: 0.8
        });
      });

      return () => ctx.revert();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <Navbar />

      <main className="pt-12 pb-16 min-h-screen flex items-center justify-center px-4" ref={containerRef}>
        <div className="max-w-2xl w-full">
          <NeonCard className="p-8 md:p-12 text-center" glowColor="green" hover={false}>
            {/* Success Icon */}
            <div ref={iconRef} className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="w-24 h-24 text-primary relative z-10" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-orbitron text-3xl md:text-4xl font-bold mb-4 text-foreground"
            >
              Thank You!
            </motion.h1>

            {/* Order Number */}
            {orderNumber && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-4"
              >
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <p className="text-2xl font-orbitron font-bold text-primary">{orderNumber}</p>
              </motion.div>
            )}

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
            >
              {message}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <CyberButton
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto"
              >
                <Home className="w-4 h-4 mr-2" />
                Continue Shopping
              </CyberButton>
              <CyberButton
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </CyberButton>
            </motion.div>
          </NeonCard>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ThankYouPage;
