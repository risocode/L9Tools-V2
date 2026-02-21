
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Trash2, Info } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Loader from '../ui/loader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export interface ReportBoss {
  id: string;
  name: string;
  level: number;
  spawnTime: string;
  isFixedSpawn: boolean;
}

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bosses: ReportBoss[];
  onConfirm: (bosses: ReportBoss[], webhookUrl: string) => void;
  isSending: boolean;
  isGuest: boolean;
}

export function ReportDialog({ isOpen, onClose, bosses, onConfirm, isSending, isGuest }: ReportDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editableBosses, setEditableBosses] = useState<ReportBoss[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEditableBosses(bosses);
      // Prioritize user's saved webhook, then local storage, then empty
      const savedWebhook = user?.discord_webhook_url || localStorage.getItem('discordWebhookUrl');
      if (savedWebhook) {
        setWebhookUrl(savedWebhook);
      } else {
        setWebhookUrl('');
      }
    }
  }, [isOpen, bosses, user]);

  const handleRemoveBoss = (bossId: string) => {
    setEditableBosses(currentBosses => currentBosses.filter(b => b.id !== bossId));
  };

  const handleConfirm = () => {
    if (!webhookUrl) {
        toast({ variant: "destructive", title: "Missing Webhook URL", description: "Please enter a webhook URL." });
        return;
    }
    onConfirm(editableBosses, webhookUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
            "glowing-card sm:max-w-2xl bg-transparent border-0 shadow-none p-0 grid-rows-[auto_1fr_auto] max-h-[90vh]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col max-h-[calc(90vh-1rem)]">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Send className="h-6 w-6" />
              Confirm Boss Report
            </DialogTitle>
            <DialogDescription>
              Review the list of upcoming boss spawns before sending the report to Discord.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mt-4">
              {isGuest && (
                  <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
                      <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                          <div>
                          <h3 className="font-bold text-primary">You are in Guest Mode!</h3>
                          <p className="text-sm text-primary/80">
                              Timers reset after sending a report or refreshing the page. Sign in to save your data permanently.
                          </p>
                          </div>
                      </div>
                  </div>
              )}
              <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="webhook-url">Discord Webhook URL</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button>
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="text-sm max-w-xs sm:max-w-sm">
                        <h4 className="font-bold mb-2">How to get a Webhook URL</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>Go to Server Settings {'>'} Integrations.</li>
                          <li>Click Webhooks {'>'} New Webhook.</li>
                          <li>Name it and choose a channel.</li>
                          <li>Click Copy Webhook URL.</li>
                        </ol>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                      id="webhook-url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                  />
              </div>
              
              <p className="text-sm font-medium">{`Bosses to Report (${editableBosses.length})`}</p>
              <div className="h-60 border border-[#00e5ff]/20 rounded-md bg-[#0d1117]/50">
                  <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-[#0d1117]/90 backdrop-blur-sm z-10">
                          <TableRow className="border-b-[#00e5ff]/20">
                            <TableHead className="w-[40%] text-[#00e5ff]">Boss</TableHead>
                            <TableHead className="w-[15%] text-[#00e5ff]">Lvl</TableHead>
                            <TableHead className="text-[#00e5ff]">Spawn Time</TableHead>
                            <TableHead className="text-right w-[10%] text-[#00e5ff]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {editableBosses.length > 0 ? editableBosses.map((boss) => (
                            <TableRow key={boss.id} className="border-b-[#00e5ff]/10 hover:bg-[#15202b]/70">
                                <TableCell className="font-medium text-white">{boss.name}</TableCell>
                                <TableCell className="text-muted-foreground">{boss.level}</TableCell>
                                <TableCell className="text-muted-foreground">{boss.spawnTime}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveBoss(boss.id)} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No upcoming boss spawns to report.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                      </Table>
                  </ScrollArea>
              </div>
          </div>
          
          <DialogFooter className="mt-4 border-t pt-4">
            <div className="flex gap-2 justify-end shrink-0 w-full">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={isSending}>
                {isSending && <Loader className="mr-2" />}
                Send to Discord
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
