/* eslint-disable no-undef */
import { toPng } from "html-to-image";

import remote from "./electron/remoteWrapper";

/** Breathing room around the exported image, in CSS px. */
const PADDING = 16;

/**
 * Render a piece of the page to a PNG and save it.
 *
 * Rasterises the DOM rather than screenshotting the window. Electron's
 * `capturePage` would be the obvious route on the desktop and needs no
 * library, but it can only capture what is on screen — a deck list taller than
 * the window comes out cut off, and this popup scrolls. Walking the DOM
 * captures the whole element however much is out of view, and gives the web
 * build the same output for free.
 *
 * Only the saving differs between the two: a browser gets a download, Electron
 * gets a save dialog, because a renderer download would land silently in the
 * downloads folder with no say in where it goes.
 */
export default async function saveNodeAsImage(
  node: HTMLElement,
  filename: string
): Promise<boolean> {
  const dataUrl = await toPng(node, {
    // The canvas is sized from the node's own width, but the clone keeps the
    // node's margins — and this one is centred in the popup, so a computed
    // left margin of (640-480)/2 shifted every row right and pushed the mana
    // column clean off the edge. Zeroing it keeps the full width in frame.
    //
    // The padding is then the image's own margin, with the canvas grown to
    // match: sized to the node alone, padding would eat into the content
    // rather than surround it. content-box because the app sets border-box
    // globally, which would do exactly that.
    width: node.offsetWidth + PADDING * 2,
    height: node.offsetHeight + PADDING * 2,
    style: {
      margin: "0",
      padding: `${PADDING}px`,
      boxSizing: "content-box",
    },
    // The popup is translucent over whatever is behind it; on its own that
    // rasterises to a see-through image.
    backgroundColor: "#141516",
    // Retina-ish, so the text is still sharp when viewed full size.
    pixelRatio: 2,
    // The card art is remote and already cached by the page. A cache-buster
    // would refetch every image, and a miss renders as a blank card.
    cacheBust: false,
  });

  if (remote) {
    const { canceled, filePath } = await remote.dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: "PNG image", extensions: ["png"] }],
    });
    if (canceled || !filePath) return false;

    const fs = __non_webpack_require__("fs");
    fs.writeFileSync(
      filePath,
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
    return true;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
  return true;
}

/** A deck name is user input; a filename cannot be. */
export function imageFileName(name: string): string {
  const safe = (name || "deck")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "deck"}.png`;
}
