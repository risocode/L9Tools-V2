
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Code, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="flex">
      <L9ToolsLayout>
        <div className="h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/20">
                <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl text-primary">About L9 Tools</CardTitle>
                <CardDescription className="text-lg font-sans">
                    Your Ultimate Companion for Lord Nine
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center max-w-2xl mx-auto">
                    <div className="space-y-4">
                        <h3 className="font-cinzel text-xl font-bold text-golden flex items-center justify-center gap-2"><Code className="h-5 w-5" /> Our Mission</h3>
                        <p className="text-muted-foreground">
                            L9 Tools was created by a passionate player with a single goal: to provide the Lord Nine community with the best possible tools to enhance their gaming experience. We focus on creating accurate, easy-to-use, and reliable timers and trackers to help you conquer the game&apos;s biggest challenges.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-cinzel text-xl font-bold text-golden flex items-center justify-center gap-2"><Heart className="h-5 w-5" /> Community Focused</h3>
                        <p className="text-muted-foreground">
                            This is a fan-made project, built for the community, by the community. We are not affiliated with the official developers of Lord Nine. All game assets, trademarks, and copyrights are the property of their respective owners. Our aim is simply to support and grow with the player base.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </L9ToolsLayout>
    </main>
  );
}
