import { useState, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";

interface DialogProps {
  error: any;
  errorInfo: any;
  closeCallback?: () => void;
}

export default function PatreonInfo(props: DialogProps): JSX.Element {
  const { closeCallback, error, errorInfo } = props;
  const history = useHistory();
  const [open, setOpen] = useState(0);

  const handleClose = useCallback(
    (e) => {
      setOpen(0);
      history.push("/home");
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
          height: `${open * 400}px`,
          width: `${open * 640}px`,
          overflow: "initial",
        }}
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        <div className="error-info-top" />
        <div className="error-info-bottom">
          <div className="error-info-title">An error ocurred</div>
          <div className="error-info-text">
            <div>{error && error.toString()}</div>
            <details style={{ whiteSpace: "pre-wrap" }}>
              <div>{errorInfo.componentStack}</div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
