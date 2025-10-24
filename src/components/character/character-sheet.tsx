import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Shield, Sword, Gem, Heart, Brain, Zap, VenetianMask } from "lucide-react";

const mainStats = [
  { name: "Strength", value: 128, icon: Sword },
  { name: "Intelligence", value: 75, icon: Brain },
  { name: "Dexterity", value: 92, icon: Zap },
  { name: "Vitality", value: 110, icon: Heart },
];

const secondaryStats = [
  { name: "Attack Power", value: 580 },
  { name: "Spell Power", value: 320 },
  { name: "Crit Chance", value: "25%" },
  { name: "Haste", value: "15%" },
];

const gearSlots = [
  { slot: "Head", item: "Dragonscale Helm", imageId: "helmet" },
  { slot: "Chest", item: "Plate of the Damned", imageId: "chestplate" },
  { slot: "Hands", item: "Gauntlets of Power", imageId: "gauntlets" },
  { slot: "Legs", item: "Shadowstep Legguards", imageId: "leggings" },
  { slot: "Feet", item: "Boots of Swiftness", imageId: "boots" },
  { slot: "Main Hand", item: "Blade of the Archon", imageId: "sword" },
  { slot: "Off Hand", item: "Aegis of the Protector", imageId: "shield" },
];

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export function CharacterSheet() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Gem className="text-primary"/> Primary Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {mainStats.map((stat) => (
                <li key={stat.name} className="flex justify-between items-center text-lg">
                  <div className="flex items-center gap-3">
                    <stat.icon className="w-5 h-5 text-accent" />
                    <span className="font-body">{stat.name}</span>
                  </div>
                  <span className="font-headline font-bold text-xl">{stat.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Shield className="text-primary"/> Combat Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center pb-2">
                <span className="font-body text-lg flex items-center gap-3"><Heart className="w-5 h-5 text-red-500" /> Health</span>
                <span className="font-headline font-bold text-xl">24,580</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-body text-lg flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" /> Mana</span>
                <span className="font-headline font-bold text-xl">12,340</span>
            </div>
            <Separator className="my-4" />
            <ul className="space-y-3">
              {secondaryStats.map((stat) => (
                <li key={stat.name} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{stat.name}</span>
                  <span className="font-semibold">{stat.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><VenetianMask className="text-primary"/> Equipped Gear</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {gearSlots.map((slot) => {
              const image = getImage(slot.imageId);
              return (
              <li key={slot.slot} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                {image && <Image src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} width={40} height={40} className="rounded-md border-2 border-border" />}
                <div>
                  <p className="font-semibold">{slot.item}</p>
                  <p className="text-sm text-muted-foreground">{slot.slot}</p>
                </div>
              </li>
            )})}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
