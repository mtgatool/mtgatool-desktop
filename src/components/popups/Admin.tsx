import { useState } from "react";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { relaunchAsAdmin } from "../../utils/tauri/app";
import isTauri from "../../utils/tauri/isTauri";
import Button from "../ui/Button";

interface AdminProps {
  onClose: () => void;
}

export default function Admin(props: AdminProps) {
  const { onClose } = props;

  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [relaunching, setRelaunching] = useState(false);

  const doRelaunch = (): void => {
    setError("");
    setRelaunching(true);
    // On success the app exits and this promise never resolves; on a
    // cancelled UAC prompt it rejects and we surface a message.
    relaunchAsAdmin().catch((e: unknown) => {
      setRelaunching(false);
      setError(
        typeof e === "string"
          ? e
          : "Could not restart as administrator. Please launch it manually."
      );
    });
  };

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "22px 16px 16px 16px" }}>
        <h2 style={{ marginBottom: "16px", color: "var(--color-r)" }}>
          MTG Arena Tool needs Administrator privileges
        </h2>

        <p style={{ color: "var(--color-text-dark)" }}>
          MTG Arena runs elevated, so this app must run elevated too in order to
          read the game&apos;s memory. Without it, your account, collection,
          decks, rank and inventory can&apos;t be read and will appear empty.
        </p>

        {isTauri() && (
          <div style={{ display: "flex", marginTop: "20px" }}>
            <Button
              style={{ width: "220px", margin: "auto" }}
              text={
                relaunching ? "Waiting for UAC…" : "Restart as Administrator"
              }
              disabled={relaunching}
              onClick={doRelaunch}
            />
          </div>
        )}

        {error !== "" && (
          <p
            style={{
              color: "var(--color-r)",
              textAlign: "center",
              marginTop: "12px",
            }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            color: "var(--color-text-dark)",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          You can also right-click the shortcut and choose &quot;Run as
          administrator&quot;, or set it permanently below.
        </p>

        <div
          className="page-slider-container"
          style={{ marginTop: "16px", height: "320px" }}
        >
          <div
            className="page-slider"
            style={{
              transform: `translateX(-${page * 100}%)`,
            }}
          >
            <div className="slide">
              <div className="slide-img-admin-a" />
            </div>
            <div className="slide">
              <p>
                Alternatively, you can set the application executable to always
                run as Administrator. Right click on the application executable
                and select &quot;Properties&quot;, under the
                &quot;Compatibility&quot; tab;
              </p>
              <div className="slide-img-admin-b" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          <Button
            style={{
              width: "140px",
              margin: "auto",
            }}
            text={page === 0 ? "Next" : "Previous"}
            onClick={() => setPage(page === 0 ? 1 : 0)}
          />
        </div>
      </div>
    </>
  );
}
