import { Metadata } from 'next';
import { Shield, Database, Eye, Share2, Lock, Megaphone, Cookie, UserCheck, RefreshCw, Mail } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy | L9 Tools',
  description: 'Privacy Policy for L9 Tools - Learn how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                Privacy Policy
              </h1>
              <p className="text-lg text-muted-foreground">
                Last Updated: September 18, 2025
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Database className="h-6 w-6" /> 1. Information We Collect
                </h2>
                <p className="text-muted-foreground leading-relaxed">We collect information to provide and improve our service. This includes:</p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li><strong>Account Information:</strong> When you sign up, we collect your email, username, and encrypted password. If you use Google Sign-In, we receive your public profile information.</li>
                  <li><strong>User-Provided Data:</strong> We store boss death timers you manually input, associated with your user account.</li>
                  <li><strong>Locally Stored Data:</strong> For guest users, timer data is stored locally in your browser. For all users, Discord webhook URLs are stored locally.</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Eye className="h-6 w-6" /> 2. How We Use Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">We use the information we collect to provide, maintain, and improve the Service, personalize your experience by saving your timers, and allow you to send reports to Discord.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Share2 className="h-6 w-6" /> 3. Information Sharing
                </h2>
                <p className="text-muted-foreground leading-relaxed">We do not share your personal information with companies, organizations, or individuals outside of L9 Tools except for our service providers (e.g., Supabase for database/auth) or for legal reasons.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Lock className="h-6 w-6" /> 4. Data Security
                </h2>
                <p className="text-muted-foreground leading-relaxed">We work hard to protect our users from unauthorized access to information we hold. We use Supabase, which provides industry-standard security for data storage and authentication.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Cookie className="h-6 w-6" /> 5. Cookies
                </h2>
                <p className="text-muted-foreground leading-relaxed">We use cookies to enhance your experience. For detailed information about our cookie usage, please see our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <UserCheck className="h-6 w-6" /> 6. Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <RefreshCw className="h-6 w-6" /> 7. Changes to This Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Mail className="h-6 w-6" /> 8. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">If you have any questions about this Privacy Policy, please contact us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
