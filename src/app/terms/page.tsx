import { Metadata } from 'next';
import { FileText, CheckCircle, Info, User, Edit, CreditCard, XCircle, Ban, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export const metadata: Metadata = {
  title: 'Terms of Service | L9 Tools',
  description: 'Terms of Service for L9 Tools - Learn about the terms and conditions for using our service.',
};

const lastUpdatedDate = "September 18, 2025";

export default function TermsPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground">
                Last Updated: {lastUpdatedDate}
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" /> 1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using L9 Tools (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Info className="h-6 w-6" /> 2. Description of Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  L9 Tools provides timers and tracking for in-game events, specifically world boss spawns (&quot;Bosses&quot;). The service allows users to view estimated spawn times, set manual death timers, and receive notifications. All data related to game content is for informational purposes only. L9 Tools is not affiliated with the developers of the game.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <User className="h-6 w-6" /> 3. User Accounts
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features, you must create an account. You are responsible for safeguarding your account and for any activities or actions under your account. You agree not to disclose your password to any third party.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Edit className="h-6 w-6" /> 4. User-Generated Content
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users can input data, such as the time of a Boss&apos;s death. You are solely responsible for the accuracy of the data you provide. We reserve the right to remove any data that we determine to be inaccurate or malicious without notice.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <CreditCard className="h-6 w-6" /> 5. Subscriptions and Payments
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We offer both free and paid subscription tiers (&quot;Pro&quot;, &quot;Lifetime&quot;). The features available may vary depending on your chosen tier. Payments for paid subscriptions are processed manually through the methods specified on our subscription page (e.g., GCash, USDT). You are responsible for completing the payment and providing proof to our support staff as instructed to activate your subscription. All prices are subject to change without notice.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <XCircle className="h-6 w-6" /> 6. Refund Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  All sales are final. Due to the nature of the digital services and manual activation process, we do not offer refunds or credits for any subscription purchases. By making a purchase, you acknowledge and agree to this no-refund policy.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Ban className="h-6 w-6" /> 7. Prohibited Conduct
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree not to misuse the Service. This includes, but is not limited to: attempting to disrupt the service, inputting false or misleading data intentionally, or using the service for any illegal purpose.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <AlertCircle className="h-6 w-6" /> 8. Termination
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. If you have a paid subscription, such termination will result in the forfeiture of your subscription without refund.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <RefreshCw className="h-6 w-6" /> 9. Changes to Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this site.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Mail className="h-6 w-6" /> 10. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms, please contact us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
