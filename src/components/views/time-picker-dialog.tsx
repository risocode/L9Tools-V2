
"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, set } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Boss } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Loader from '../ui/loader';

interface TimePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    boss: Boss | null;
    isSubmitting: boolean;
    onConfirm: (boss: Boss, killedAt: Date) => Promise<void>;
}

export function TimePickerDialog({ isOpen, onClose, boss, isSubmitting, onConfirm }: TimePickerDialogProps) {
  const [manualDate, setManualDate] = useState<Date | undefined>(new Date());
  const [manualHour, setManualHour] = useState<string>('');
  const [manualMinute, setManualMinute] = useState<string>('');
  const [manualAmPm, setManualAmPm] = useState<string>('AM');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showSlowLoadingTip, setShowSlowLoadingTip] = useState(false);
  const { toast } = useToast();

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

  useEffect(() => {
    if (isOpen) {
        const now = new Date();
        setManualDate(now);
        setManualHour(String(now.getHours() % 12 || 12));
        setManualMinute(String(now.getMinutes()).padStart(2, '0'));
        setManualAmPm(now.getHours() >= 12 ? 'PM' : 'AM');
        setShowSlowLoadingTip(false); // Reset tip on open
    }
  }, [isOpen]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isSubmitting) {
      timer = setTimeout(() => {
        setShowSlowLoadingTip(true);
      }, 5000); // 5 seconds
    } else {
      setShowSlowLoadingTip(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  const handleDateSelect = (date: Date | undefined) => {
    setManualDate(date);
    setIsCalendarOpen(false); // Close the calendar on selection
  };

  const handleSubmit = async () => {
    if (!boss) return;
    
    if (!manualDate || manualHour.trim() === '' || manualMinute.trim() === '') {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a valid date and time."});
      return;
    }
  
    let hour24 = parseInt(manualHour, 10);
    const minute = parseInt(manualMinute, 10);
  
    if (isNaN(hour24) || isNaN(minute) || hour24 < 1 || hour24 > 12 || minute < 0 || minute > 59) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Please enter a valid hour (1-12) and minute (0-59)."});
      return;
    }
    
    if (manualAmPm === 'PM' && hour24 < 12) hour24 += 12;
    if (manualAmPm === 'AM' && hour24 === 12) hour24 = 0;

    const killedAt = set(manualDate, { hours: hour24, minutes: minute, seconds: 0, milliseconds: 0 });
    
    await onConfirm(boss, killedAt);
    onClose();
  };

  const bossName = boss ? boss.name : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
            className={cn(
                "glowing-card max-w-md bg-transparent border-0 shadow-none p-0",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
            )}
        >
          <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10">
            <DialogHeader className="text-center">
                <DialogTitle className="text-2xl">{`Set Time of Death for ${bossName}`}</DialogTitle>
                <DialogDescription className="font-sans">
                    Enter the date and time the boss was defeated.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2 text-center">
                    <Label htmlFor="date" className="text-lg">Date</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-center text-center font-normal text-lg h-12 futuristic-select-trigger", !manualDate && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {manualDate ? format(manualDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 mx-auto">
                            <Calendar
                                mode="single"
                                selected={manualDate}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-2 text-center">
                        <Label htmlFor="hour" className="text-lg">Hour</Label>
                        <Select value={manualHour} onValueChange={setManualHour}>
                            <SelectTrigger variant="futuristic" id="hour" className="text-xl h-14"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {hours.map(h => <SelectItem key={h} value={h} className="text-lg">{h}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2 text-center">
                        <Label htmlFor="minute" className="text-lg">Minute</Label>
                        <Select value={manualMinute} onValueChange={setManualMinute}>
                            <SelectTrigger variant="futuristic" id="minute" className="text-xl h-14"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {minutes.map(m => <SelectItem key={m} value={m} className="text-lg">{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2 text-center">
                        <Label htmlFor="ampm" className="text-lg">AM/PM</Label>
                        <Select value={manualAmPm} onValueChange={setManualAmPm}>
                          <SelectTrigger variant="futuristic" id="ampm" className="text-xl h-14"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM" className="text-lg">AM</SelectItem>
                            <SelectItem value="PM" className="text-lg">PM</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            {showSlowLoadingTip && (
                <div className="text-center text-xs text-muted-foreground/50 pt-2">
                    Tip: If this takes too long, try a hard refresh (Ctrl + Shift + R).
                </div>
            )}
            <DialogFooter className="pt-4">
                <DialogClose asChild><Button variant="destructive">Cancel</Button></DialogClose>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader className="mr-2" />}
                  <span>Set Time</span>
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
    </Dialog>
  );
}
