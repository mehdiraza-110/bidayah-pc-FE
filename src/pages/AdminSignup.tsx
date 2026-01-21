import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Lock, Mail, Shield, ArrowRight, Eye, EyeOff, User, Building2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { CyberButton } from '@/components/ui/CyberButton';
import { NeonCard } from '@/components/ui/NeonCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GridBackground } from '@/components/effects/GridBackground';
import { ParticleField } from '@/components/effects/ParticleField';
import { signup, login } from '@/services/api';

const AdminSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && formRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );

        const formElements = formRef.current?.querySelectorAll('.animate-form-item');
        gsap.fromTo(formElements,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare signup data according to API requirements
      const signupData = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        first_name: formData.firstName || undefined,
        last_name: formData.lastName || undefined,
        is_admin_user: true, // Set as admin user
      };

      const response = await signup(signupData);
      
      if (response.success) {
        toast.success('Account created successfully!', {
          description: 'Logging you in...',
        });
        
        // Automatically log in after successful signup
        try {
          const loginResponse = await login({
            email: formData.email,
            password: formData.password,
          });
          
          if (loginResponse.success) {
            toast.success('Welcome!', {
              description: 'Redirecting to admin dashboard...',
            });
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 500);
          } else {
            toast.info('Account created. Please log in.', {
              description: 'Redirecting to login page...',
            });
            setTimeout(() => {
              navigate('/admin/login');
            }, 1500);
          }
        } catch (loginError) {
          toast.info('Account created. Please log in.', {
            description: 'Redirecting to login page...',
          });
          setTimeout(() => {
            navigate('/admin/login');
          }, 1500);
        }
      } else {
        toast.error('Signup failed', {
          description: response.message || response.error || 'Could not create account. Please try again.',
        });
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-12"
      ref={containerRef}
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <GridBackground />
        <ParticleField particleCount={40} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <NeonCard className="p-8" glowColor="purple">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h1 className="font-orbitron text-3xl font-bold mb-2">
                ADMIN <span className="text-secondary">SIGNUP</span>
              </h1>
              <p className="text-muted-foreground">
                Create your admin account
              </p>
            </motion.div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {/* First Name */}
              <div className="animate-form-item">
                <Label htmlFor="firstName" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                  className="w-full"
                />
              </div>

              {/* Last Name */}
              <div className="animate-form-item">
                <Label htmlFor="lastName" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Doe"
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div className="animate-form-item">
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="admin@nexusgear.com"
                  required
                  className="w-full"
                />
              </div>

              {/* Phone */}
              <div className="animate-form-item">
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  required
                  className="w-full"
                />
              </div>

              {/* Organization */}
              <div className="animate-form-item">
                <Label htmlFor="organization" className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  Organization
                </Label>
                <Input
                  id="organization"
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleChange('organization', e.target.value)}
                  placeholder="Nexus Gear Inc."
                  className="w-full"
                />
              </div>

              {/* Password */}
              <div className="animate-form-item">
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="animate-form-item">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="animate-form-item flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 rounded border-border bg-background text-primary focus:ring-primary"
                />
                <span className="text-muted-foreground">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <CyberButton
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  glowColor="purple"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      CREATING ACCOUNT...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      CREATE ACCOUNT
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </CyberButton>
              </motion.div>

              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center pt-4 border-t border-border"
              >
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/admin/login"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Login
                  </Link>
                </p>
              </motion.div>
            </form>
          </NeonCard>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSignupPage;

