import { Metadata } from 'next';
import { Cookie, Info, Settings, Sliders, Mail } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export const metadata: Metadata = {
  title: 'Cookie Policy | L9 Tools',
  description: 'Cookie Policy for L9 Tools - Learn how we use cookies to enhance your experience.',
};

export default function CookiesPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                Cookie Policy
              </h1>
              <p className="text-lg text-muted-foreground">
                Last Updated: September 18, 2025
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Info className="h-6 w-6" /> 1. What are Cookies?
                </h2>
                <p className="text-muted-foreground leading-relaxed">Cookies are small text files stored on your device (computer, tablet, mobile phone) when you visit certain websites. We use cookies to help us improve our Service and your experience.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Settings className="h-6 w-6" /> 2. How We Use Cookies
                </h2>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li><strong>Functionality Cookies:</strong> We use cookies to remember your settings and preferences, such as your authentication session and whether you&apos;ve seen our welcome message.</li>
                  <li><strong>Third-Party Cookies:</strong> We use third-party services like hCaptcha which may also place cookies on your device. These cookies are used for purposes such as preventing spam. We do not have control over these cookies.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Sliders className="h-6 w-6" /> 3. Your Choices
                </h2>
                <p className="text-muted-foreground leading-relaxed">Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies or to delete certain cookies. Please note that if you choose to block cookies, it may impair or prevent due to functionality of the Service.</p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Mail className="h-6 w-6" /> 4. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">If you have any questions about this Cookie Policy, please contact us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
