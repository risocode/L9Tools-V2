
"use client";

import * as React from "react";
import { format, set } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./input";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ date, setDate, className }: TimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      setIsCalendarOpen(false);
      return;
    }
    const newDate = set(date || new Date(), {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
      date: selectedDate.getDate(),
    });
    setDate(newDate);
    setIsCalendarOpen(false);
  };
  
  const handleTimeChange = (part: 'hour' | 'minute' | 'ampm', value: string) => {
      if (!date) return;
      let newDate = new Date(date);
      
      if (part === 'hour') {
          let hour = parseInt(value, 10);
          if (!isNaN(hour) && hour >= 1 && hour <= 12) {
              const currentAmPm = newDate.getHours() >= 12 ? 'PM' : 'AM';
              if (currentAmPm === 'PM' && hour !== 12) hour += 12;
              if (currentAmPm === 'AM' && hour === 12) hour = 0;
              newDate = set(newDate, { hours: hour });
          }
      } else if (part === 'minute') {
          const minute = parseInt(value, 10);
          if (!isNaN(minute) && minute >= 0 && minute <= 59) {
              newDate = set(newDate, { minutes: minute });
          }
      } else if (part === 'ampm') {
          let currentHour = newDate.getHours();
          if (value === 'PM' && currentHour < 12) {
              newDate = set(newDate, { hours: currentHour + 12 });
          } else if (value === 'AM' && currentHour >= 12) {
              newDate = set(newDate, { hours: currentHour - 12 });
          }
      }
      setDate(newDate);
  }

  const hourValue = date ? (date.getHours() % 12 || 12).toString() : '';
  const minuteValue = date ? date.getMinutes().toString().padStart(2, '0') : '';
  const ampmValue = date ? (date.getHours() >= 12 ? 'PM' : 'AM') : 'AM';

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn("w-full sm:flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
        <div className="flex items-center gap-1">
            <Input
              type="text"
              value={hourValue}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              className="w-12 text-center"
              disabled={!date}
              maxLength={2}
            />
            <span>:</span>
            <Input
              type="text"
              value={minuteValue}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              className="w-12 text-center"
              disabled={!date}
              maxLength={2}
            />
            <Select value={ampmValue} onValueChange={(val) => handleTimeChange('ampm', val)} disabled={!date}>
                <SelectTrigger className="w-[80px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );
}
