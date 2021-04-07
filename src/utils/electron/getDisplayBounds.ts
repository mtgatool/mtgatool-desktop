import { Display, Rectangle, remote } from "electron";

export default function getDisplayBounds(allDisplays?: Display[]): Rectangle {
  // eslint-disable-next-line global-require
  const newBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
  const displays = allDisplays || remote.screen.getAllDisplays();
  newBounds.x = Math.min(...displays.map((display) => display.bounds.x));
  newBounds.y = Math.min(...displays.map((display) => display.bounds.y));

  displays.forEach((display) => {
    newBounds.width = Math.max(
      newBounds.width,
      Math.abs(newBounds.x) + display.bounds.x + display.bounds.width
    );
    newBounds.height = Math.max(
      newBounds.height,
      Math.abs(newBounds.y) + display.bounds.y + display.bounds.height
    );
  });
  return newBounds;
}
