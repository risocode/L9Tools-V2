
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { Profile } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UpdateSubscriptionDialog } from './update-subscription-dialog';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';

interface UserTableProps {
    profiles: Profile[];
    isLoading: boolean;
    onSubscriptionUpdate: () => void;
    currentPage: number;
    totalPages: number;
    totalCount?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    onlineUserIds?: Set<string>;
}

const isFreeTrialAccount = (profile: Profile): boolean => {
    if (profile.subscription_tier !== 'pro' || !profile.subscription_expires_at || !profile.created_at) return false;
    const expiresDate = new Date(profile.subscription_expires_at);
    if (expiresDate.getTime() <= Date.now()) return false;
    const createdDate = new Date(profile.created_at);
    const daysDiff = (expiresDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff >= 2.5 && daysDiff <= 3.5;
};

const TierBadge = ({ profile }: { profile: Profile }) => {
    if (profile.is_admin) {
        return (
            <Badge className="admin-tier-admin">
                Admin
            </Badge>
        );
    }
    
    // Get effective tier considering expiration
    const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as any,
        profile.subscription_expires_at,
        profile.is_admin
    );

    if (effectiveTier === 'pro' && isFreeTrialAccount(profile)) {
        return <Badge className="admin-tier-trial">TRIAL</Badge>;
    }
    switch (effectiveTier) {
        case 'pro':
            return <Badge className="admin-tier-pro">Pro</Badge>;
        case 'lifetime':
            return <Badge className="admin-tier-lifetime">Lifetime</Badge>;
        default:
            return <Badge className="admin-tier-free">Free</Badge>;
    }
};

const ExpiresCell = ({ profile }: { profile: Profile }) => {
    if (profile.is_admin) {
        return <span className="text-lg font-bold text-red-400">∞</span>;
    }
    
    // Get effective tier to check if it's lifetime
    const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as any,
        profile.subscription_expires_at,
        profile.is_admin
    );
    
    if (effectiveTier === 'lifetime') {
        return <span className="text-lg font-bold text-red-400">∞</span>;
    }
    
    if (profile.subscription_expires_at) {
        const expiresDate = new Date(profile.subscription_expires_at);
        const isExpired = new Date() > expiresDate;
        return (
            <span className={isExpired ? 'admin-expires-expired' : 'admin-expires-active'}>
                {format(expiresDate, 'MMM d, yyyy')}
            </span>
        );
    }
    return <span className="text-muted-foreground">N/A</span>;
};

const UserStatusCell = ({ profile, isRealtimeOnline }: { profile: Profile; isRealtimeOnline?: boolean }) => {
    // Prioritize real-time presence data over database/time-based status
    // Real-time presence is most accurate for current online status
    
    // Determine if user is considered "online" based on last sign-in time (fallback)
    const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Check real-time presence first (most accurate)
    const isOnlineViaPresence = isRealtimeOnline === true;
    
    // Check explicit online_status from database
    const hasExplicitOnlineStatus = profile.online_status === 'online';
    
    // Calculate time-based online status (fallback if no presence data)
    let isTimeBasedOnline = false;
    let lastSeenDate: Date | null = null;
    
    if (profile.last_sign_in_at) {
        lastSeenDate = new Date(profile.last_sign_in_at);
        const timeSinceLastSignIn = Date.now() - lastSeenDate.getTime();
        isTimeBasedOnline = timeSinceLastSignIn <= ONLINE_THRESHOLD_MS;
    }
    
    // Show "Online" if real-time presence OR explicit status OR signed in recently
    const isOnline = isOnlineViaPresence || hasExplicitOnlineStatus || isTimeBasedOnline;
    
    if (isOnline) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-green-400">Online</span>
                        </div>
                    </TooltipTrigger>
                    {lastSeenDate && (
                        <TooltipContent>
                            <p>Last seen: {format(lastSeenDate, 'MMM d, yyyy, h:mm a')}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    }

    // No sign-in history
    if (!profile.last_sign_in_at) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <span className="text-muted-foreground text-xs">Never</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>User has never signed in</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    // Show time ago for users who signed in more than 10 minutes ago
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-2">
                         <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(lastSeenDate!, { addSuffix: true })}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Last seen: {format(lastSeenDate!, 'MMM d, yyyy, h:mm a')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const UserCard = ({
  profile,
  onManageClick,
  isRealtimeOnline,
}: {
  profile: Profile;
  onManageClick: (profile: Profile) => void;
  isRealtimeOnline?: boolean;
}) => (
    <Card className="admin-table-row bg-transparent border-b-0 rounded-lg mb-4">
        <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.user_photo_url || undefined} />
                    <AvatarFallback>{profile.display_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="admin-table-username text-base">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{profile.short_id}</p>
                </div>
                <TierBadge profile={profile} />
            </div>

            <div className="space-y-2 text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <UserStatusCell profile={profile} isRealtimeOnline={isRealtimeOnline} />
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="admin-table-email truncate">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <ExpiresCell profile={profile} />
                </div>
            </div>

            <Button 
                variant="outline" 
                size="sm"
                onClick={() => onManageClick(profile)}
                className="admin-manage-button w-full mt-4"
            >
                Manage
            </Button>
        </CardContent>
    </Card>
);

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  const [jumpPage, setJumpPage] = useState(String(currentPage));

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  const goToPage = () => {
    const n = parseInt(jumpPage, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n);
    else setJumpPage(String(currentPage));
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 py-4 px-4 border-t border-[#00e5ff]/20">
      <span className="text-sm text-muted-foreground mr-auto">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Go to</span>
        <Input
          className="w-14 h-8 text-center"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && goToPage()}
          disabled={isLoading}
        />
        <Button variant="ghost" size="sm" onClick={goToPage} disabled={isLoading}>
          Go
        </Button>
      </div>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || isLoading}>
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>
        Next
      </Button>
    </div>
  );
}


export function UserTable({ profiles, isLoading, onSubscriptionUpdate, currentPage, totalPages, onPageChange, onlineUserIds }: UserTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { user: adminUser, refreshUser } = useAuth();
  const isMobile = useIsMobile();

  const handleOpenDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProfile(null);
  };

  const handleSuccessfulUpdate = () => {
    onSubscriptionUpdate();
    // If the admin is editing their own profile, refresh the auth context
    if (adminUser && selectedProfile && adminUser.id === selectedProfile.id) {
      refreshUser();
    }
  }

  const renderContent = () => {
    if (isLoading) {
        return (
             <div className="h-[50vh] flex items-center justify-center">
                <Loader className="h-10 w-10 text-[#00e5ff]" />
            </div>
        )
    }

    if (profiles.length === 0) {
      return (
        isMobile ? (
          <div className="h-24 text-center text-muted-foreground flex items-center justify-center">No profiles found.</div>
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              No profiles found.
            </TableCell>
          </TableRow>
        )
      );
    }
    
    if (isMobile) {
      return (
        <div className="block md:hidden space-y-4 p-2">
            {profiles.map((profile) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  onManageClick={handleOpenDialog}
                  isRealtimeOnline={onlineUserIds?.has(profile.id)}
                />
            ))}
        </div>
      )
    }

    return (
        <Table>
            <TableHeader className="admin-table-header">
                <TableRow className="border-[#00e5ff]/20 hover:bg-transparent">
                    <TableHead className="w-[30%] text-[#00e5ff]">User</TableHead>
                    <TableHead className="w-[20%] text-[#00e5ff]">Email</TableHead>
                    <TableHead className="w-[20%] text-[#00e5ff]">Status</TableHead>
                    <TableHead className="w-[10%] text-[#00e5ff]">Tier</TableHead>
                    <TableHead className="w-[10%] text-[#00e5ff]">Expires</TableHead>
                    <TableHead className="w-[10%] text-right text-[#00e5ff]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {profiles.map((profile) => (
                    <TableRow key={profile.id} className="admin-table-row">
                        <TableCell className="w-[30%]">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={profile.user_photo_url || undefined} />
                                <AvatarFallback>{profile.display_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="admin-table-username">{profile.display_name}</span>
                                <span className="text-xs text-muted-foreground font-mono">{profile.short_id}</span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="w-[20%] admin-table-email">{profile.email}</TableCell>
                        <TableCell className="w-[20%]">
                          <UserStatusCell 
                            profile={profile} 
                            isRealtimeOnline={onlineUserIds?.has(profile.id)}
                          />
                        </TableCell>
                        <TableCell className="w-[10%]">
                            <TierBadge profile={profile} />
                        </TableCell>
                        <TableCell className="w-[10%]">
                            <ExpiresCell profile={profile} />
                        </TableCell>
                        <TableCell className="w-[10%] text-right">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(profile)}
                            className="admin-manage-button"
                        >
                            Manage
                        </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
  };


  return (
    <>
        <div className={cn("relative flex-1 flex flex-col admin-table-container", isLoading && "overflow-hidden")}>
             <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} isLoading={isLoading} />
             <ScrollArea className="flex-1">
                {renderContent()}
            </ScrollArea>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} isLoading={isLoading} />
        </div>

        <UpdateSubscriptionDialog
            isOpen={isDialogOpen}
            onClose={handleDialogClose}
            profile={selectedProfile}
            onSubscriptionUpdate={handleSuccessfulUpdate}
        />
    </>
  );
}

    

