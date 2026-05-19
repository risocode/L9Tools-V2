
"use client";

import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Star, User, Hash, Calendar, Gem, Bell, Settings, Trash2, MailX, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/ui/loader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { AccessDenied } from "./access-denied";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

export function ProfileView() {
    const { user, isInitialLoading, refreshUser } = useAuth();
    const [hasMounted, setHasMounted] = useState(false);
    const [isSaving, startTransition] = useTransition();
    const [notificationPref, setNotificationPref] = useState(user?.notifications_enabled ?? true);
    const { toast } = useToast();

    useEffect(() => {
        setHasMounted(true);
        if (user) {
            setNotificationPref(user.notifications_enabled ?? true);
        }
    }, [user]);
    
    const handleNotificationChange = async (enabled: boolean) => {
        if (!user) return;

        setNotificationPref(enabled); // Optimistic UI update
        
        startTransition(async () => {
            const { error } = await supabase
                .from('profiles')
                .update({ notifications_enabled: enabled, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) {
                setNotificationPref(!enabled); // Revert on error
                toast({
                    variant: 'destructive',
                    title: 'Error updating preferences',
                    description: error.message,
                });
            } else {
                toast({
                    variant: 'success',
                    title: 'Preferences Saved',
                    description: `Notifications have been ${enabled ? 'enabled' : 'disabled'}.`
                });
                await refreshUser(); // Refresh user context to get the latest profile data
            }
        });
    };

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

    const isLifetimeOrAdmin = user.subscription_tier === 'lifetime' || user.is_admin;
    const expiresDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isExpired = !isLifetimeOrAdmin && expiresDate ? new Date() > expiresDate : false;
    const tierLabel = user.is_admin ? 'Admin' : (user.subscription_tier || 'free');
    const displayName = user.display_name || user.username || 'L9 Player';
    const subscriptionDateLabel = isLifetimeOrAdmin ? 'Access' : isExpired ? 'Expired' : 'Expires On';
    const subscriptionDateValue = isLifetimeOrAdmin ? 'Never' : expiresDate ? format(expiresDate, 'MMM d, yyyy') : 'N/A';
    const notificationStatus = notificationPref ? 'Enabled' : 'Disabled';

    return (
        <div className="profile-card w-full max-w-5xl my-auto mx-auto">
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-border" />
                </div>
                <div className="profile-avatar-container">
                    <div className="profile-avatar-ring" />
                     <Avatar className={cn("profile-avatar", getAvatarBorderClass(user.subscription_tier, user.is_admin))}>
                        <AvatarImage src={user.user_photo_url || ''} alt={displayName} />
                        <AvatarFallback className="text-4xl bg-gray-800">{fallback}</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="profile-name-container pt-16">
                    <h1 className="profile-username flex items-center justify-center gap-2">
                        {displayName}
                        {user.is_admin && <Crown className="h-5 w-5 text-red-400" />}
                    </h1>
                    <p className="profile-email">{user.email}</p>
                    <div className={cn("profile-tier-pill mt-4", getTierPillClass(user.subscription_tier))}>
                        {user.is_admin && <Crown className="h-4 w-4 mr-2" />}
                        {user.subscription_tier === 'lifetime' && <Gem className="h-4 w-4 mr-2"/>}
                        {tierLabel}
                    </div>
                </div>
            </header>
            <div className="profile-content">
                <section className="profile-section">
                    <h3 className="profile-section-title"><User className="mr-3" /> Account Overview</h3>
                    <div className="profile-status-grid">
                        <div className="profile-stat-card">
                            <div className="profile-stat-icon profile-stat-icon-cyan"><User className="h-5 w-5" /></div>
                            <div>
                                <p className="profile-detail-label">Username</p>
                                <p className="profile-detail-value-cyan">{user.username || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="profile-stat-card">
                            <div className="profile-stat-icon profile-stat-icon-purple"><Hash className="h-5 w-5" /></div>
                            <div>
                                <p className="profile-detail-label">User ID</p>
                                <p className="profile-detail-value">{user.short_id}</p>
                            </div>
                        </div>
                        <div className="profile-stat-card">
                            <div className="profile-stat-icon profile-stat-icon-gold"><Calendar className="h-5 w-5" /></div>
                            <div>
                                <p className="profile-detail-label">Member Since</p>
                                <p className="profile-detail-value-gold">{format(new Date(user.created_at), 'MMMM d, yyyy')}</p>
                            </div>
                        </div>
                        <div className="profile-stat-card">
                            <div className="profile-stat-icon profile-stat-icon-cyan"><Bell className="h-5 w-5" /></div>
                            <div>
                                <p className="profile-detail-label">Boss Alerts</p>
                                <p className={cn("profile-detail-value", notificationPref && "profile-detail-value-cyan")}>{notificationStatus}</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="profile-section">
                     <h3 className="profile-section-title"><Star className="mr-3 text-yellow-400" /> Subscription</h3>
                     <div className="profile-subscription-panel">
                        <div className="flex items-start gap-4">
                            <div className="profile-stat-icon profile-stat-icon-gold">
                                {user.is_admin ? <Crown className="h-5 w-5" /> : user.subscription_tier === 'lifetime' ? <Gem className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="profile-detail-label">Current Tier</p>
                                <h4 className="profile-subscription-title">{tierLabel}</h4>
                                <p className="profile-muted">
                                    {user.is_admin
                                        ? 'Administrator access includes all premium features.'
                                        : user.subscription_tier === 'lifetime'
                                            ? 'Lifetime access is active and never expires.'
                                            : user.subscription_tier === 'pro' && !isExpired
                                                ? 'Your Pro benefits are active.'
                                                : 'Upgrade to remove ads and unlock premium boss tools.'}
                                </p>
                            </div>
                        </div>
                        <div className="profile-subscription-side">
                            <div className={cn("profile-tier-pill", getTierPillClass(user.subscription_tier))}>
                                {user.is_admin && <Crown className="h-4 w-4 mr-2" />}
                                {user.subscription_tier === 'lifetime' && <Gem className="h-4 w-4 mr-2"/>}
                                {tierLabel}
                            </div>
                            <p className={cn(
                                "profile-subscription-date",
                                isExpired ? "profile-expires-expired" : "profile-expires-active"
                            )}>
                                <Clock className="h-4 w-4" />
                                {subscriptionDateLabel}: {subscriptionDateValue}
                            </p>
                            {(!user.subscription_tier || user.subscription_tier === 'free' || isExpired) && !user.is_admin && (
                                <Button asChild className="profile-upgrade-button">
                                    <Link href="/subscribe">Upgrade / Manage Plan</Link>
                                </Button>
                            )}
                        </div>
                     </div>
                </section>

                 <section className="profile-section">
                    <h3 className="profile-section-title"><Bell className="mr-3 text-cyan-300" /> Notifications</h3>
                    <div className="profile-action-card profile-action-card-cyan">
                        <div>
                            <Label htmlFor="notifications-switch" className="font-semibold text-base text-white">Boss Spawn Alerts</Label>
                            <p className="text-sm text-muted-foreground">Receive browser notifications 5 minutes before a boss spawns and when it becomes active.</p>
                        </div>
                        <Switch
                            id="notifications-switch"
                            checked={notificationPref}
                            onCheckedChange={handleNotificationChange}
                            disabled={isSaving}
                        />
                    </div>
                </section>

                <section className="profile-section pb-6">
                    <h3 className="profile-section-title"><Settings className="mr-3 text-yellow-400" /> Account Settings</h3>
                    <div className="space-y-3">
                        <Link href="/unsubscribe" className="block">
                            <div className="profile-action-card profile-action-card-gold">
                                <div className="flex items-center gap-3">
                                    <MailX className="h-5 w-5 text-yellow-400" />
                                    <div>
                                        <Label className="font-semibold text-base text-white cursor-pointer">Unsubscribe from Emails</Label>
                                        <p className="text-sm text-muted-foreground">Stop receiving email notifications</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/unsubscribe" className="block">
                            <div className="profile-action-card profile-action-card-danger">
                                <div className="flex items-center gap-3">
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                    <div>
                                        <Label className="font-semibold text-base text-white cursor-pointer">Delete Account</Label>
                                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
