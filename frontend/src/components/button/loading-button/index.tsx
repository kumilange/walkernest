import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export default function LoadingButton({
  loading = false,
  children = "Analyzing...",
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || props.disabled}
      className={`flex gap-2 ${props.className || ""}`}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}
