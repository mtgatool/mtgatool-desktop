import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { ActionLogLine } from "../components/action-log-v2/types";
import globalStore from "./store";

const actionLog = (line: ActionLogLine): void => {
  globalStore.currentActionLog.lines.push(line);

  postChannelMessage({
    type: "ACTION_LOG",
    value: globalStore.currentActionLog,
  });
};

export default actionLog;
