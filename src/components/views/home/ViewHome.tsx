import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import Button from "../../ui/Button";
import createOverlay from "../../../overlay/createOverlay";

export default function ViewHome() {
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
          onClick={() => createOverlay(0).then(() => console.log("closeddd!"))}
          text="Test overaly"
        />
      </div>
    </>
  );
}
