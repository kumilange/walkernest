import { Heart } from "lucide-react";
import useEventHandlers from "./hooks/use-event-handlers";

export default function HeartIcon() {
  const { isHovering, handleMouseEnter, handleMouseLeave, handleInteraction } = useEventHandlers();

  return (
    <Heart
      size="20px"
      fill={isHovering ? "#ff93ac" : "none"}
      className="cursor-pointer text-apartmentLine transition-all duration-200 ease-in-out hover:text-apartmentLine"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
    />
  );
}
