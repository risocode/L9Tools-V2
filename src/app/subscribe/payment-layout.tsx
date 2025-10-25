
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Heart } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="absolute top-4 left-4">
        <Button asChild variant="outline">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/20">
        <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-2">
              {titleIcon === 'heart' && <Heart className="h-10 w-10 text-crimson" />}
              <CardTitle className={`text-3xl ${titleIcon === 'heart' ? 'text-crimson' : 'text-yellow-400'}`}>{title}</CardTitle>
            </div>
          <CardDescription className="text-lg font-sans">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentLayout;
