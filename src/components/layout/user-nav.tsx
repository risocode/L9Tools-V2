
"use client";

import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, LogOut, User as UserIcon, Repeat, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import Loader from "../ui/loader";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getEffectiveSubscription, hasActiveProSubscription, NO_CAMPAIGN } from "@/lib/subscription-utils";
import { isUserAdmin } from "@/lib/supabase-admin";

interface UserNavProps {
  size?: 'default' | 'large' | 'small';
}

export function UserNav({ size = 'default' }: UserNavProps) {
  const { user, openAuthDialog, logout, isInitialLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleCopyId = () => {
    if (user?.short_id) {
      navigator.clipboard.writeText(user.short_id);
      toast({
        variant: 'success',
        title: "User ID Copied",
        description: "Your User ID has been copied to the clipboard.",
      });
    }
  };

  const getAvatarBorderClass = (tier: string | null | undefined, isAdmin: boolean | undefined) => {
      if (isAdmin) return 'border-purple-500';
      switch (tier) {
          case 'pro': return 'border-yellow-400';
          case 'lifetime': return 'border-amber-500';
          default: return 'border-white';
      }
  }

  const renderContent = () => {
    if (!hasMounted || isInitialLoading) {
      return <Loader className="h-6 w-6" />;
    }

    if (user) {
      const fallback = user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
      const isAdmin = isUserAdmin(user);
      const profileFields = {
        subscription_tier: user.subscription_tier,
        subscription_expires_at: user.subscription_expires_at,
        is_admin: user.is_admin,
      };
      const subscription = getEffectiveSubscription(profileFields);
      const billing = getEffectiveSubscription(profileFields, NO_CAMPAIGN);
      const isSubscribed = hasActiveProSubscription(
        user.subscription_tier as any,
        user.subscription_expires_at,
        isAdmin
      );
      const isPro = billing.effectiveTier === 'pro';
      const isLifetime = billing.effectiveTier === 'lifetime';
      const canRenew = isPro && !isLifetime && !isAdmin && isSubscribed;

      const buttonSizeClass = size === 'large' ? 'profile-avatar' : (size === 'small' ? 'h-10 w-10 md:h-12 md:w-12' : 'h-10 w-10 md:h-12 md:w-12');

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "bg-transparent border-none rounded-full",
                buttonSizeClass
              )} 
              aria-label="Open user menu"
            >
              <Avatar className={cn("h-full w-full border-2", getAvatarBorderClass(subscription.effectiveTier, user.is_admin))}>
                {user.user_photo_url && <AvatarImage src={user.user_photo_url} alt={user.display_name || 'User'} />}
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="fantasy-dropdown-menu w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.display_name || user.username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyId} className="group">
                <span className="text-xs text-muted-foreground font-mono group-hover:text-foreground">ID: {user.short_id}</span>
                <Copy className="mr-2 h-3 w-3 ml-auto text-muted-foreground group-hover:text-foreground" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                  <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                  </Link>
              </DropdownMenuItem>
              {!isSubscribed && (
                <DropdownMenuItem asChild>
                  <Link href="/subscribe">
                    <Crown className="mr-2 h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400">Upgrade to Pro</span>
                  </Link>
                </DropdownMenuItem>
              )}
               {canRenew && (
                <DropdownMenuItem asChild>
                  <Link href="/subscribe">
                    <Repeat className="mr-2 h-4 w-4" />
                    <span>Renew Subscription</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  
    return (
      <button
        onClick={openAuthDialog}
        className="image-login-btn"
        aria-label="Login"
      >
        <Image
            src="/l9rs/login.png"
            alt="Login"
            width={120}
            height={40}
        />
      </button>
    );
  }

  return (
    <div className="flex justify-end items-center">
      {renderContent()}
    </div>
  );
}
