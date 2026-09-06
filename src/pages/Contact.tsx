import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ChevronLeft, Mail, MessageSquare, Phone, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContactMessage } from '@/services/api';

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '' };

const ContactPage: React.FC = () => {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        setForm(emptyForm);
      } else {
        toast.error(response.message || 'Failed to send message', {
          description: response.error || 'Please try again',
        });
      }
    } catch (error) {
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-12 pb-16" ref={containerRef}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Contact Us</span>
          </div>

          <div className="mb-8">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-2">
              CONTACT <span className="text-primary">US</span>
            </h1>
            <p className="text-muted-foreground">
              Have a question about a build, an order, or anything else? Send us a message and our team will get back to you.
            </p>
          </div>

          <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
            {isSubmitted ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-orbitron text-xl font-bold mb-2">Message sent</h2>
                <p className="text-muted-foreground mb-6">
                  Thanks for reaching out — our team will get back to you shortly.
                </p>
                <CyberButton variant="outline" onClick={() => setIsSubmitted(false)}>
                  Send another message
                </CyberButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="contact-name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone (optional)
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+971 50 123 4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-subject" className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Subject (optional)
                    </Label>
                    <Input
                      id="contact-subject"
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      placeholder="What's this about?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact-message" className="mb-2">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                  />
                </div>

                <CyberButton type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader size="sm" label="Sending..." />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </CyberButton>
              </form>
            )}
          </NeonCard>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ContactPage;
