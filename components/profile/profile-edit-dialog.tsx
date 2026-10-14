"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Camera, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateUserProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdated: (profile: any) => void;
}

/** Crop to a centred square and shrink to 256px, so the stored photo stays small (about 20 KB). */
async function preparePhoto(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('That image is over 10 MB. Choose a smaller one.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be read."));
      i.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileEditDialog({ open, onOpenChange, profile, onProfileUpdated }: ProfileEditDialogProps) {
  const [loading, setLoading] = useState(false);
  // undefined: unchanged, a data URL: new photo, null: remove it
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
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
      setPhoto(undefined);
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
      const updatedProfile = await updateUserProfile((photo === undefined ? formData : { ...formData, photo }) as any);
      
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
        photoURL: updatedProfile.user?.photoURL ?? (photo === undefined ? profile?.photoURL : photo),
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
      <DialogContent className="max-h-[90vh] gap-6 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="t-display text-3xl">Edit profile</DialogTitle>
          <DialogDescription>
            Update your photo, name and bio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile photo */}
          <div className="flex items-center gap-5">
            <Avatar className="size-20 rounded-full">
              <AvatarImage src={(photo === undefined ? profile?.photoURL : photo) || ''} alt="" className="object-cover" />
              <AvatarFallback className="bg-primary-soft text-xl font-semibold text-primary">
                {(formData.displayName || formData.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Camera /> {(photo === undefined ? profile?.photoURL : photo) ? 'Change photo' : 'Upload photo'}
                </Button>
                {(photo === undefined ? profile?.photoURL : photo) && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                    <Trash2 /> Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Shown on your portfolio, your achievement card and across CodeOrbit. PNG, JPEG or WebP.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Upload a profile photo"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    setPhoto(await preparePhoto(file));
                  } catch (err: any) {
                    toast({ title: "Couldn't use that photo", description: err.message, variant: 'destructive' });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
