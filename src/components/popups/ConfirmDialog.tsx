import { ReactNode } from "react";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import Button from "../ui/Button";

interface ConfirmDialogProps {
  title: string;
  text: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Paints the confirm button red — for destructive, irreversible actions. */
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Generic yes/no dialog, meant to be rendered inside a `PopupComponent` the
 * same way ArenaIdSelector / DetailedLogs are.
 */
export default function ConfirmDialog(props: ConfirmDialogProps): JSX.Element {
  const { title, text, confirmText, cancelText, danger, onConfirm, onClose } =
    props;

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div
        style={{
          flex: 1,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <div
          className="message-sub"
          style={{
            color: danger ? "var(--color-r)" : "var(--color-text)",
            marginBottom: "20px",
          }}
        >
          {title}
        </div>
        <div
          className="message-sub-15"
          style={{
            color: "var(--color-text-dark)",
            marginBottom: "24px",
          }}
        >
          {text}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
          }}
        >
          <Button
            className="button-simple-dark"
            text={cancelText || "Cancel"}
            onClick={onClose}
          />
          <Button
            className={danger ? "button-simple-red" : "button-simple"}
            text={confirmText || "Confirm"}
            onClick={(): void => {
              onConfirm();
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
}
