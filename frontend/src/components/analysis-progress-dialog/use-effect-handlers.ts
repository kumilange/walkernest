import { useEffect, useRef, useState } from "react";
import { useAnalysis } from "@/lib/fetcher";
import { generateCityDataParams } from "@/lib/misc";
import { useAtomIsAmenityOn, useAtomMaxDistance } from "@/atoms";
import {
  CLOSE_DIALOG_DELAY_MS,
  PROGRESS_INCREMENT,
  PROGRESS_INTERVAL_MS,
  PROGRESS_MAX,
} from "./constants";

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
    if (isFirstFetching || isError) {
      setIsOpen(true);
      setProgress(isError ? 100 : 0); // Set progress to 100% if error (to stop animation)
    }
  }, [isFirstFetching, isError]);

  useEffect(() => {
    if (isFirstFetching && isOpen && !isError) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          return Math.min(prev + PROGRESS_INCREMENT, PROGRESS_MAX);
        });
      }, PROGRESS_INTERVAL_MS);
    } else if ((!isFetching && isOpen && progress < 100) || isError) {
      clearInterval(progressIntervalRef.current as NodeJS.Timeout);
      setProgress(100);
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
