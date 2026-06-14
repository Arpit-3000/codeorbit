"use client";

import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Shield, ExternalLink, Code2, Trophy, GitBranch, Activity, Edit } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/api';
import { ProfileEditDialog } from '@/components/profile/profile-edit-dialog';

function ProfileContent() {
  const { user: authUser, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if coming from GitHub OAuth callback
        const shouldRefresh = searchParams.get('refresh');
        if (shouldRefresh === 'true') {
          console.log('[PROFILE] Refreshing user data after GitHub connection');
          await refreshUser();
        }
        
        const data = await getCurrentUserProfile();
        console.log("Profile data:", data);
        setProfile(data);
      } catch (err: any) {
        console.error("Failed to fetch profile", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [searchParams]);

  const handleProfileUpdated = (updatedProfile: any) => {
    setProfile({ ...profile, ...updatedProfile });
    setEditDialogOpen(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-sm text-destructive">Error: {error}</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your account settings and connected platforms</p>
            </div>
            <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.photoURL || ""} alt="Profile picture" />
                      <AvatarFallback className="text-lg">
                        {profile ? getInitials(profile.displayName, profile.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">
                        {profile?.displayName || 'No display name'}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {profile?.email}
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {profile?.provider === 'google' ? 'Google Account' : 'Local Account'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Account Details</h4>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono text-xs">{profile?.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="capitalize">{profile?.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Display Name:</span>
                        <span>{profile?.displayName || 'Not set'}</span>
                      </div>
                      {profile?.username && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Username:</span>
                          <span>@{profile.username}</span>
                        </div>
                      )}
                      {profile?.bio && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Bio:</span>
                          <span className="text-sm">{profile.bio}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Type:</span>
                        <Badge variant={profile?.accountType === 'public' ? 'default' : 'secondary'}>
                          {profile?.accountType || 'Public'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Synced:</span>
                        <span>{profile?.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {profile?.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Social Links</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.socialLinks.github && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                                <GitBranch className="h-4 w-4 mr-2" />
                                GitHub
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          )}
                          {profile.socialLinks.linkedin && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                LinkedIn
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          )}
                          {profile.socialLinks.portfolio && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Portfolio
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          )}
                          {profile.socialLinks.twitter && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Twitter
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity & Social Stats
                  </CardTitle>
                  <CardDescription>Your coding activity and social connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.stats?.activeDays || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Days</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.stats?.consistencyScore || 0}%</div>
                      <div className="text-sm text-muted-foreground">Consistency</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.followers?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.following?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connected Platforms */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>Your linked coding platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.platforms?.leetcode ? (
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-warning" />
                          <div className="font-medium">LeetCode</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.platforms.leetcode.username}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Solved</div>
                          <div className="font-semibold">{profile.platforms.leetcode.totalSolved}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-semibold">{profile.platforms.leetcode.contestRating || 0}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      LeetCode not connected
                    </div>
                  )}

                  {profile?.platforms?.codeforces ? (
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <div className="font-medium">Codeforces</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.platforms.codeforces.handle}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Solved</div>
                          <div className="font-semibold">{profile.platforms.codeforces.solvedProblems}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-semibold">{Number(profile.platforms.codeforces.rating).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Rank: </span>
                        <span className="font-semibold capitalize">{profile.platforms.codeforces.rank}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      Codeforces not connected
                    </div>
                  )}

                  {profile?.platforms?.github ? (
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-success" />
                          <div className="font-medium">GitHub</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.platforms.github.username}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Repos</div>
                          <div className="font-semibold">{profile.platforms.github.publicRepos}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Stars</div>
                          <div className="font-semibold">{profile.platforms.github.totalStars}</div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Contributions: </span>
                        <span className="font-semibold">{profile.platforms.github.totalContributions}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      GitHub not connected
                    </div>
                  )}

                  {profile?.platforms?.codechef ? (
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-chart-2" />
                          <div className="font-medium">CodeChef</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.platforms.codechef.username}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-semibold">{Number(profile.platforms.codechef.rating).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Highest</div>
                          <div className="font-semibold">{profile.platforms.codechef.highestRating}</div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Stars: </span>
                        <span className="font-semibold">{profile.platforms.codechef.stars}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      CodeChef not connected
                    </div>
                  )}

                  {profile?.platforms?.gfg ? (
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-chart-3" />
                          <div className="font-medium">GeeksforGeeks</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.platforms.gfg.username}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Score</div>
                          <div className="font-semibold">{profile.platforms.gfg.score}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Solved</div>
                          <div className="font-semibold">{profile.platforms.gfg.problemsSolved}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                      GeeksforGeeks not connected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Profile Edit Dialog */}
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      </div>
    </AuthGuard>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}