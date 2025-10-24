"use server";

import { z } from "zod";
import { getStatTrackingSuggestions } from "@/ai/flows/stat-tracking-suggestions";
import { findItems } from "@/ai/flows/item-database-assistant";

const statSchema = z.object({
  gearDescription: z.string().min(10, { message: "Please describe your gear in more detail (min 10 characters)." }),
  skillBuildDescription: z.string().min(10, { message: "Please describe your skills in more detail (min 10 characters)." }),
});

interface StatSuggestionState {
  suggestions?: string;
  error?: string;
}

export async function suggestStats(
  prevState: StatSuggestionState,
  formData: FormData
): Promise<StatSuggestionState> {
  const validatedFields = statSchema.safeParse({
    gearDescription: formData.get("gearDescription"),
    skillBuildDescription: formData.get("skillBuildDescription"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.gearDescription?.[0] || validatedFields.error.flatten().fieldErrors.skillBuildDescription?.[0],
    };
  }

  try {
    const result = await getStatTrackingSuggestions(validatedFields.data);
    return { suggestions: result.suggestedStats };
  } catch (e) {
    return { error: "Failed to get suggestions. Please try again." };
  }
}

const itemSchema = z.object({
  query: z.string().min(3, { message: "Please enter a more specific query (min 3 characters)." }),
});

interface ItemFinderState {
  items?: string[];
  error?: string;
}

export async function searchItems(
  prevState: ItemFinderState,
  formData: FormData
): Promise<ItemFinderState> {
  const validatedFields = itemSchema.safeParse({
    query: formData.get("query"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.query?.[0],
    };
  }
  
  try {
    const result = await findItems(validatedFields.data);
    if(result.items.length === 0){
        return { items: ["No items found matching your query."] };
    }
    return { items: result.items };
  } catch (e) {
    return { error: "Failed to find items. Please try again." };
  }
}
