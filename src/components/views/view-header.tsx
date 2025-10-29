
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import React from "react";
import { UserNav } from "../layout/user-nav";

export interface ViewHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon | "skull";
    cta?: React.ReactNode;
    mobileCta?: React.ReactNode;
    controls?: React.ReactNode;
    isDashboardPage?: boolean;
}

export function ViewHeader({ title, description, icon: Icon, cta, mobileCta, controls, isDashboardPage }: ViewHeaderProps) {
    return (
        <div className="relative overflow-hidden z-20">
            <div className="absolute inset-0 bg-transparent" />
            <CardHeader className="p-4 md:p-6 pb-4 md:pb-6 w-full flex-col items-start gap-4">
                <div className="w-full flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex flex-col">
                            <CardTitle className="text-3xl md:text-4xl flex items-center gap-3">
                            {Icon && Icon !== 'skull' && <Icon className="h-7 w-7 md:h-8 md:w-8" />}
                            {title}
                            </CardTitle>
                            <CardDescription className="text-base md:text-lg mt-2 font-sans text-foreground/80">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                     <div className="hidden md:block">{cta}</div>
                     <div className="md:hidden">{mobileCta}</div>
                </div>
                 {isDashboardPage && <div className="block md:hidden w-full flex justify-center"><UserNav size="large" /></div>}
                {controls && <div className="w-full">{controls}</div>}
            </CardHeader>
        </div>
    )
}
