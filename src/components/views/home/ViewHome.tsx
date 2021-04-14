import { useRef } from "react";
import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import PopupComponent from "../../PopupComponent";
import voiFn from "../../../utils/voidfn";
import PassphraseGenerate from "../../PassphraseGenerate";
import Button from "../../ui/Button";
import createOverlay from "../../../overlay/createOverlay";

export default function ViewHome() {
  const openPopup = useRef<() => void>(voiFn);
  const closePopup = useRef<() => void>(voiFn);

  return (
    <div className="section">
      <PopupComponent
        open={false}
        width="1000px"
        height="500px"
        openFnRef={openPopup}
        closeFnRef={closePopup}
      >
        <PassphraseGenerate onClose={closePopup.current} />
      </PopupComponent>

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
        onClick={openPopup.current}
        text="Generate recovery key"
      />
      <Button
        style={{
          margin: "auto",
        }}
        onClick={() => createOverlay().then(() => console.log("closeddd!"))}
        text="Test overaly"
      />
    </div>
  );
}
