"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ResponsiveDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export function ResponsiveDrawer({ open, onOpenChange, trigger, children, contentClassName }: ResponsiveDrawerProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={contentClassName}>
          <div className="mt-4 border-t h-[40vh]">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className={contentClassName}>{children}</PopoverContent>
    </Popover>
  )
}
