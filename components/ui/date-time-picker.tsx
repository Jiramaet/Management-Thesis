"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date)

  // Update local state when prop changes
  React.useEffect(() => {
    if (date) {
        setSelectedDateTime(date);
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
        setSelectedDateTime(undefined);
        setDate(undefined);
        return;
    }

    // Preserve time from current selection or default to 09:00
    const newDateTime = new Date(selectedDate);
    if (selectedDateTime) {
        newDateTime.setHours(selectedDateTime.getHours());
        newDateTime.setMinutes(selectedDateTime.getMinutes());
    } else {
        newDateTime.setHours(9);
        newDateTime.setMinutes(0);
    }
    
    setSelectedDateTime(newDateTime);
    setDate(newDateTime);
  };

  const handleTimeSelect = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDateTime = selectedDateTime ? new Date(selectedDateTime) : new Date();
    
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    
    setSelectedDateTime(newDateTime);
    setDate(newDateTime);
  };

  // Generate time slots (every 30 mins)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = (i % 2) * 30;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP HH:mm") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
            <Label className="text-xs font-medium mb-2 block">Time</Label>
            <Select 
                onValueChange={handleTimeSelect} 
                defaultValue={selectedDateTime ? format(selectedDateTime, "HH:mm") : "09:00"}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent position="popper" className="h-[200px]">
                    {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                            {time}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
