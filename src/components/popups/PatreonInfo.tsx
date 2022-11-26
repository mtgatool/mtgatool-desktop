import { useCallback, useEffect, useState } from "react";

import openExternal from "../../utils/openExternal";

interface DialogProps {
  closeCallback?: () => void;
}

export default function PatreonInfo(props: DialogProps): JSX.Element {
  const { closeCallback } = props;
  const [open, setOpen] = useState(0);

  const handleClose = useCallback(
    (e) => {
      setOpen(0);
      e.stopPropagation();
      if (closeCallback) {
        closeCallback();
      }
    },
    [closeCallback]
  );

  useEffect(() => {
    // React doesnt give css time to know there was a change
    // in the properties, adding a timeout solves that.
    setTimeout(() => {
      setOpen(1);
    }, 1);
  }, []);

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
        className="popup-div-nopadding"
        style={{
          height: `${open * 340}px`,
          width: `${open * 520}px`,
          overflow: "initial",
        }}
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        <div className="patreon-info-pop-top">
          <div
            style={{ color: "var(--color-text-hover)" }}
            className="message-sub"
          >
            You discovered a Patreon exclusive feature!
          </div>
        </div>
        <div className="patreon-info-pop-bottom">
          <div className="patreon-info-text">
            Synchronize your data across multiple devices
          </div>
          <div className="patreon-info-text">
            Access global cards winrate statistics
          </div>
          <div className="patreon-info-text">Get priority Support</div>
          <div className="patreon-info-text">
            Help us develop new amazing features!
          </div>
          <div className="patreon-desc-text">
            See our patreon page to learn more about upcoming and planned
            features:
          </div>
          <div
            className="patreon-link-thin"
            title="Open on browser"
            onClick={(): void =>
              openExternal("https://www.patreon.com/mtgatool")
            }
          />
        </div>
      </div>
    </div>
  );
}
