"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Github, Linkedin, Globe, Twitter } from 'lucide-react';
import { updateUserProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdated: (profile: any) => void;
}

export function ProfileEditDialog({ open, onOpenChange, profile, onProfileUpdated }: ProfileEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    accountType: 'public',
    socialLinks: {
      github: '',
      linkedin: '',
      portfolio: '',
      twitter: '',
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        accountType: profile.accountType || 'public',
        socialLinks: {
          github: profile.socialLinks?.github || '',
          linkedin: profile.socialLinks?.linkedin || '',
          portfolio: profile.socialLinks?.portfolio || '',
          twitter: profile.socialLinks?.twitter || '',
        },
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username can only contain letters, numbers, and underscores',
        variant: 'destructive',
      });
      return;
    }

    // Validate bio length
    if (formData.bio && formData.bio.length > 500) {
      toast({
        title: 'Bio Too Long',
        description: 'Bio must be 500 characters or less',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const updatedProfile = await updateUserProfile(formData);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      
      // Pass the updated data including displayName
      onProfileUpdated({
        ...updatedProfile.user,
        displayName: formData.displayName,
        username: formData.username,
        bio: formData.bio,
        accountType: formData.accountType,
        socialLinks: formData.socialLinks,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Your display name"
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear across the platform
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="your_username"
              required
            />
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, and underscores allowed
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => setFormData({ ...formData, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.accountType === 'public' 
                ? 'Anyone can follow you instantly' 
                : 'Follow requests require your approval'}
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links</Label>
            
            <div className="space-y-3">
              {/* GitHub */}
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.github}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, github: e.target.value }
                  })}
                  placeholder="https://github.com/username"
                />
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                  })}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* Portfolio */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.portfolio}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, portfolio: e.target.value }
                  })}
                  placeholder="https://yourportfolio.com"
                />
              </div>

              {/* Twitter */}
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                  })}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Cannot be changed)</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
