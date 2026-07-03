
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import React from "react";
import { UserNav } from "../layout/user-nav";
import { JulyFreeAccessBanner } from "../layout/july-free-access-banner";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { usePathname } from "next/navigation";
import { shouldShowJulyFreeAccessBanner } from "@/lib/subscription-utils";
import { cn } from "@/lib/utils";

export interface ViewHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon | "skull";
    cta?: React.ReactNode;
    isDashboardPage?: boolean;
}

export function ViewHeader({ title, description, icon: Icon, cta, isDashboardPage }: ViewHeaderProps) {
    const isMobile = useIsMobile();
    const pathname = usePathname();
    const showJulyBanner = shouldShowJulyFreeAccessBanner(pathname);
    
    const shouldShowTitleAndDesc = !(isMobile && isDashboardPage);

    return (
        <div className="relative overflow-hidden z-20">
            <div className="absolute inset-0 bg-transparent" />
            <CardHeader className="p-4 md:p-6 pb-4 md:pb-6 w-full flex-col items-start gap-4">
                <div className={cn("view-header-row w-full", !showJulyBanner && "view-header-row--no-banner")}>
                    <div className="view-header-row__title flex shrink-0 items-center gap-2 md:gap-4 min-w-0">
                        <div className="flex flex-col min-w-0">
                            {shouldShowTitleAndDesc && (
                                <CardTitle className="text-2xl sm:text-3xl md:text-4xl flex items-center gap-2 md:gap-3 whitespace-nowrap">
                                    {isMobile && !isDashboardPage && <SidebarTrigger />}
                                    {Icon && Icon !== 'skull' && <Icon className={cn("hidden md:block", "h-7 w-7 md:h-8 md:w-8")} />}
                                    {title}
                                </CardTitle>
                            )}
                            {shouldShowTitleAndDesc && description && (
                                <CardDescription className="text-base md:text-lg mt-2 font-sans text-foreground/80">
                                    {description}
                                </CardDescription>
                            )}
                        </div>
                    </div>

                    {showJulyBanner && (
                        <div className="view-header-row__banner min-w-0">
                            <JulyFreeAccessBanner variant="inline" />
                        </div>
                    )}

                    <div className={cn("view-header-row__cta shrink-0", "hidden", !isMobile && "md:block")}>{cta}</div>
                    <div className={cn("view-header-row__cta shrink-0", isMobile && !isDashboardPage ? "block" : "hidden")}><UserNav /></div>
                </div>
            </CardHeader>
        </div>
    )
}
