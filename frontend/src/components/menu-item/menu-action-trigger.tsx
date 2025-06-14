import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type React from "react";

type MenuActionTriggerProps = {
  icon: React.ReactNode;
  tooltip: string;
};

export default function MenuActionTrigger({ icon, tooltip }: MenuActionTriggerProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label={tooltip}>
              {icon}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
