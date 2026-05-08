"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { updateUserProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

const PROFILE_COMPLETED_KEY = 'codeorbit_profile_completed';

export function ProfileCompletionModal() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
  });

  useEffect(() => {
    // Check if profile completion modal was already shown and completed
    const profileCompleted = localStorage.getItem(PROFILE_COMPLETED_KEY);
    
    // Only show modal if:
    // 1. User exists
    // 2. Profile not completed before (first time)
    // 3. displayName or username is missing/empty
    if (user && !profileCompleted) {
      const needsDisplayName = !user.displayName || user.displayName.trim() === '';
      const needsUsername = !user.username || user.username.trim() === '';
      
      if (needsDisplayName || needsUsername) {
        // Show modal after a short delay
        const timer = setTimeout(() => {
          setOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        // User has both fields filled, mark as completed
        localStorage.setItem(PROFILE_COMPLETED_KEY, 'true');
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.displayName.trim()) {
      toast({
        title: 'Display Name Required',
        description: 'Please enter your display name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.username.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username can only contain letters, numbers, and underscores',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(formData);
      
      // Mark profile as completed in localStorage
      localStorage.setItem(PROFILE_COMPLETED_KEY, 'true');
      
      toast({
        title: 'Profile Completed',
        description: 'Your profile has been set up successfully!',
      });
      
      // Refresh user data
      await refreshUser();
      
      // Close modal
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark as completed even if skipped, so it doesn't show again
    localStorage.setItem(PROFILE_COMPLETED_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing by clicking outside
      if (!newOpen && !loading) {
        handleSkip();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please complete your profile to get started. Display name and username are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear to others
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="Enter a unique username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, and underscores allowed
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.displayName.trim() || !formData.username.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
