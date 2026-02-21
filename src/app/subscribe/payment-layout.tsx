"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentLayoutProps {
  children: React.ReactNode;
  backHref: string;
  backText: string;
  title: string;
  description: string;
  titleIcon?: 'heart';
}

function PaymentLayout({ children, backHref, backText, title, description, titleIcon }: PaymentLayoutProps) {
  return (
    <div className="min-h-screen bg-white fixed inset-0 overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Button 
            asChild 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
          >
            <Link href={backHref} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{backText}</span>
          </Link>
        </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center gap-3">
              {titleIcon === 'heart' && (
                <div className="p-3 bg-red-50 rounded-full">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              )}
              <CardTitle className={cn(
                "text-3xl sm:text-4xl font-bold",
                titleIcon === 'heart' ? 'text-red-600' : 'text-gray-900'
              )}>
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-base sm:text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
          <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default PaymentLayout;
