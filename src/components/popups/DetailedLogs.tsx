import { useState } from "react";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";

interface DetailedLogsProps {
  onClose: () => void;
}

export default function DetailedLogs(props: DetailedLogsProps) {
  const { onClose } = props;

  const [page, setPage] = useState(0);

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "22px 16px 16px 16px" }}>
        <h2 style={{ marginBottom: "16px", color: "var(--color-r)" }}>
          Detailed Logs are disabled!
        </h2>

        <p style={{ color: "var(--color-text-dark)" }}>
          Detailed logs enables plugins support on MTG Arena, this is required
          for MTG Arena Tool to work. You can enable detailed logs on MTG Arena
          with few simple steps
        </p>

        <div
          className="page-slider-container"
          style={{ marginTop: "48px", height: "380px" }}
        >
          <div
            className="page-slider"
            style={{
              transform: `translateX(-${page * 100}%)`,
            }}
          >
            <div className="slide">
              <p>
                On MTG Arena, click on the setting icon and click on
                &quot;Account&quot;
              </p>
              <div className="slide-img-a" />
            </div>
            <div className="slide">
              <p>
                Here, simply enable &quot;Detailed Logs&quot;,{" "}
                <b
                  style={{
                    color: "var(--color-r)",
                  }}
                >
                  You will need to restart MTG Arena for the change to take
                  effect.
                </b>
              </p>
              <div className="slide-img-b" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "36px",
              width: "120px",
              margin: "auto",
            }}
            className="button-simple"
            onClick={() => setPage(page === 0 ? 1 : 0)}
          >
            {page === 0 ? "Next" : "Previous"}
          </div>
        </div>
      </div>
    </>
  );
}
