import { Rectangle } from "electron";
import getPrimaryMonitor from "./getPrimaryMonitor";

export default function getDisplayPosition(
  bounds: Rectangle,
  displayRect?: Rectangle
): { x: number; y: number } {
  const windowBounds = displayRect || getPrimaryMonitor().bounds;
  const primaryPos = { x: 0, y: 0 };
  primaryPos.x = windowBounds.x - bounds.x;
  primaryPos.y = windowBounds.y - bounds.y;
  return primaryPos;
}
