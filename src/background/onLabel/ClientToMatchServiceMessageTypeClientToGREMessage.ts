/* eslint-disable @typescript-eslint/no-var-requires */
import { Deck } from "mtgatool-shared";
import { ClientToGREMessage } from "mtgatool-shared/dist/types/greTypes";

import LogEntry from "mtgatool-shared/dist/types/logDecoder";
import { setOnThePlay } from "../store/currentMatchStore";
import globalStore from "../store";
import normaliseFields from "../../utils/normaliseFields";

const messages = require("../messages_pb");

interface Entry extends LogEntry {
  json: ClientToGREMessage;
}

function decodePayload(payload: any, msgType: string): any {
  const binaryMsg = Buffer.from(payload, "base64");

  try {
    let msgDeserialiser;
    if (
      msgType === "ClientToGREMessage" ||
      msgType === "ClientToGREUIMessage"
    ) {
      msgDeserialiser = messages.ClientToGREMessage;
    } else if (msgType === "ClientToMatchDoorConnectRequest") {
      msgDeserialiser = messages.ClientToMatchDoorConnectRequest;
    } else if (msgType === "AuthenticateRequest") {
      msgDeserialiser = messages.AuthenticateRequest;
    } else if (msgType === "CreateMatchGameRoomRequest") {
      msgDeserialiser = messages.CreateMatchGameRoomRequest;
    } else if (msgType === "EchoRequest") {
      msgDeserialiser = messages.EchoRequest;
    } else {
      console.warn(`${msgType} - unknown message type`);
      return undefined;
    }
    const msg = msgDeserialiser.deserializeBinary(binaryMsg);
    return msg.toObject();
  } catch (e) {
    console.error(e.message);
  }
  return undefined;
}

export default function ClientToMatchServiceMessageTypeClientToGREMessage(
  entry: Entry
): void {
  const { json } = entry;
  if (!json) return;
  // if (skipMatch) return;
  let payload: ClientToGREMessage = json;
  /*
  if (json.Payload) {
    payload = json.Payload;
  }
  */

  if (typeof payload == "string") {
    const msgType = entry.label.split("_")[1];
    payload = decodePayload(payload, msgType);
  }
  // The sideboarding log message has changed format multiple times, sometimes
  // going back to an earlier format. normaliseFields, together with the
  // conditional decodePayload call, allows the same code to handle each known
  // format in case Arena changes it again.
  payload = normaliseFields(payload);

  if (payload.submitDeckResp) {
    // debugLog("Client To GRE: ", payload);
    // Get sideboard changes
    const deckResp = payload.submitDeckResp?.deck || {
      deckCards: [],
      sideboardCards: [],
      commanderCards: [],
    };

    const currentDeck = globalStore.currentMatch.currentDeck.getSave();

    const newDeck = new Deck(
      currentDeck,
      deckResp.deckCards,
      deckResp.sideboardCards
    );
    globalStore.currentMatch.currentDeck = newDeck;
  }
  // We can safely handle these messages too now !
  if (payload.type == "ClientMessageType_ChooseStartingPlayerResp") {
    if (payload.chooseStartingPlayerResp) {
      const startingPlayer = payload.chooseStartingPlayerResp.systemSeatId;
      if (startingPlayer) {
        setOnThePlay(startingPlayer);
      }
    }
  }
}
