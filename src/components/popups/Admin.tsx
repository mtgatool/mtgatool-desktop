import { useState } from "react";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import Button from "../ui/Button";

interface AdminProps {
  onClose: () => void;
}

export default function Admin(props: AdminProps) {
  const { onClose } = props;

  const [page, setPage] = useState(0);

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "22px 16px 16px 16px" }}>
        <h2 style={{ marginBottom: "16px", color: "var(--color-r)" }}>
          MTG Arena Tool requires Administrator privileges!
        </h2>

        <p style={{ color: "var(--color-text-dark)" }}>
          Administrator privileges are required for MTG Arena Tool to record
          some of the data it needs to function properly, like ranks and
          collection. You can run MTG Arena Tool as an Administrator by right
          clicking on the shortcut and selecting &quot;Run as
          Administrator&quot;
        </p>

        <div
          className="page-slider-container"
          style={{ marginTop: "48px", height: "320px" }}
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
