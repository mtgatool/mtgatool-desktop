import { GREToClientMessage } from "mtgatool-shared/dist/types/greTypes";
import LogEntry from "../../types/logDecoder";
import GREMessage from "../greToClientInterpreter";
import parseLogTimestamp from "../../utils/parseLogTimestamp";
import { matchStateObject } from "../store/currentMatchStore";

interface EntryJson {
  transactionId: string;
  timestamp: string;
  greToClientEvent: {
    greToClientMessages: GREToClientMessage[];
  };
}

interface Entry extends LogEntry {
  json: EntryJson;
}

export default function GreToClient(entry: Entry): void {
  if (
    entry.jsonString &&
    entry.jsonString ==
      "[Message summarized because one or more GameStateMessages exceeded the 50 GameObject or 50 Annotation limit.]"
  ) {
    console.info("GRE Message summarized");
    return;
  }
  const { json } = entry;

  if (json?.greToClientEvent?.greToClientMessages) {
    matchStateObject.logTime = parseLogTimestamp(json.timestamp);
    const message = json.greToClientEvent.greToClientMessages;
    message.forEach((msg) => {
      GREMessage(msg, matchStateObject.logTime);
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
