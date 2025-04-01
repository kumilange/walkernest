import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getErrorMessage } from "@/lib/misc";
import ErrorDialogContent from "./error-dialog-content";
import useLifecycle from "./use-lifecycle";

export default function AnalysisProgressDialog({ cityId }: { cityId: number }) {
  const { isOpen, setIsOpen, progress, isError, error } = useLifecycle({
    cityId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Analysis Progress</DialogTitle>
        <DialogDescription className="sr-only">
          {isError
            ? getErrorMessage(error)
            : "Analyzing suitable apartments..."}
        </DialogDescription>
        {isError ? (
          <ErrorDialogContent setOpen={setIsOpen} error={error} />
        ) : (
          <>
            <p className="text-primary">{"Analyzing suitable apartments..."}</p>
            <Progress value={progress} className="w-full mt-2" />
            <div className="flex justify-end mt-4">
              <p className="text-sm text-primary">Processing {progress}%</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
