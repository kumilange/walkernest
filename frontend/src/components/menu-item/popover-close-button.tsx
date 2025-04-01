import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";

export default function PopoverCloseButton() {
  return (
    <PopoverClose asChild>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6"
      >
        <X className="h-4 w-4" />
      </Button>
    </PopoverClose>
  );
}
