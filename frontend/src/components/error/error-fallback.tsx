import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="fixed w-full flex items-center justify-center h-screen bg-gray-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
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
