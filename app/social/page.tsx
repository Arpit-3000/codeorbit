"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearchSection } from '@/components/social/user-search-section';
import { FriendsListSection } from '@/components/social/friends-list-section';
import { NotificationsSection } from '@/components/social/notifications-section';
import { PingRequestsSection } from '@/components/social/ping-requests-section';
import { RoomsSection } from '@/components/social/rooms-section';
import { BackendStatusIndicator } from '@/components/backend-status-indicator';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';

export default function SocialPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search');

  // Handle sidebar navigation
  const handleSidebarNav = (tab: string) => {
    console.log('[SOCIAL] Sidebar nav to:', tab);
    
    // Map sidebar tabs to routes
    const routes: Record<string, string> = {
      'dashboard': '/',
      'profile': '/profile',
      'social': '/social',
      // Add other routes as needed
    };
    
    if (routes[tab]) {
      router.push(routes[tab]);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar activeTab="social" onTabChange={handleSidebarNav} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Collab Space</h1>
                  <p className="text-sm text-muted-foreground">
                    Connect with other developers and collaborate in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Backend Status Indicator */}
              <BackendStatusIndicator />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="pings">Pings</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <UserSearchSection />
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <FriendsListSection />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationsSection />
            </TabsContent>

            <TabsContent value="pings" className="mt-6">
              <PingRequestsSection />
            </TabsContent>

            <TabsContent value="rooms" className="mt-6">
              <RoomsSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
      </div>
    </div>
  );
}
