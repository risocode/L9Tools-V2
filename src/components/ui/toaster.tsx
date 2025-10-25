
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastProgress,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

const ICONS = {
    success: <CheckCircle className="h-6 w-6" />,
    destructive: <AlertTriangle className="h-6 w-6" />,
    default: null,
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        const Icon = props.variant ? ICONS[props.variant] : null;
        return (
          <Toast key={id} {...props}>
            <div className={cn("flex items-start gap-3 w-full", !Icon && "pl-8")}>
              {Icon && <div className="flex-shrink-0">{Icon}</div>}
              <div className="grid gap-1 w-full">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
            <ToastProgress variant={props.variant} duration={duration || 3000} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
