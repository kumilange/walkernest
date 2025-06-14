import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCallback } from "react";

type CloseButtonProps = {
  handleClose: () => void;
};

export default function CloseButton({ handleClose }: CloseButtonProps) {
  // Touch event handler for mobile support
  const handleCloseTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleClose();
    },
    [handleClose]
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleClose}
      onTouchEnd={handleCloseTouch}
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
