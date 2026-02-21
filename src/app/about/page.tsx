import { Metadata } from 'next';
import { Users, Code, Heart } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export const metadata: Metadata = {
  title: 'About Us | L9 Tools',
  description: 'Learn about L9 Tools - Your Ultimate Companion for Lord Nine. A community-focused fan-made project.',
};

export default function AboutPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl text-primary font-cinzel font-bold mb-2">
                About L9 Tools
              </h1>
              <p className="text-lg text-muted-foreground">
                Your Ultimate Companion for Lord Nine
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Code className="h-6 w-6" /> Our Mission
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  L9 Tools was created by a passionate player with a single goal: to provide the Lord Nine community with the best possible tools to enhance their gaming experience. We focus on creating accurate, easy-to-use, and reliable timers and trackers to help you conquer the game&apos;s biggest challenges.
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-cinzel text-2xl font-bold text-golden flex items-center gap-2">
                  <Heart className="h-6 w-6" /> Community Focused
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This is a fan-made project, built for the community, by the community. We are not affiliated with the official developers of Lord Nine Infinite Class. The map screenshots displayed on this website are from the game and are used for informational purposes only. All other visual content and images are original works owned by L9 Tools. All game-related trademarks and copyrights are the property of their respective owners. Our aim is simply to support and grow with the player base.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </L9ToolsLayout>
  );
}
