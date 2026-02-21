import { Metadata } from 'next';
import { AlertTriangle, ShieldX, Unlink, Image, Link2, Mail } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export const metadata: Metadata = {
  title: 'Disclaimer | L9 Tools',
  description: 'Disclaimer for L9 Tools - Important information about the service and its limitations.',
};

const lastUpdatedDate = "September 18, 2025";

export default function DisclaimerPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                Disclaimer
              </h1>
              <p className="text-lg text-muted-foreground">
                Last Updated: {lastUpdatedDate}
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <ShieldX className="h-6 w-6" /> 1. No Guarantees
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The information and tools provided by L9 Tools are on an &quot;as is&quot; basis. We make no warranties regarding the accuracy, completeness, or reliability of any data, including but not limited to boss spawn timers. All timers are estimates and should be used as a guideline only. We are not responsible for any in-game losses or missed opportunities resulting from the use of our Service.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Unlink className="h-6 w-6" /> 2. Not Affiliated
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  L9 Tools is an independent, fan-made project and is not affiliated with, endorsed by, or in any way officially connected with the developers or publishers of the game Lord Nine Infinite Class.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Image className="h-6 w-6" /> 3. Game Content and Map Screenshots
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The map screenshots displayed on this website are taken from the game &quot;Lord Nine Infinite Class&quot; and are the intellectual property of the game&apos;s developers and publishers. These map screenshots are used for informational and educational purposes only, specifically to help players locate boss spawn locations within the game. We claim no ownership of these map screenshots. All other visual assets, UI elements, boss images, and graphics on this website are original works owned by L9 Tools. If you are the copyright owner of the map screenshots and wish to have them removed, please contact us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>, and we will promptly comply with your request.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Link2 className="h-6 w-6" /> 4. External Links
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with L9 Tools. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Mail className="h-6 w-6" /> 5. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Disclaimer, please contact us at <a href="mailto:contact@l9tools.online" className="text-primary hover:underline">contact@l9tools.online</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
