import { useSelector } from "react-redux";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { AppState } from "../../redux/stores/rendererStore";
import switchPlayerUUID from "../../utils/switchPlayerUUID";
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

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "22px 16px 16px 16px" }}>
        <h3 style={{ marginBottom: "16px" }}>
          Arena User ID{" "}
          <i style={{ color: "var(--color-text-dark)" }}>
            (Wizards Account ID)
          </i>
        </h3>
        {Object.keys(uuidData).map((uuid) => {
          const selected = currentUUID === uuid;
          return (
            <div key={`uuid-selector-${uuid}`}>
              <Radio
                text={uuid}
                value={selected}
                callback={() => {
                  switchPlayerUUID(uuid);
                }}
              />
            </div>
          );
        })}

        <p style={{ marginTop: "16px", color: "var(--color-text-dark)" }}>
          <b style={{ color: "var(--color-r)" }}>Warning: </b>
          Your cards, decks, matches and rank data are filtered depending on
          your account id. Switching this while you play with a different
          account will result on data being mixed between accounts unexpectedly.
          MTG Arena Tool might switch between account ids to avoid this from
          happening.
        </p>
      </div>
    </>
  );
}
