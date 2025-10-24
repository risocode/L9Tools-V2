"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestStats } from "@/app/actions";

const formSchema = z.object({
  gearDescription: z.string().min(10, { message: "Please provide more details on your gear." }).max(500),
  skillBuildDescription: z.string().min(10, { message: "Please provide more details on your skills." }).max(500),
});

type FormValues = z.infer<typeof formSchema>;

export function StatSuggester() {
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gearDescription: "I am using the Dragonscale Helm, Plate of the Damned, and the Blade of the Archon.",
      skillBuildDescription: "My build is focused on the Whirlwind ability, with points in damage and area of effect increase.",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("gearDescription", data.gearDescription);
      formData.append("skillBuildDescription", data.skillBuildDescription);
      
      const result = await suggestStats({ suggestions: undefined, error: undefined }, formData);

      if (result.error) {
        setError(result.error);
        setSuggestions(null);
      }
      if(result.suggestions) {
        setSuggestions(result.suggestions);
        setError(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="text-primary" /> AI Stat Advisor</CardTitle>
          <CardDescription>Describe your gear and skills to get personalized stat recommendations from our AI.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gearDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Gear</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Full fire-resist armor set, two-handed axe..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skillBuildDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Build</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Maxed out 'Fireball' and 'Ice Armor' skills..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Suggestions
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline">Recommendations</CardTitle>
            <CardDescription>AI-powered advice to optimize your character.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isPending && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && !isPending && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {suggestions && !isPending && (
            <div className="prose prose-invert prose-sm text-foreground whitespace-pre-wrap font-body">
              {suggestions}
            </div>
          )}
          {!suggestions && !error && !isPending && (
             <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <Wand2 className="w-10 h-10 mb-2"/>
                <p>Your stat suggestions will appear here.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
