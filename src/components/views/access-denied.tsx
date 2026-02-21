
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccessDeniedProps {
  title?: string;
  message: string;
  className?: string;
}

export function AccessDenied({ title = "ACCESS DENIED", message, className }: AccessDeniedProps) {
  return (
    <div className={cn("flex items-center justify-center h-full p-4", className)}>
        <div className="access-denied-card">
            <h2 className="access-denied-title">{title}</h2>
            <p className="access-denied-message">{message}</p>
        </div>
    </div>
  );
}
