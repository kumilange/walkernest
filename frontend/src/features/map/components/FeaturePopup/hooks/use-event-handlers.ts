import { useCallback, useState } from "react";
import { useAtomIsFavPopupOpen } from "../../../stores/favoritesAtoms";

export default function useEventHandlers() {
  const { setIsFavPopupOpen } = useAtomIsFavPopupOpen();
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleClick = useCallback(() => {
    setIsFavPopupOpen(true);
  }, [setIsFavPopupOpen]);

  const handleInteraction = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      handleClick();
    },
    [handleClick]
  );

  return {
    isHovering,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleInteraction,
  };
}
