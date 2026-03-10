"use client";

import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Shield, ExternalLink } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

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
            <div className="lg:col-span-2">
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
                      <AvatarImage src={user?.photoURL || ""} alt="Profile picture" />
                      <AvatarFallback className="text-lg">
                        {user ? getInitials(user.displayName, user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">
                        {user?.displayName || 'No display name'}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {user?.provider === 'google' ? 'Google Account' : 'Local Account'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Account Details</h4>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono">{user?.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="capitalize">{user?.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Display Name:</span>
                        <span>{user?.displayName || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connected Platforms */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>Your linked coding platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.platforms ? (
                    <div className="space-y-3">
                      {user.platforms.leetcode && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">LeetCode</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.platforms.leetcode.username}
                            </div>
                          </div>
                          <Badge variant="secondary">Connected</Badge>
                        </div>
                      )}
                      
                      {user.platforms.codeforces && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Codeforces</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.platforms.codeforces.handle}
                            </div>
                          </div>
                          <Badge variant="secondary">Connected</Badge>
                        </div>
                      )}
                      
                      {user.platforms.github && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">GitHub</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.platforms.github.username}
                            </div>
                          </div>
                          <Badge variant="secondary">Connected</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No platforms connected yet</p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect Platforms
                      </Button>
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