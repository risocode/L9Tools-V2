import { Metadata } from 'next';
import { MessageSquare, Mail, Briefcase } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | L9 Tools',
  description: 'Get in touch with L9 Tools. Join our Discord community or email us for support and business inquiries.',
};

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 512"
    className="w-7 h-7 fill-current text-indigo-400"
    {...props}
  >
    <path d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32.03a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.107 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126 251.047 251.047 0 0 0 9.109-7.137 1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233 234.533 234.533 0 0 0 9.132 7.16 1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 610.7 405.729a1.882 1.882 0 0 0 .765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.820 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z" />
  </svg>
);

export default function ContactPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                Contact Us
              </h1>
              <p className="text-lg text-muted-foreground">
                We&apos;re here to help. Here&apos;s how you can reach us.
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  For general support, feedback, or bug reports, the quickest way to get help is by joining our Discord server.
                </p>
                
                <div className="flex justify-center">
                  <a
                    href="https://discord.gg/fBauvk9j4B"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-4 rounded-2xl backdrop-blur-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 via-black-900/60 to-black/80 shadow-2xl hover:shadow-indigo-500/30 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ease-out cursor-pointer hover:border-indigo-400/60 overflow-hidden max-w-sm w-full"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/30 to-indigo-600/10 backdrop-blur-sm">
                        <DiscordIcon />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-indigo-400 font-bold text-lg">
                          Discord
                        </p>
                        <p className="text-indigo-300/60 text-sm">
                          Join community
                        </p>
                      </div>
                    </div>
                  </a>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Link href="mailto:contact@l9tools.online" className="text-sm text-primary hover:underline">
                    contact@l9tools.online
                  </Link>
                </div>
              </div>
              
              <div className="space-y-4 border-t border-primary/10 pt-6 text-center">
                <h2 className="font-bold text-lg flex items-center justify-center gap-2">
                  <Briefcase className="h-5 w-5 text-golden" />
                  Business Inquiries
                </h2>
                <p className="text-muted-foreground">
                  For partnerships or other business-related matters, please email us.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Link href="mailto:risocadev@l9tools.online" className="text-sm text-primary hover:underline">
                    risocadev@l9tools.online
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
