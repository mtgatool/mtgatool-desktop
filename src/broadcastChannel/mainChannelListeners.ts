import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import setMatch from "../gun/setMatch";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import { ChannelMessage } from "./channelMessages";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);

    if (msg.data.type === "LOG_MESSAGE_RECV") {
      const entry = msg.data.value as LogEntry;

      const completion = entry.position / entry.size;
      // console.log(`Log read completion: ${Math.round(completion * 100)}%`);
      if (Date.now() - last > 333) {
        last = Date.now();
        reduxAction(store.dispatch, {
          type: "SET_LOG_COMPLETION",
          arg: completion,
        });
      }
    }

    if (msg.data.type == "LOG_READ_FINISHED") {
      if (store.getState().renderer.loading === true) {
        reduxAction(store.dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_OK,
        });
        reduxAction(store.dispatch, {
          type: "SET_LOADING",
          arg: false,
        });
      }
    }

    if (msg.data.type === "GAME_STATS") {
      setMatch(msg.data.value);
      console.log(msg.data.value);
    }
  };
}
