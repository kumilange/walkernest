import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <main
      className="fixed flex h-screen w-full items-center justify-center bg-gray-50"
      aria-labelledby="error-title"
    >
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle id="error-title" className="flex items-center gap-2 text-red-600">
            <TriangleAlert className="h-5 w-5" />
            Error occurred
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-red-100 text-red-800" role="alert" aria-live="assertive">
            <h2 className="mb-2 font-semibold text-lg">Error</h2>
            <AlertDescription className="text-sm">
              {error?.message || "An error occurred while loading this page."}
            </AlertDescription>
          </Alert>
          <Button onClick={resetErrorBoundary} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
