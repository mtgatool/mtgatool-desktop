import { format, fromUnixTime } from "date-fns";
import { useSelector } from "react-redux";

import info from "../../../info.json";
import { AppState } from "../../../redux/stores/rendererStore";
import database from "../../../utils/mtga/database";
import openExternal from "../../../utils/openExternal";

const METADATA_RELEASES =
  "https://github.com/mtgatool/mtgatool-metadata/releases";

const PRIVACY_POLICY = "https://mtgatool.com/docs/privacy";

export default function AboutSettingsPanel(): JSX.Element {
  const updateState = useSelector(
    (state: AppState) => state.renderer.updateState
  );
  return (
    <div className="about">
      <div
        className="top-logo-about"
        onClick={(): void => openExternal("https://mtgatool.com")}
      />
      <div className="message-sub15">
        By Manuel Etchegaray &quot;Manwë&quot;, {new Date().getFullYear()}
      </div>
      <div
        className="message-sub15 release-notes-link"
        onClick={(): void => {
          openExternal(
            "https://github.com/mtgatool/mtgatool-desktop/releases/latest"
          );
        }}
      >
        {`Version ${info.version}`}
      </div>
      {database.metadata ? (
        <>
          <div
            className="message-sub15 release-notes-link"
            onClick={(): void => {
              openExternal(
                database.metadata?.version
                  ? `${METADATA_RELEASES}/tag/v${database.metadata.version}`
                  : `${METADATA_RELEASES}/latest`
              );
            }}
          >
            {`Metadata v${database.metadata.version || "???"} (${
              database.lang
            })`}
          </div>
          <div className="message-sub15">
            Updated{" "}
            {database.metadata.updated
              ? format(fromUnixTime(database.metadata.updated / 1000), "Pp")
              : "???"}
          </div>
        </>
      ) : (
        <></>
      )}
      {/* Rendered only when there is something to say; it previously showed a
          bare "-" placeholder whenever no update was in progress. */}
      {updateState ? (
        <div className="message-updates green">{updateState}</div>
      ) : (
        <></>
      )}

      <div style={{ margin: "16px auto 0px auto" }} className="flex-item">
        <div
          className="discord-link"
          onClick={(): void => openExternal("https://discord.gg/K9bPkJy")}
        />
        <div
          className="git-link"
          onClick={(): void =>
            openExternal("https://github.com/mtgatool/mtgatool-desktop#readme")
          }
        />
      </div>
      <div style={{ margin: "16px 0px 16px" }} className="message-sub15 white">
        Support my work!
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          className="donate-link"
          title="PayPal"
          onClick={(): void =>
            openExternal("https://www.paypal.me/ManuelEtchegaray/10")
          }
        />
        <div
          className="patreon-link"
          title="Patreon"
          onClick={(): void => openExternal("https://www.patreon.com/mtgatool")}
        />
      </div>
      <div
        style={{ margin: "24px auto 0px auto" }}
        className="message-sub15 link"
        onClick={(): void => openExternal(PRIVACY_POLICY)}
      >
        Privacy Policy
      </div>
    </div>
  );
}
