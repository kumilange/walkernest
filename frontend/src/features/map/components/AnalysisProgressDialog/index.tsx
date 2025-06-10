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
        <Progress value={progress} className="w-full mt-2" />
        <div className="flex justify-end mt-4">
          <p className="text-sm text-primary">Processing {progress}%</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
