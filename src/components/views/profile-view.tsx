
"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, Star, User, Hash, Calendar, Gem } from "lucide-react";
import Loader from "@/components/ui/loader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AccessDenied } from "./access-denied";

export function ProfileView() {
    const { user, isInitialLoading } = useAuth();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted || isInitialLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-12 w-12 text-cyan-300" /></div>;
    }

    if (!user) {
        return <AccessDenied message="Please log in to view your profile." />;
    }
    
    const fallback = user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';

    const getTierPillClass = (tier: string | null | undefined) => {
        if (user.is_admin) return 'profile-tier-admin';
        switch (tier) {
            case 'pro': return 'profile-tier-pro';
            case 'lifetime': return 'profile-tier-lifetime';
            default: return 'profile-tier-free';
        }
    }
    
    const getAvatarBorderClass = (tier: string | null | undefined, isAdmin: boolean | undefined) => {
        if (isAdmin) return 'border-purple-500';
        switch (tier) {
            case 'pro': return 'border-yellow-400';
            case 'lifetime': return 'border-amber-500';
            default: return 'border-white';
        }
    }

    const expiresDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isExpired = expiresDate ? new Date() > expiresDate : false;

    return (
        <div className="profile-card w-full max-w-2xl my-auto mx-auto">
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-border" />
                </div>
                <div className="profile-avatar-container">
                    <div className="profile-avatar-ring" />
                     <Avatar className={cn("profile-avatar", getAvatarBorderClass(user.subscription_tier, user.is_admin))}>
                        <AvatarImage src={user.user_photo_url || ''} alt={user.display_name || 'User'} />
                        <AvatarFallback className="text-4xl bg-gray-800">{fallback}</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="profile-name-container pt-16">
                    <h1 className="profile-username flex items-center justify-center gap-2">
                        {user.display_name || user.username}
                        {user.is_admin && <Crown className="h-5 w-5 text-red-400" />}
                    </h1>
                    <p className="profile-email">{user.email}</p>
                </div>
            </header>
            <div className="profile-content">

                <Separator className="profile-divider my-4" />

                <div className="px-4 py-2 space-y-4">
                    <h3 className="profile-section-title"><User className="mr-3" /> Profile Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                       <div className="profile-detail-item">
                           <p className="profile-detail-label"><User className="h-4 w-4" />Username</p>
                           <p className="profile-detail-value-cyan">{user.username || 'Not set'}</p>
                       </div>
                       <div className="profile-detail-item">
                           <p className="profile-detail-label"><Hash className="h-4 w-4" />User ID</p>
                           <p className="profile-detail-value">{user.short_id}</p>
                       </div>
                       <div className="profile-detail-item col-span-1 md:col-span-2">
                           <p className="profile-detail-label"><Calendar className="h-4 w-4" />Member Since</p>
                           <p className="profile-detail-value-gold">{format(new Date(user.created_at), 'MMMM d, yyyy')}</p>
                       </div>
                    </div>
                </div>
                
                <Separator className="profile-divider my-4" />
                
                <div className="px-4 py-2 space-y-4">
                     <h3 className="profile-section-title"><Star className="mr-3 text-yellow-400" /> Subscription</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div className="profile-detail-item">
                            <p className="profile-detail-label">Current Tier</p>
                            <div className={cn("profile-tier-pill", getTierPillClass(user.subscription_tier))}>
                                {user.is_admin && <Crown className="h-4 w-4 mr-2" />}
                                {user.subscription_tier === 'lifetime' && <Gem className="h-4 w-4 mr-2"/>}
                                {user.is_admin ? 'Admin' : (user.subscription_tier || 'free')}
                            </div>
                        </div>
                        <div className="profile-detail-item text-left sm:text-right">
                            <p className="profile-detail-label sm:justify-end">Expires On</p>
                            <p className={cn(
                                "font-semibold text-lg",
                                isExpired ? "profile-expires-expired" : "profile-expires-active"
                            )}>
                                {expiresDate ? format(expiresDate, 'MMM d, yyyy') : (user.subscription_tier === 'lifetime' || user.is_admin ? 'Never' : 'N/A')}
                            </p>
                        </div>
                     </div>
                </div>

                <div className="flex justify-center pt-6 pb-4">
                    <Button className="profile-update-button" disabled>Update Profile</Button>
                </div>
            </div>
        </div>
    );
}
