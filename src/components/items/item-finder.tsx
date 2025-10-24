"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "../ui/input";
import { searchItems } from "@/app/actions";

const formSchema = z.object({
  query: z.string().min(3, { message: "Query must be at least 3 characters." }).max(100),
});

type FormValues = z.infer<typeof formSchema>;

export function ItemFinder() {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("query", data.query);
      
      const result = await searchItems({ items: undefined, error: undefined }, formData);

      if (result.error) {
        setError(result.error);
        setItems(null);
      }
      if(result.items) {
        setItems(result.items);
        setError(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Item Database Assistant</CardTitle>
          <CardDescription>Use the AI assistant to find items based on your needs. Try "a sword that does fire damage" or "level 50 healing potions".</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="Search for items..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="sr-only">Search</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Search Results</CardTitle>
        </CardHeader>
        <CardContent className="h-48 overflow-y-auto">
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
          {items && !isPending && (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="text-sm p-2 bg-secondary/50 rounded-md">
                  {item}
                </li>
              ))}
            </ul>
          )}
          {!items && !error && !isPending && (
             <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                <Search className="w-10 h-10 mb-2"/>
                <p>Your item search results will appear here.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
