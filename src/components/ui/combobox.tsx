
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Circle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const comboboxTriggerVariants = cva(
  "w-full justify-between",
  {
    variants: {
      variant: {
        default: "h-10",
        futuristic: "futuristic-select-trigger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ComboboxProps extends VariantProps<typeof comboboxTriggerVariants> {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function Combobox({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option...", 
    disabled,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    variant,
}: ComboboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === 'futuristic' ? 'ghost' : 'outline'}
          role="combobox"
          aria-expanded={open}
          className={cn(comboboxTriggerVariants({ variant }), "relative")}
          disabled={disabled}
        >
          <span className="block truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  className="flex items-center justify-start"
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Circle 
                    className={cn(
                      "mr-2 h-2 w-2",
                      value === option.value ? "fill-current text-primary" : "text-muted"
                    )} 
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
