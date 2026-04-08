"use client";

import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Shield, ExternalLink, Code2, Trophy, GitBranch, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUserProfile } from '@/lib/api';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, []);

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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and connected platforms</p>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Synced:</span>
                        <span>{profile?.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Stats
                  </CardTitle>
                  <CardDescription>Your coding activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.stats?.activeDays || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Days</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profile?.stats?.consistencyScore || 0}%</div>
                      <div className="text-sm text-muted-foreground">Consistency</div>
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
      </div>
    </AuthGuard>
  );
}