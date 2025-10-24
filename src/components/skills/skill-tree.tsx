"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Skill, SkillNode } from './skill-node';
import { Button } from '../ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface SkillTreeProps {
  treeData: Skill[];
  maxPoints?: number;
}

export function SkillTree({ treeData, maxPoints = 50 }: SkillTreeProps) {
  const [spentPoints, setSpentPoints] = useState(0);
  const [activeSkills, setActiveSkills] = useState<Record<string, number>>({});

  const skillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    treeData.forEach(skill => map.set(skill.id, skill));
    return map;
  }, [treeData]);

  const handleReset = () => {
    setSpentPoints(0);
    setActiveSkills({});
  };

  const handleSkillChange = useCallback((skill: Skill, newLevel: number) => {
    const currentLevel = activeSkills[skill.id] || 0;
    const pointDifference = newLevel - currentLevel;

    if (spentPoints + pointDifference > maxPoints) {
      return; // Not enough points
    }

    // Check dependencies
    if (newLevel > 0 && skill.dependencies) {
      for (const depId of skill.dependencies) {
        const depSkill = skillMap.get(depId);
        if (!depSkill || (activeSkills[depId] || 0) < (depSkill.maxLevel || 1)) {
          return; // Dependency not met
        }
      }
    }

    setSpentPoints(prev => prev + pointDifference);
    setActiveSkills(prev => {
      const newActiveSkills = { ...prev };
      if (newLevel === 0) {
        delete newActiveSkills[skill.id];
      } else {
        newActiveSkills[skill.id] = newLevel;
      }

      // Check for skills that depend on this one and de-level them if necessary
      treeData.forEach(s => {
        if (s.dependencies?.includes(skill.id) && newLevel < (skill.maxLevel || 1)) {
          if (newActiveSkills[s.id]) {
            const pointsToRefund = newActiveSkills[s.id];
            delete newActiveSkills[s.id];
            setSpentPoints(current => current - pointsToRefund);
          }
        }
      });
      
      return newActiveSkills;
    });
  }, [spentPoints, activeSkills, maxPoints, treeData, skillMap]);

  const tierLevels = useMemo(() => [...new Set(treeData.map(s => s.tier))].sort((a,b) => a-b), [treeData]);
  const tierSkills = useMemo(() => {
    const tiers: Record<number, Skill[]> = {};
    for(const skill of treeData) {
      if(!tiers[skill.tier]) tiers[skill.tier] = [];
      tiers[skill.tier].push(skill);
    }
    return tiers;
  }, [treeData]);

  return (
    <div className="space-y-6">
      <Card className="bg-background/50 sticky top-16 z-10">
        <CardHeader className="p-4">
            <div className="flex justify-between items-center">
                <CardTitle className="font-headline">Skill Points</CardTitle>
                <div className="text-right">
                    <p className="text-2xl font-headline font-bold">
                        <span className={spentPoints > maxPoints ? 'text-destructive' : 'text-primary'}>{spentPoints}</span>
                        <span className="text-muted-foreground"> / {maxPoints}</span>
                    </p>
                </div>
            </div>
            <CardDescription>Allocate points to unlock and level up skills.</CardDescription>
        </CardHeader>
      </Card>

      <div className="relative space-y-8">
        {tierLevels.map(tier => (
          <div key={`tier-${tier}`} className="space-y-4">
             <div className="flex items-center gap-4">
               <Separator className="flex-1"/>
               <h3 className="font-headline text-lg text-muted-foreground">Tier {tier}</h3>
               <Separator className="flex-1"/>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
              {(tierSkills[tier] || []).map(skill => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  level={activeSkills[skill.id] || 0}
                  onLevelChange={(newLevel) => handleSkillChange(skill, newLevel)}
                  canLevelUp={spentPoints < maxPoints && (!skill.dependencies || skill.dependencies.every(depId => {
                      const depSkill = skillMap.get(depId);
                      return depSkill && (activeSkills[depId] || 0) >= (depSkill.maxLevel || 1);
                  }))}
                  canLevelDown={(activeSkills[skill.id] || 0) > 0}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="destructive" onClick={handleReset}>Reset All Points</Button>
      </div>
    </div>
  );
}
