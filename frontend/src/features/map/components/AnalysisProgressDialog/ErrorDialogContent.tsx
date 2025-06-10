import { getErrorMessage } from "@/utils/misc";
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
      <div className="flex w-full items-center justify-center space-x-2">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h3 className="font-bold text-lg text-red-500">Analysis Failed</h3>
      </div>
      <div className="w-full rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-center text-red-500">{getErrorMessage(error)}</p>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md bg-primary px-6 py-2 text-white shadow-sm outline-none transition-colors duration-200 hover:bg-primary-dark"
          aria-label="Close error dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
}
