"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Swords,
  ScrollText,
  Database,
  GitFork,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Character", icon: Swords },
  { href: "/quests", label: "Quests", icon: ScrollText },
  { href: "/items", label: "Item DB", icon: Database },
  { href: "/skills", label: "Skill Planner", icon: GitFork },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
