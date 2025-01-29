"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface UnderlyingSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  prioritizedOptions?: string[];
}

export function UnderlyingSelect({ options, value, onChange, prioritizedOptions = [] }: UnderlyingSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const sortedOptions = React.useMemo(() => {
    const prioritized = prioritizedOptions.filter((opt) => options.includes(opt));
    const nonPrioritized = options.filter((opt) => !prioritized.includes(opt));
    return [...prioritized, ...nonPrioritized];
  }, [options, prioritizedOptions]);

  const filteredOptions = sortedOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value || "Select an underlying..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1">
        <div className="flex flex-col h-[300px]">
          <Input
            type="text"
            placeholder="Search underlying..."
            className="w-full p-2 border-b sticky top-0 bg-white z-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="flex-1 overflow-y-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
                {value === option && <Check className="ml-auto h-4 w-4" />}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
