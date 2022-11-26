import { useCallback, useEffect, useState } from "react";

import Button from "../ui/Button";

interface EditKeyProps {
  closeCallback?: (log: string) => void;
}

export default function EditKey(props: EditKeyProps): JSX.Element {
  const { closeCallback } = props;
  const [keyDesc, setKeyDesc] = useState("");
  const [open, setOpen] = useState(0);

  const handleClose = useCallback(() => {
    if (!open) return;
    setOpen(0);
    setTimeout(() => {
      if (closeCallback) {
        closeCallback(keyDesc);
      }
    }, 300);
  }, [closeCallback, keyDesc, open]);

  const reportKeyEvent = useCallback((zEvent: KeyboardEvent): void => {
    const keys = [];

    if (zEvent.ctrlKey) keys.push("Control");
    if (zEvent.shiftKey) keys.push("Shift");
    if (zEvent.altKey) keys.push("Alt");
    if (zEvent.metaKey) keys.push("Meta");

    if (!["Control", "Shift", "Alt", "Meta"].includes(zEvent.key))
      keys.push(zEvent.key);

    const reportStr = keys.join("+");
    setKeyDesc(reportStr);
    zEvent.stopPropagation();
    zEvent.preventDefault();
  }, []);

  useEffect(() => {
    // React doesnt give css time to know there was a change
    // in the properties, adding a timeout solves that.
    setTimeout(() => {
      setOpen(1);
    }, 1);

    document.addEventListener("keydown", reportKeyEvent as any);
    return (): void => {
      document.removeEventListener("keydown", reportKeyEvent as any);
    };
  }, [reportKeyEvent]);

  return (
    <div
      className="popup-background"
      style={{
        opacity: open * 2,
        backgroundColor: `rgba(0, 0, 0, ${0.5 * open})`,
      }}
      onClick={handleClose}
    >
      <div
        className="popup-div"
        style={{
          transform: `scale(${open ? 1 : 0.5})`,
          height: `160px`,
          width: `400px`,
          color: "var(--color-back)",
        }}
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        <div style={{ marginBottom: "26px" }} className="message-sub">
          Press any key combination
        </div>
        <div style={{ marginBottom: "26px" }} className="message-sub">
          {keyDesc || "-"}
        </div>
        <Button style={{ margin: "auto" }} text="Ok" onClick={handleClose} />
      </div>
    </div>
  );
}
