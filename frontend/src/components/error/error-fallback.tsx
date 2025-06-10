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
    <div className="fixed flex h-screen w-full items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <TriangleAlert size={24} />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-red-100 text-red-800">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message || "An unexpected error has occurred."}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button
              onClick={() => {
                resetErrorBoundary();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
