import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mainQuests, sideQuests } from "@/lib/data";

interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: Objective[];
}

function QuestCard({ quest }: { quest: Quest }) {
  return (
    <Card className="mb-4 bg-card/50 transition-shadow hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <CardTitle className="font-headline">{quest.title}</CardTitle>
        <CardDescription>{quest.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Objectives</h4>
          {quest.objectives.map((obj) => (
            <div key={obj.id} className="flex items-center space-x-2">
              <Checkbox id={`${quest.id}-${obj.id}`} defaultChecked={obj.completed} />
              <Label htmlFor={`${quest.id}-${obj.id}`} className={`text-base ${obj.completed ? 'line-through text-muted-foreground' : ''}`}>
                {obj.text}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function QuestList() {
  return (
    <Accordion type="multiple" defaultValue={["main-quests", "side-quests"]} className="w-full">
      <AccordionItem value="main-quests">
        <AccordionTrigger className="text-xl font-headline">Main Story Quests</AccordionTrigger>
        <AccordionContent>
          {mainQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="side-quests">
        <AccordionTrigger className="text-xl font-headline">Side Quests</AccordionTrigger>
        <AccordionContent>
          {sideQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
