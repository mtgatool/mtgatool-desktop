/* eslint-disable radix */
import { GREToClientMessage } from "mtgatool-shared/dist/types/greTypes";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import GREMessage from "../greToClientInterpreter";
import { setCurrentMatchMany } from "../store/currentMatchStore";

interface EntryJson {
  transactionId: string;
  timestamp: string;
  greToClientEvent: {
    greToClientMessages: GREToClientMessage[];
  };
}

interface Entry extends LogEntry {
  playerId?: string;
  json: EntryJson;
}

export default function GreToClient(entry: Entry): void {
  if (entry.playerId) {
    postChannelMessage({
      type: "SET_UUID",
      value: entry.playerId,
    });
  }
  if (
    entry.jsonString &&
    entry.jsonString ==
      "[Message summarized because one or more GameStateMessages exceeded the 50 GameObject or 50 Annotation limit.]"
  ) {
    console.info("GRE Message summarized");
    return;
  }
  const { json } = entry;

  if (json.timestamp) {
    setCurrentMatchMany({
      logTime: new Date(parseInt(json.timestamp)),
    });
  }

  if (json?.greToClientEvent?.greToClientMessages) {
    const message = json.greToClientEvent.greToClientMessages;
    message.forEach((msg) => {
      GREMessage(msg);
      /*
      const msgId = msg.msgId;
      globals.currentMatch.GREtoClient[msgId] = msg;
      globals.currentMatch.latestMessage = msgId;
      greToClientInterpreter.GREMessageByID(msgId, globals.logTime);
      */
    });
  } else {
    console.log("No gre to client in entry?", json);
  }
}
