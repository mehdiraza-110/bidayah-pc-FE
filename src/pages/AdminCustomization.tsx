import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Palette,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Save,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Label } from '@/components/ui/label';
import { ProductMedia } from '@/data/products';
import { cn } from '@/lib/utils';
import { updateHeroMedia, getHeroMedia, type HeroMediaItem } from '@/services/api';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes (per API guide)
const REQUIRED_DIMENSIONS = { width: 1920, height: 1080 };

const AdminCustomizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<(File | null)[]>(Array(7).fill(null));
  const [mediaPreviews, setMediaPreviews] = useState<(ProductMedia | null)[]>(Array(7).fill(null));
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

  useEffect(() => {
    loadHeroMedia();
  }, []);

  const loadHeroMedia = async () => {
    setIsLoading(true);
    try {
      // Note: Using admin endpoint to get hero media (could also use public endpoint)
      // Since we're in admin, we might want to use an admin endpoint if available
      // For now, we'll use a placeholder - you might need to create GET /api/v1/customization/hero-media
      // Or we can use the public endpoint
      const response = await getHeroMedia();
      
      if (response.success && response.data) {
        // Map API response to preview format
        const newPreviews: (ProductMedia | null)[] = Array(7).fill(null);
        response.data.forEach((item) => {
          if (item.index >= 0 && item.index < 7) {
            newPreviews[item.index] = {
              url: item.url,
              type: item.type,
            };
          }
        });
        setMediaPreviews(newPreviews);
      }
    } catch (error) {
      // If endpoint doesn't exist yet, that's okay - user can still create new media
      console.log('Could not load existing hero media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateFile = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        resolve({
          valid: false,
          error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        });
        return;
      }

      // Check if it's an image or video
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        resolve({
          valid: false,
          error: 'Please upload an image or video file',
        });
        return;
      }

      // For images, check dimensions
      if (isImage) {
        const img = new Image();
        img.onload = () => {
          if (img.width !== REQUIRED_DIMENSIONS.width || img.height !== REQUIRED_DIMENSIONS.height) {
            resolve({
              valid: false,
              error: `Image dimensions must be ${REQUIRED_DIMENSIONS.width}x${REQUIRED_DIMENSIONS.height}. Current: ${img.width}x${img.height}`,
            });
          } else {
            resolve({ valid: true });
          }
        };
        img.onerror = () => {
          resolve({
            valid: false,
            error: 'Failed to load image',
          });
        };
        img.src = URL.createObjectURL(file);
      } else {
        // For videos, just check file size (already done)
        resolve({ valid: true });
      }
    });
  };

  const handleMediaUpload = async (index: number, file: File | null) => {
    if (!file) return;

    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    const reader = new FileReader();
    reader.onloadend = () => {
      const newFiles = [...mediaFiles];
      newFiles[index] = file;
      setMediaFiles(newFiles);

      const newPreviews = [...mediaPreviews];
      newPreviews[index] = {
        url: reader.result as string,
        type: isImage ? 'image' : 'video',
      };
      setMediaPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUrlChange = (index: number, url: string, type: 'image' | 'video' = 'image') => {
    const newPreviews = [...mediaPreviews];
    newPreviews[index] = url ? { url, type } : null;
    setMediaPreviews(newPreviews);

    // Clear file if URL is provided
    if (url) {
      const newFiles = [...mediaFiles];
      newFiles[index] = null;
      setMediaFiles(newFiles);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles[index] = null;
    setMediaFiles(newFiles);

    const newPreviews = [...mediaPreviews];
    newPreviews[index] = null;
    setMediaPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build media array with indices
    const mediaArray: Array<{ url?: string | null; type: 'image' | 'video'; index: number }> = [];
    const filesToUpload: Record<string, File> = {};

    mediaPreviews.forEach((preview, index) => {
      if (preview) {
        const mediaItem: { url?: string | null; type: 'image' | 'video'; index: number } = {
          type: preview.type,
          index: index,
        };

        // If there's a file, we'll upload it (url will be null)
        // If there's only a URL (no file), use the URL
        if (mediaFiles[index]) {
          // File upload - URL will be set by backend
          mediaItem.url = null;
          filesToUpload[`media_${index}`] = mediaFiles[index]!;
        } else if (preview.url && preview.url.startsWith('http')) {
          // URL provided - use it directly
          mediaItem.url = preview.url;
        }

        mediaArray.push(mediaItem);
      }
    });

    if (mediaArray.length === 0) {
      toast.error('Please upload at least one media file');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateHeroMedia(mediaArray, Object.keys(filesToUpload).length > 0 ? filesToUpload : undefined);

      if (response.success && response.data) {
        toast.success('Hero section media updated successfully');
        
        // Reload media to get updated URLs
        await loadHeroMedia();
        
        // Clear files after successful upload
        setMediaFiles(Array(7).fill(null));
      } else {
        toast.error('Failed to update hero media', {
          description: response.message || response.error,
        });
      }
    } catch (error) {
      toast.error('Error updating hero media', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6" ref={containerRef}>
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold mb-2">
              CUSTOMIZATION <span className="text-primary">SETTINGS</span>
            </h1>
            <p className="text-muted-foreground">
              Customize the hero section media for the homepage
            </p>
          </div>
        </div>

        <NeonCard className="p-8" glowColor="cyan" hover={false}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Media Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Dimensions: <strong className="text-foreground">{REQUIRED_DIMENSIONS.width}x{REQUIRED_DIMENSIONS.height}px</strong></li>
                  <li>Max file size: <strong className="text-foreground">{MAX_FILE_SIZE / (1024 * 1024)}MB</strong></li>
                  <li>Supported formats: Images (JPG, PNG, WebP) and Videos (MP4, WebM)</li>
                  <li>You can upload up to <strong className="text-foreground">7 media files</strong></li>
                </ul>
              </div>
            </div>

            {/* Hero Media Uploads */}
            <div>
              <h2 className="font-orbitron text-xl font-bold mb-4">HERO SECTION MEDIA (7 max - Images/Videos)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-xs">
                      Media {index + 1}
                    </Label>
                    <div className="relative aspect-video border-2 border-dashed border-border rounded-lg overflow-hidden group">
                      {preview ? (
                        <>
                          {preview.type === 'image' ? (
                            <img
                              src={preview.url}
                              alt={`Hero media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={preview.url}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                            />
                          )}
                          <div className="absolute top-1 right-1">
                            {preview.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-primary" />
                            ) : (
                              <Video className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground text-center px-2">Upload</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMediaUpload(index, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="url"
                        placeholder="Or enter URL"
                        value={preview?.url || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          if (url) {
                            const type = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
                            handleMediaUrlChange(index, url, type);
                          } else {
                            handleRemoveMedia(index);
                          }
                        }}
                        className="flex-1 text-xs h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {preview && (
                        <select
                          value={preview.type}
                          onChange={(e) => {
                            const newPreviews = [...mediaPreviews];
                            if (newPreviews[index]) {
                              newPreviews[index] = {
                                ...newPreviews[index]!,
                                type: e.target.value as 'image' | 'video',
                              };
                              setMediaPreviews(newPreviews);
                            }
                          }}
                          className="text-xs border border-input rounded px-2 bg-background"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      )}
                    </div>
                    {mediaFiles[index] && (
                      <p className="text-xs text-muted-foreground">
                        Size: {(mediaFiles[index]!.size / (1024 * 1024)).toFixed(2)}MB
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <CyberButton type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    SAVING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    SAVE CHANGES
                  </span>
                )}
              </CyberButton>
            </div>
          </form>
          )}
        </NeonCard>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomizationPage;
