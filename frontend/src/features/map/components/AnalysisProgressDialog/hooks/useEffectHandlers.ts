import { useAnalysis } from "@/features/map/api";
import { generateCityDataParams } from "@/utils/misc";
import { useEffect, useRef, useState } from "react";
import { useAtomIsAmenityOn, useAtomMaxDistance } from "../../../stores/analysisAtoms";
import {
  CLOSE_DIALOG_DELAY_MS,
  PROGRESS_INCREMENT,
  PROGRESS_INTERVAL_MS,
  PROGRESS_MAX,
} from "../constants";
// import { useAtomPois, useAtomAnalysisResult } from "@/features/map/stores";

export default function useEffectHandlers({ cityId }: { cityId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { maxDistance } = useAtomMaxDistance();
  const { isAmenityOn } = useAtomIsAmenityOn();
  const params = generateCityDataParams({ maxDistance, isAmenityOn });

  const { data, isError, error, isFetching } = useAnalysis({
    cityId: cityId ?? 0,
    ...params,
  });
  const isFirstFetching = cityId && !data && isFetching;

  useEffect(() => {
    if (isFirstFetching) {
      setIsOpen(true);
      setProgress(0);
    }
  }, [isFirstFetching]);

  useEffect(() => {
    if (isFirstFetching && isOpen && !isError) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          return Math.min(prev + PROGRESS_INCREMENT, PROGRESS_MAX);
        });
      }, PROGRESS_INTERVAL_MS);
    } else if ((!isFetching && isOpen && progress < 100) || isError) {
      clearInterval(progressIntervalRef.current as NodeJS.Timeout);
      if (isError) {
        // Close dialog immediately on error so only toast is shown
        setIsOpen(false);
      } else {
        setProgress(100);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isFetching, isOpen, progress, isError, isFirstFetching]);

  useEffect(() => {
    if (progress === 100 && !isError) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, CLOSE_DIALOG_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [progress, isError]);

  return { isOpen, setIsOpen, progress, isError, error };
}
