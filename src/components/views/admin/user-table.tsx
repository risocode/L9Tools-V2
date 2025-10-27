
"use client";

import { useState } from 'react';
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

interface UserTableProps {
    profiles: Profile[];
    isLoading: boolean;
    onSubscriptionUpdate: () => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const TierBadge = ({ profile }: { profile: Profile }) => {
    if (profile.is_admin) {
        return (
            <Badge className="admin-tier-admin">
                Admin
            </Badge>
        );
    }
    
    const tier = profile.subscription_tier;

    switch (tier) {
        case 'pro':
            return <Badge className="admin-tier-pro">Pro</Badge>;
        case 'lifetime':
            return <Badge className="admin-tier-lifetime">Lifetime</Badge>;
        default:
            return <Badge className="admin-tier-free">Free</Badge>;
    }
};

const ExpiresCell = ({ profile }: { profile: Profile }) => {
    if (profile.is_admin || profile.subscription_tier === 'lifetime') {
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

const UserStatusCell = ({ profile }: { profile: Profile }) => {
    if (!profile.last_sign_in_at) {
        return <span className="text-muted-foreground text-xs">Never</span>;
    }
    const lastSeenDate = new Date(profile.last_sign_in_at);
    const isOnline = (new Date().getTime() - lastSeenDate.getTime()) < 15 * 60 * 1000;
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        ) : (
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(lastSeenDate, { addSuffix: true })}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{format(lastSeenDate, 'MMM d, yyyy, h:mm a')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const UserCard = ({ profile, onManageClick }: { profile: Profile; onManageClick: (profile: Profile) => void; }) => (
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
                    <UserStatusCell profile={profile} />
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

const PaginationControls = ({ currentPage, totalPages, onPageChange, isLoading }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; isLoading: boolean; }) => (
  <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-[#00e5ff]/20">
    <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
    </span>
    <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
    >
        Previous
    </Button>
    <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
    >
        Next
    </Button>
  </div>
);


export function UserTable({ profiles, isLoading, onSubscriptionUpdate, currentPage, totalPages, onPageChange }: UserTableProps) {
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
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No profiles found.
              </TableCell>
            </TableRow>
        )
    }

    if (isMobile) {
      return (
        <div className="block md:hidden space-y-4 p-2">
            {profiles.map((profile) => (
                <UserCard key={profile.id} profile={profile} onManageClick={handleOpenDialog} />
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
                        <TableCell className="w-[20%]"><UserStatusCell profile={profile} /></TableCell>
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
                {isMobile ? renderContent() : <Table>{renderContent()}</Table>}
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

    