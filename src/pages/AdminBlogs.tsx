import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Star,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { Loader } from '@/components/ui/Loader';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  type Blog,
} from '@/services/api';
import { cn } from '@/lib/utils';

const EMPTY_FORM: Partial<Blog> = {
  title: '',
  category: '',
  excerpt: '',
  content: '',
  featured_image: '',
  status: 'draft',
  featured: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  og_image: '',
};

const AdminBlogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const [blogList, setBlogList] = useState<Blog[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Blog>>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState('');
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  // Load blogs from API
  useEffect(() => {
    const loadBlogs = async () => {
      setIsLoading(true);
      const response = await getBlogs();
      if (response.success && response.data) {
        setBlogList(response.data);
      } else {
        toast.error(response.message || 'Failed to load blogs');
      }
      setIsLoading(false);
    };

    loadBlogs();
  }, []);

  // Load blog for editing
  useEffect(() => {
    if (isEditing && id) {
      const blog = blogList.find(b => b.id === id);
      if (blog) {
        setFormData(blog);
        setImagePreview(blog.featured_image || '');
        setImageFile(null);
        setOgImagePreview(blog.og_image || '');
        setOgImageFile(null);
      } else if (!isLoading && blogList.length > 0) {
        toast.error('Blog not found');
        navigate('/admin/blogs');
      }
    }
  }, [id, isEditing, blogList, isLoading, navigate]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleOgImageUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setOgImagePreview(reader.result as string);
      setOgImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImagePreview('');
    setImageFile(null);
    setOgImagePreview('');
    setOgImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.trim() === '') {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content || formData.content.trim() === '' || formData.content === '<p><br></p>') {
      toast.error('Please write some content');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title!.trim(),
        content: formData.content!,
        category: formData.category || '',
        excerpt: formData.excerpt || '',
        status: formData.status || 'draft',
        featured: formData.featured || false,
        seo_title: formData.seo_title || '',
        seo_description: formData.seo_description || '',
        seo_keywords: formData.seo_keywords || '',
        featured_image: imageFile || (imagePreview || undefined),
        og_image: ogImageFile || (ogImagePreview || undefined),
      };

      const response = isEditing && id
        ? await updateBlog(id, payload)
        : await createBlog(payload);

      if (response.success && response.data) {
        setBlogList(prev =>
          isEditing
            ? prev.map(b => (b.id === id ? response.data! : b))
            : [response.data!, ...prev]
        );
        toast.success(response.message || `Blog ${isEditing ? 'updated' : 'created'} successfully`);
        setIsFormOpen(false);
        resetForm();
        navigate('/admin/blogs');
      } else {
        toast.error(response.message || `Failed to ${isEditing ? 'update' : 'create'} blog`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    const blog = blogList.find(b => b.id === blogId);
    if (!confirm(`Are you sure you want to delete "${blog?.title}"?`)) return;

    const response = await deleteBlog(blogId);
    if (response.success) {
      setBlogList(prev => prev.filter(b => b.id !== blogId));
      toast.success(response.message || 'Blog deleted successfully');
    } else {
      toast.error(response.message || 'Failed to delete blog');
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    const nextStatus = blog.status === 'published' ? 'draft' : 'published';
    setIsTogglingId(blog.id);
    const response = await updateBlog(blog.id, { status: nextStatus });
    if (response.success && response.data) {
      setBlogList(prev => prev.map(b => (b.id === blog.id ? response.data! : b)));
      toast.success(nextStatus === 'published' ? 'Blog published' : 'Blog unpublished');
    } else {
      toast.error(response.message || 'Failed to update blog status');
    }
    setIsTogglingId(null);
  };

  const handleToggleFeatured = async (blog: Blog) => {
    setIsTogglingId(blog.id);
    const response = await updateBlog(blog.id, { featured: !blog.featured });
    if (response.success && response.data) {
      setBlogList(prev => prev.map(b => (b.id === blog.id ? response.data! : b)));
      toast.success(response.data.featured ? 'Marked as featured' : 'Removed from featured');
    } else {
      toast.error(response.message || 'Failed to update blog');
    }
    setIsTogglingId(null);
  };

  const handleEdit = (blog: Blog) => {
    navigate(`/admin/blogs/${blog.id}`);
    setIsFormOpen(true);
  };

  const handleNewBlog = () => {
    navigate('/admin/blogs');
    setIsFormOpen(true);
    resetForm();
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                BLOG <span className="text-primary">MANAGEMENT</span>
              </h1>
              <p className="text-muted-foreground">
                {isFormOpen ? (isEditing ? 'Edit Blog Post' : 'Create New Blog Post') : 'Write and manage blog posts. Featured, published posts show on the homepage.'}
              </p>
            </div>
            {!isFormOpen && (
              <CyberButton size="md" glowColor="cyan" onClick={handleNewBlog}>
                <Plus className="w-4 h-4 mr-2" />
                NEW POST
              </CyberButton>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NeonCard className="p-8" glowColor="cyan" hover={false}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Post details */}
                  <div>
                    <h2 className="font-orbitron text-xl font-bold mb-4">POST DETAILS</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., How to Choose the Right Gaming PC for Your Budget"
                          required
                          className="w-full"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category Tag</Label>
                          <Input
                            id="category"
                            value={formData.category || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g., Buying Guide, News, Tips"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status || 'draft'}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'published' | 'draft' }))}
                          >
                            <SelectTrigger id="status" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={formData.excerpt || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                          placeholder="A short summary shown on blog cards and listing pages."
                          rows={2}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label>Featured Image</Label>
                        <div className="mt-2">
                          {imagePreview ? (
                            <div className="relative aspect-video border-2 border-border rounded-lg overflow-hidden group">
                              <img src={imagePreview} alt="Featured preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <motion.button
                                  type="button"
                                  onClick={() => { setImagePreview(''); setImageFile(null); }}
                                  className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">Upload Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                          <Input
                            type="url"
                            placeholder="Or enter image URL"
                            value={imagePreview}
                            onChange={(e) => { setImagePreview(e.target.value); setImageFile(null); }}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Content *</Label>
                        <div className="mt-2">
                          <RichTextEditor
                            value={formData.content || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                            placeholder="Write the post..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <p className="font-rajdhani font-semibold flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary" />
                            Featured on Homepage
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Featured + published posts appear in the homepage blog section.
                          </p>
                        </div>
                        <Switch
                          checked={!!formData.featured}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-orbitron text-xl font-bold mb-1">SEO</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Controls how this post appears in search results and social shares. Leave blank to fall back to the title/excerpt/featured image.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="seo_title">SEO Title</Label>
                        <Input
                          id="seo_title"
                          value={formData.seo_title || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                          placeholder="Shown as the page title / search result headline"
                          maxLength={70}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">{(formData.seo_title || '').length}/70</p>
                      </div>

                      <div>
                        <Label htmlFor="seo_description">SEO Description</Label>
                        <Textarea
                          id="seo_description"
                          value={formData.seo_description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                          placeholder="Shown as the search-result snippet and social share caption"
                          rows={2}
                          maxLength={160}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">{(formData.seo_description || '').length}/160</p>
                      </div>

                      <div>
                        <Label htmlFor="seo_keywords">SEO Keywords</Label>
                        <Input
                          id="seo_keywords"
                          value={formData.seo_keywords || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                          placeholder="comma, separated, keywords"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label>Social Share Image (og:image)</Label>
                        <div className="mt-2">
                          {ogImagePreview ? (
                            <div className="relative aspect-[1.91/1] border-2 border-border rounded-lg overflow-hidden group max-w-md">
                              <img src={ogImagePreview} alt="OG preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <motion.button
                                  type="button"
                                  onClick={() => { setOgImagePreview(''); setOgImageFile(null); }}
                                  className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-32 max-w-md border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">Upload Image (falls back to featured image)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleOgImageUpload(e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                          <Input
                            type="url"
                            placeholder="Or enter image URL"
                            value={ogImagePreview}
                            onChange={(e) => { setOgImagePreview(e.target.value); setOgImageFile(null); }}
                            className="mt-2 max-w-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader size="sm" label="Saving..." />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {isEditing ? 'UPDATE POST' : 'CREATE POST'}
                        </span>
                      )}
                    </CyberButton>
                    <CyberButton
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => { setIsFormOpen(false); navigate('/admin/blogs'); }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      CANCEL
                    </CyberButton>
                  </div>
                </form>
              </NeonCard>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {isLoading ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Loader label="Loading blogs..." />
                </NeonCard>
              ) : blogList.length === 0 ? (
                <NeonCard className="p-12 text-center" glowColor="cyan" hover={false}>
                  <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-orbitron text-xl font-bold mb-2">No Blog Posts</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by writing your first post
                  </p>
                  <CyberButton onClick={handleNewBlog} glowColor="cyan">
                    <Plus className="w-4 h-4 mr-2" />
                    WRITE FIRST POST
                  </CyberButton>
                </NeonCard>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogList.map((blog, index) => (
                    <motion.div
                      key={blog.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NeonCard className="p-6" glowColor="cyan" hover={false}>
                        {blog.featured_image ? (
                          <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-4">
                            <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center mb-4">
                            <Newspaper className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-rajdhani font-semibold text-lg truncate">
                              {blog.title}
                            </h3>
                            {blog.category && (
                              <p className="text-xs text-primary mt-0.5">{blog.category}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={cn(
                              "px-2 py-1 text-xs rounded whitespace-nowrap",
                              blog.status === 'published'
                                ? "bg-green-500/10 text-green-500"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {blog.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                            {blog.featured && (
                              <span className="px-2 py-1 text-xs rounded whitespace-nowrap bg-primary/10 text-primary flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <CyberButton
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(blog)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            EDIT
                          </CyberButton>
                          <motion.button
                            onClick={() => handleToggleFeatured(blog)}
                            disabled={isTogglingId === blog.id}
                            className={cn(
                              "p-2 rounded-lg border transition-colors disabled:opacity-50",
                              blog.featured
                                ? "border-primary text-primary bg-primary/10"
                                : "border-border text-foreground hover:bg-muted"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={blog.featured ? 'Remove from featured' : 'Mark as featured'}
                          >
                            <Star className={cn("w-4 h-4", blog.featured && "fill-current")} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleToggleStatus(blog)}
                            disabled={isTogglingId === blog.id}
                            className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {blog.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(blog.id)}
                            className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
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

export default AdminBlogsPage;
