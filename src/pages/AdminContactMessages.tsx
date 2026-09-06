import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Mail, MailOpen, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import {
  getContactMessages,
  setContactMessageRead,
  deleteContactMessage,
  type ContactMessage,
} from '@/services/api';
import { cn } from '@/lib/utils';

const AdminContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    const response = await getContactMessages();
    if (response.success && response.data) {
      setMessages(response.data);
    } else {
      toast.error(response.message || 'Failed to load contact messages');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleToggleRead = async (msg: ContactMessage) => {
    const nextRead = !msg.is_read;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: nextRead } : m)));
    const response = await setContactMessageRead(msg.id, nextRead);
    if (!response.success) {
      toast.error(response.message || 'Failed to update message');
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: !nextRead } : m)));
    }
  };

  const handleDelete = async (msg: ContactMessage) => {
    if (!confirm(`Delete the message from "${msg.name}"? This can't be undone.`)) return;

    setDeletingId(msg.id);
    const response = await deleteContactMessage(msg.id);
    if (response.success) {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      toast.success(response.message || 'Message deleted');
    } else {
      toast.error(response.message || 'Failed to delete message');
    }
    setDeletingId(null);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const totalPages = Math.max(1, Math.ceil(messages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedMessages = messages.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(messages.length / itemsPerPage));
    if (currentPage > lastPage) setCurrentPage(lastPage);
  }, [messages, currentPage]);

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            CONTACT <span className="text-primary">MESSAGES</span>
          </h1>
          <p className="text-muted-foreground">
            Submissions from the storefront's "Contact Us" page.
            {unreadCount > 0 && ` ${unreadCount} unread.`}
          </p>
        </div>

        {isLoading ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <Loader label="Loading messages..." />
          </NeonCard>
        ) : messages.length === 0 ? (
          <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-orbitron text-xl font-bold mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground">
              Contact form submissions will show up here.
            </p>
          </NeonCard>
        ) : (
          <div className="space-y-3">
            {pagedMessages.map((msg) => (
              <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <NeonCard
                  className={cn('p-5', !msg.is_read && 'border-primary/40')}
                  glowColor="cyan"
                  hover={false}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {!msg.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />
                        )}
                        <p className="font-rajdhani font-semibold text-lg">{msg.name}</p>
                        {msg.subject && (
                          <span className="text-sm text-muted-foreground">— {msg.subject}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                          {msg.email}
                        </a>
                        {msg.phone && (
                          <a href={`tel:${msg.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                            {msg.phone}
                          </a>
                        )}
                        {msg.created_at && (
                          <span>{format(new Date(msg.created_at), 'MMM dd, yyyy · h:mm a')}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(msg)}
                        title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                      </button>
                      <motion.button
                        onClick={() => handleDelete(msg)}
                        disabled={deletingId === msg.id}
                        className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <CyberButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </CyberButton>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-10 h-10 rounded-lg border transition-colors',
                        currentPage === page
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <CyberButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </CyberButton>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessagesPage;
