import { cn } from "@/utils/misc";
import React from "react";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      aria-label="Loading"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    >
      {children}
    </div>
  )
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
