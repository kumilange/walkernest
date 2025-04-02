import { getErrorMessage } from "@/lib/misc";
import { AlertTriangle } from "lucide-react";

export default function ErrorDialogContent({
  setOpen,
  error,
}: {
  setOpen: (open: boolean) => void;
  error: Error | null;
}) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center justify-center w-full space-x-2">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h3 className="text-lg font-bold text-red-500">Analysis Failed</h3>
      </div>
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-500 text-center">{getErrorMessage(error)}</p>
      </div>
      <div className="flex justify-center w-full mt-4">
        <button
          onClick={() => setOpen(false)}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark outline-none transition-colors duration-200 shadow-sm"
          aria-label="Close error dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
}
