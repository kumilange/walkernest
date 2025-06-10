import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import useEffectHandlers from "./hooks/useEffectHandlers";

export default function AnalysisProgressDialog({ cityId }: { cityId: number }) {
  const { isOpen, setIsOpen, progress } = useEffectHandlers({
    cityId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Analysis Progress</DialogTitle>
        <DialogDescription className="sr-only">Analyzing suitable apartments...</DialogDescription>
        <p className="text-primary">{"Analyzing suitable apartments..."}</p>
        <Progress value={progress} className="mt-2 w-full" />
        <div className="mt-4 flex justify-end">
          <p className="text-primary text-sm">Processing {progress}%</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
