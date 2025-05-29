import type React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./error-fallback";

export default function ErrorBoundary({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onReset={onReset}>
      {children}
    </ReactErrorBoundary>
  );
}
