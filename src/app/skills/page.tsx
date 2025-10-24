import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillTree } from '@/components/skills/skill-tree';
import { warriorSkills, mageSkills, rogueSkills } from '@/lib/data';

export default function SkillsPage() {
  return (
    <AppLayout title="Skill Tree Planner">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">Skill Planner</h2>
          <p className="text-muted-foreground">Design your character's build and explore skill synergies.</p>
        </div>
        <Tabs defaultValue="warrior" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="warrior">Warrior</TabsTrigger>
            <TabsTrigger value="mage">Mage</TabsTrigger>
            <TabsTrigger value="rogue">Rogue</TabsTrigger>
          </TabsList>
          <TabsContent value="warrior">
            <Card>
              <CardContent className="pt-6">
                <SkillTree key="warrior" treeData={warriorSkills} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mage">
            <Card>
              <CardContent className="pt-6">
                <SkillTree key="mage" treeData={mageSkills} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="rogue">
            <Card>
              <CardContent className="pt-6">
                <SkillTree key="rogue" treeData={rogueSkills} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
