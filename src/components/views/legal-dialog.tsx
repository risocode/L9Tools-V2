
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

interface LegalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | 'disclaimer' | 'cookie';
}

const lastUpdatedDate = "September 18, 2025";

const termsContent = {
  title: "Terms of Service",
  description: `Last Updated: ${lastUpdatedDate}`,
  content: (
    <>
      <h3 className="font-bold mt-4 mb-2">1. Acceptance of Terms</h3>
      <p>By accessing or using L9 Tools (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service.</p>
      
      <h3 className="font-bold mt-4 mb-2">2. Description of Service</h3>
      <p>L9 Tools provides timers and tracking for in-game events, specifically world boss spawns (&quot;Bosses&quot;). The service allows users to view estimated spawn times, set manual death timers, and receive notifications. All data related to game content is for informational purposes only. L9 Tools is not affiliated with the developers of the game.</p>
      
      <h3 className="font-bold mt-4 mb-2">3. User Accounts</h3>
      <p>To access certain features, you must create an account. You are responsible for safeguarding your account and for any activities or actions under your account. You agree not to disclose your password to any third party.</p>
      
      <h3 className="font-bold mt-4 mb-2">4. User-Generated Content</h3>
      <p>Users can input data, such as the time of a Boss&apos;s death. You are solely responsible for the accuracy of the data you provide. We reserve the right to remove any data that we determine to be inaccurate or malicious without notice.</p>

      <h3 className="font-bold mt-4 mb-2">5. Subscriptions and Payments</h3>
      <p>We offer both free and paid subscription tiers (&quot;Pro&quot;, &quot;Lifetime&quot;). The features available may vary depending on your chosen tier. Payments for paid subscriptions are processed manually through the methods specified on our subscription page (e.g., GCash, USDT). You are responsible for completing the payment and providing proof to our support staff as instructed to activate your subscription. All prices are subject to change without notice.</p>

      <h3 className="font-bold mt-4 mb-2">6. Refund Policy</h3>
      <p>All sales are final. Due to the nature of the digital services and manual activation process, we do not offer refunds or credits for any subscription purchases. By making a purchase, you acknowledge and agree to this no-refund policy.</p>

      <h3 className="font-bold mt-4 mb-2">7. Prohibited Conduct</h3>
      <p>You agree not to misuse the Service. This includes, but is not limited to: attempting to disrupt the service, inputting false or misleading data intentionally, or using the service for any illegal purpose.</p>
      
      <h3 className="font-bold mt-4 mb-2">8. Termination</h3>
      <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. If you have a paid subscription, such termination will result in the forfeiture of your subscription without refund.</p>
      
      <h3 className="font-bold mt-4 mb-2">9. Changes to Terms</h3>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this site.</p>
    </>
  ),
};

const privacyContent = {
  title: "Privacy Policy",
  description: `Last Updated: ${lastUpdatedDate}`,
  content: (
    <>
      <h3 className="font-bold mt-4 mb-2">1. Information We Collect</h3>
      <p>We collect information to provide and improve our service. This includes:</p>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li><strong>Account Information:</strong> When you sign up, we collect your email, username, and encrypted password. If you use Google Sign-In, we receive your public profile information.</li>
        <li><strong>User-Provided Data:</strong> We store boss death timers you manually input, associated with your user account.</li>
        <li><strong>Locally Stored Data:</strong> For guest users, timer data is stored locally in your browser. For all users, Discord webhook URLs are stored locally.</li>
      </ul>
      
      <h3 className="font-bold mt-4 mb-2">2. How We Use Information</h3>
      <p>We use the information we collect to provide, maintain, and improve the Service, personalize your experience by saving your timers, and allow you to send reports to Discord.</p>
      
      <h3 className="font-bold mt-4 mb-2">3. Information Sharing</h3>
      <p>We do not share your personal information with companies, organizations, or individuals outside of L9 Tools except for our service providers (e.g., Supabase for database/auth) or for legal reasons.</p>
      
      <h3 className="font-bold mt-4 mb-2">4. Data Security</h3>
      <p>We work hard to protect our users from unauthorized access to information we hold. We use Supabase, which provides industry-standard security for data storage and authentication.</p>
    </>
  ),
};

const disclaimerContent = {
  title: "Disclaimer",
  description: `Last Updated: ${lastUpdatedDate}`,
  content: (
    <>
      <h3 className="font-bold mt-4 mb-2">1. No Guarantees</h3>
      <p>The information and tools provided by L9 Tools are on an &quot;as is&quot; basis. We make no warranties regarding the accuracy, completeness, or reliability of any data, including but not limited to boss spawn timers. All timers are estimates and should be used as a guideline only. We are not responsible for any in-game losses or missed opportunities resulting from the use of our Service.</p>
      
      <h3 className="font-bold mt-4 mb-2">2. Not Affiliated</h3>
      <p>L9 Tools is an independent, fan-made project and is not affiliated with, endorsed by, or in any way officially connected with the developers or publishers of the game Lord Nine Infinite Class.</p>
      
      <h3 className="font-bold mt-4 mb-2">3. Game Content and Map Screenshots</h3>
      <p>The map screenshots displayed on this website are taken from the game &quot;Lord Nine Infinite Class&quot; and are the intellectual property of the game&apos;s developers and publishers. These map screenshots are used for informational and educational purposes only, specifically to help players locate boss spawn locations within the game. We claim no ownership of these map screenshots. All other visual assets, UI elements, boss images, and graphics on this website are original works owned by L9 Tools. If you are the copyright owner of the map screenshots and wish to have them removed, please contact us at contact@l9tools.online, and we will promptly comply with your request.</p>
      
      <h3 className="font-bold mt-4 mb-2">4. External Links</h3>
      <p>The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with L9 Tools. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>
    </>
  ),
};

const cookieContent = {
  title: "Cookie Policy",
  description: `Last Updated: ${lastUpdatedDate}`,
  content: (
    <>
      <h3 className="font-bold mt-4 mb-2">1. What are Cookies?</h3>
      <p>Cookies are small text files stored on your device (computer, tablet, mobile phone) when you visit certain websites. We use cookies to help us improve our Service and your experience.</p>
      
      <h3 className="font-bold mt-4 mb-2">2. How We Use Cookies</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li><strong>Functionality Cookies:</strong> We use cookies to remember your settings and preferences, such as your authentication session and whether you&apos;ve seen our welcome message.</li>
        <li><strong>Third-Party Cookies:</strong> We use third-party services like hCaptcha which may also place cookies on your device. These cookies are used for purposes such as preventing spam. We do not have control over these cookies.</li>
      </ul>

      <h3 className="font-bold mt-4 mb-2">3. Your Choices</h3>
      <p>Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies or to delete certain cookies. Please note that if you choose to block cookies, it may impair or prevent due to functionality of the Service.</p>
    </>
  ),
};

const contentMap = {
  terms: termsContent,
  privacy: privacyContent,
  disclaimer: disclaimerContent,
  cookie: cookieContent,
};


export function LegalDialog({ isOpen, onClose, type }: LegalDialogProps) {
  const { title, description, content } = contentMap[type] || termsContent;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "glowing-card sm:max-w-2xl bg-transparent border-0 shadow-none p-0 grid-rows-[auto_1fr_auto] max-h-[90vh]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col max-h-[calc(90vh-1rem)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cinzel text-purple-400">{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden my-4">
            <ScrollArea className="h-full pr-6">
              <div className="text-sm text-muted-foreground space-y-2">
                {content}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
