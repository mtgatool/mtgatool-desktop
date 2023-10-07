import { useDispatch, useSelector } from "react-redux";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { ReactComponent as DeleteIcon } from "../../assets/images/svg/trash.svg";
import reduxAction from "../../redux/reduxAction";
import { AppState } from "../../redux/stores/rendererStore";
import upsertDbUserdata from "../../toolDb/upsertDbuserdata";
import removePlayerUUID from "../../utils/removePlayerUUID";
import SvgButton from "../SvgButton";
import Radio from "../ui/Radio";

interface ArenaIdSelectorProps {
  onClose: () => void;
}

export default function ArenaIdSelector(props: ArenaIdSelectorProps) {
  const { onClose } = props;

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );
  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const dispatch = useDispatch();

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "22px 16px 16px 16px" }}>
        <h3 style={{ marginBottom: "16px" }}>MTG Arena Account User and ID</h3>
        {Object.keys(uuidData)
          .filter((v) => v !== "undefined")
          .map((uuid) => {
            const { displayName } = uuidData[uuid];
            const selected = currentUUID === uuid;
            return (
              <div style={{ display: "flex" }} key={`uuid-selector-${uuid}`}>
                <Radio
                  containerStyle={{
                    width: "100%",
                  }}
                  text={
                    <p>
                      {displayName || "Unknown"}
                      {` - `}
                      <i
                        style={{
                          color: "var(--color-text-dark)",
                        }}
                      >
                        {uuid}
                      </i>
                    </p>
                  }
                  value={selected}
                  callback={() => {
                    upsertDbUserdata({ [uuid]: new Date().getTime() });
                    reduxAction(dispatch, {
                      type: "SET_UUID",
                      arg: uuid,
                    });
                  }}
                />
                <SvgButton
                  style={{
                    height: "44px",
                    width: "44px",
                    background: "var(--color-section)",
                    margin: "auto 0 auto 8px",
                  }}
                  svg={DeleteIcon}
                  onClick={() => removePlayerUUID(uuid)}
                />
              </div>
            );
          })}

        <p style={{ marginTop: "16px", color: "var(--color-text-dark)" }}>
          <b style={{ color: "var(--color-r)" }}>Warning: </b>
          Your cards, decks, matches and rank data are filtered depending on
          your MTGA account. Switching while you play with a different MTGA
          account will result on data being mixed between accounts unexpectedly.
          {` `}
          <b>MTG Arena Tool will switch</b> between accounts automatically
          depending on what it sees as the current account to avoid this from
          happening.
        </p>
      </div>
    </>
  );
}
