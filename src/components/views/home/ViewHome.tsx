import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import Button from "../../ui/Button";
import createOverlay from "../../../overlay/createOverlay";

interface ViewHomeProps {
  openPassphrasePopup: () => void;
}

export default function ViewHome(props: ViewHomeProps) {
  const { openPassphrasePopup } = props;

  return (
    <>
      <div className="section">
        <Button
          style={{
            margin: "auto",
          }}
          onClick={() => {
            postChannelMessage({
              type: "START_LOG_READING",
            });
          }}
          text="Re-read log"
        />
        <Button
          style={{
            margin: "auto",
          }}
          onClick={openPassphrasePopup}
          text="Generate recovery key"
        />
        <Button
          style={{
            margin: "auto",
          }}
          onClick={() => createOverlay(0).then(() => console.log("closeddd!"))}
          text="Test overaly"
        />
      </div>
    </>
  );
}
