import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getTeamBanner,
  upsertTeamBanner,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
  type TeamMember,
} from '@/services/api';
import { cn } from '@/lib/utils';

const EMPTY_MEMBER_FORM: Partial<TeamMember> & { photoFile?: File | null } = {
  name: '',
  role: '',
  bio: '',
  is_active: true,
};

const AdminTeamPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Banner
  const [bannerHeading, setBannerHeading] = useState('Meet Our Team');
  const [bannerSubtext, setBannerSubtext] = useState('');
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Members
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<TeamMember>>(EMPTY_MEMBER_FORM);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const loadBanner = async () => {
      setIsBannerLoading(true);
      const response = await getTeamBanner();
      if (response.success) {
        if (response.data) {
          setBannerHeading(response.data.heading);
          setBannerSubtext(response.data.subtext || '');
          setBannerImagePreview(response.data.image_url || '');
        }
      } else {
        toast.error(response.message || 'Failed to load banner');
      }
      setIsBannerLoading(false);
    };
    loadBanner();
  }, []);

  const loadMembers = async () => {
    setIsMembersLoading(true);
    const response = await getTeamMembers();
    if (response.success && response.data) {
      setMembers(response.data);
    } else {
      toast.error(response.message || 'Failed to load team members');
    }
    setIsMembersLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleBannerImageUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImagePreview(reader.result as string);
      setBannerImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerHeading.trim()) {
      toast.error('Please enter a heading');
      return;
    }

    setIsSavingBanner(true);
    const response = await upsertTeamBanner({
      heading: bannerHeading.trim(),
      subtext: bannerSubtext.trim() || undefined,
      image: bannerImageFile || (bannerImagePreview || undefined),
    });

    if (response.success) {
      toast.success(response.message || 'Banner saved');
      setBannerImageFile(null);
    } else {
      toast.error(response.message || 'Failed to save banner');
    }
    setIsSavingBanner(false);
  };

  const handlePhotoUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const resetMemberForm = () => {
    setMemberForm(EMPTY_MEMBER_FORM);
    setPhotoPreview('');
    setPhotoFile(null);
    setEditingId(null);
  };

  const handleNewMember = () => {
    resetMemberForm();
    setIsFormOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setMemberForm(member);
    setPhotoPreview(member.photo_url || '');
    setPhotoFile(null);
    setEditingId(member.id);
    setIsFormOpen(true);
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name?.trim() || !memberForm.role?.trim()) {
      toast.error('Please enter a name and role');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: memberForm.name.trim(),
      role: memberForm.role.trim(),
      bio: memberForm.bio || '',
      is_active: memberForm.is_active !== false,
      photo: photoFile || (photoPreview || undefined),
    };

    const response = editingId
      ? await updateTeamMember(editingId, payload)
      : await createTeamMember(payload);

    if (response.success) {
      toast.success(response.message || `Team member ${editingId ? 'updated' : 'added'}`);
      setIsFormOpen(false);
      resetMemberForm();
      loadMembers();
    } else {
      toast.error(response.message || `Failed to ${editingId ? 'update' : 'add'} team member`);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Remove "${member.name}" from the team page?`)) return;

    setDeletingId(member.id);
    const response = await deleteTeamMember(member.id);
    if (response.success) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(response.message || 'Team member removed');
    } else {
      toast.error(response.message || 'Failed to remove team member');
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (member: TeamMember) => {
    setTogglingId(member.id);
    const response = await updateTeamMember(member.id, { is_active: !member.is_active });
    if (response.success && response.data) {
      setMembers((prev) => prev.map((m) => (m.id === member.id ? response.data! : m)));
    } else {
      toast.error(response.message || 'Failed to update team member');
    }
    setTogglingId(null);
  };

  const moveMember = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const reordered = [...members];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setMembers(reordered);
    setIsReordering(true);

    const response = await reorderTeamMembers(reordered.map((m, i) => ({ id: m.id, display_order: i })));
    if (response.success && response.data) {
      setMembers([...response.data].sort((a, b) => a.display_order - b.display_order));
    } else {
      toast.error(response.message || 'Failed to reorder team members');
    }
    setIsReordering(false);
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-2">
            TEAM <span className="text-primary">PAGE</span>
          </h1>
          <p className="text-muted-foreground">
            Manage the "Our Team" page's banner and roster.
          </p>
        </div>

        {/* Banner */}
        <NeonCard className="p-6 sm:p-8 mb-8" glowColor="cyan" hover={false}>
          <h2 className="font-orbitron text-xl font-bold mb-4">PAGE BANNER</h2>
          {isBannerLoading ? (
            <Loader label="Loading banner..." />
          ) : (
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banner-heading">Heading *</Label>
                  <Input
                    id="banner-heading"
                    value={bannerHeading}
                    onChange={(e) => setBannerHeading(e.target.value)}
                    placeholder="Meet Our Team"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="banner-subtext">Subtext</Label>
                  <Input
                    id="banner-subtext"
                    value={bannerSubtext}
                    onChange={(e) => setBannerSubtext(e.target.value)}
                    placeholder="The people behind Bidayah PC"
                  />
                </div>
              </div>

              <div>
                <Label>Banner Image</Label>
                <div className="mt-2">
                  {bannerImagePreview ? (
                    <div className="relative aspect-[3/1] border-2 border-border rounded-lg overflow-hidden group max-w-2xl">
                      <img src={bannerImagePreview} alt="Banner preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => { setBannerImagePreview(''); setBannerImageFile(null); }}
                          className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 max-w-2xl border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload banner image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBannerImageUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                  <Input
                    type="url"
                    placeholder="Or enter image URL"
                    value={bannerImagePreview}
                    onChange={(e) => { setBannerImagePreview(e.target.value); setBannerImageFile(null); }}
                    className="mt-2 max-w-2xl"
                  />
                </div>
              </div>

              <CyberButton type="submit" disabled={isSavingBanner}>
                {isSavingBanner ? (
                  <Loader size="sm" label="Saving..." />
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    SAVE BANNER
                  </span>
                )}
              </CyberButton>
            </form>
          )}
        </NeonCard>

        {/* Team members */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-orbitron text-xl font-bold">TEAM MEMBERS</h2>
          {!isFormOpen && (
            <CyberButton size="md" glowColor="cyan" onClick={handleNewMember}>
              <Plus className="w-4 h-4 mr-2" />
              ADD MEMBER
            </CyberButton>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <NeonCard className="p-6 sm:p-8" glowColor="cyan" hover={false}>
                <form onSubmit={handleSubmitMember} className="space-y-4">
                  <h3 className="font-orbitron text-lg font-bold">
                    {editingId ? 'EDIT TEAM MEMBER' : 'NEW TEAM MEMBER'}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-name">Name *</Label>
                      <Input
                        id="member-name"
                        value={memberForm.name || ''}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="member-role">Role *</Label>
                      <Input
                        id="member-role"
                        value={memberForm.role || ''}
                        onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value }))}
                        placeholder="Founder & CEO"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="member-bio">Bio</Label>
                    <Textarea
                      id="member-bio"
                      value={memberForm.bio || ''}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="A short bio shown on the team page..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Photo</Label>
                    <div className="mt-2">
                      {photoPreview ? (
                        <div className="relative h-32 w-32 border-2 border-border rounded-full overflow-hidden group">
                          <img src={photoPreview} alt="Photo preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <motion.button
                              type="button"
                              onClick={() => { setPhotoPreview(''); setPhotoFile(null); }}
                              className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center px-2">Upload photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      <Input
                        type="url"
                        placeholder="Or enter image URL"
                        value={photoPreview}
                        onChange={(e) => { setPhotoPreview(e.target.value); setPhotoFile(null); }}
                        className="mt-2 max-w-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader size="sm" label="Saving..." />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {editingId ? 'SAVE CHANGES' : 'ADD MEMBER'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => { setIsFormOpen(false); resetMemberForm(); }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      CANCEL
                    </CyberButton>
                  </div>
                </form>
              </NeonCard>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {isMembersLoading ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Loader label="Loading team members..." />
                </NeonCard>
              ) : members.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Team Members Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first team member to show them on the Our Team page
                  </p>
                  <CyberButton onClick={handleNewMember} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    ADD MEMBER
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <motion.div key={member.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <NeonCard className="p-4" glowColor="cyan" hover={false}>
                        <div className="flex items-center gap-4">
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveMember(index, -1)}
                              disabled={index === 0 || isReordering}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-orbitron text-xs font-bold text-primary">{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => moveMember(index, 1)}
                              disabled={index === members.length - 1 || isReordering}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.name} className="h-14 w-14 rounded-full object-cover border border-border shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-full border border-border bg-muted flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-rajdhani font-semibold truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                          </div>

                          <span className={cn(
                            "px-2 py-1 text-xs rounded whitespace-nowrap shrink-0",
                            member.is_active
                              ? "bg-green-500/10 text-green-500"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {member.is_active ? 'Visible' : 'Hidden'}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            <CyberButton size="sm" variant="outline" onClick={() => handleEditMember(member)}>
                              <Edit className="w-4 h-4" />
                            </CyberButton>
                            <motion.button
                              onClick={() => handleToggleActive(member)}
                              disabled={togglingId === member.id}
                              className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              aria-label={member.is_active ? 'Hide from page' : 'Show on page'}
                            >
                              {member.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(member)}
                              disabled={deletingId === member.id}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminTeamPage;
