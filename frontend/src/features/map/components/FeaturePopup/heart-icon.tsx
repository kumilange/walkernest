import { Heart } from "lucide-react";
import useEventHandlers from "./hooks/use-event-handlers";

export default function HeartIcon() {
  const { isHovering, handleMouseEnter, handleMouseLeave, handleInteraction } = useEventHandlers();

  return (
    <Heart
      size="20px"
      fill={isHovering ? "#ff93ac" : "none"}
      className="transition-all duration-200 ease-in-out text-apartmentLine hover:text-apartmentLine cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
    />
  );
}
