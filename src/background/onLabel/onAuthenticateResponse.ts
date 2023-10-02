import { MatchServiceToClientMessage } from "mtgatool-shared/dist/types/greTypes";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import setLocalSetting from "../../utils/setLocalSetting";

interface Entry extends LogEntry {
  json: MatchServiceToClientMessage;
}

export default function onAuthenticateResponse(entry: Entry): void {
  const { json } = entry;

  if (json.authenticateResponse && json.authenticateResponse.clientId) {
    setLocalSetting("playerId", json.authenticateResponse.clientId);
    postChannelMessage({
      type: "SET_UUID_DISPLAYNAME",
      value: {
        uuid: json.authenticateResponse.clientId,
        displayName: json.authenticateResponse.screenName || undefined,
      },
    });
  }
}
