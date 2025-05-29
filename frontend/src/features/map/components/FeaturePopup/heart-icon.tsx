import { Heart } from "lucide-react";
import { useCallback, useState } from "react";
import { useAtomIsFavPopupOpen } from "../../stores/favoritesAtoms";

export default function HeartIcon() {
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

  return (
    <Heart
      size="20px"
      fill={isHovering ? "#ff93ac" : "none"}
      className="transition-all duration-200 ease-in-out text-apartmentLine hover:text-apartmentLine cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
