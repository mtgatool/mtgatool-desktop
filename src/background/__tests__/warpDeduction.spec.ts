/**
 * The warped-away deduction, replayed against real (sanitized) GRE data.
 *
 * The fixture is a genuine library search from a Timeless game — the full
 * GreToClientEvent that materializes every library card plus the SearchReq —
 * and the 60-card decklist from the same game's ConnectResp. It carries no
 * player names, account ids, match ids or timestamps (scrubbed and asserted
 * at extraction). The seen-cards state is derived here, not recorded: we
 * CHOOSE which copies are warped away and prime cardsUsed as
 * deck − library − warped, so the expected deduction is known exactly.
 */
import { GREToClientMessage, ZoneInfo } from "../../types/greTypes";
import Deck from "../../utils/mtga/deck";
import forceDeckUpdate from "../forceDeckUpdate";
import GREMessage from "../greToClientInterpreter";
import globalStore from "../store";
import {
  resetCurrentGame,
  resetCurrentMatch,
  setManyGameObjects,
  setManyZones,
  setPlayerCardsUsed,
} from "../store/currentMatchStore";
import fixture from "./fixtures/warpSearch.json";

const HAND_ZONE_ID = 31;
const EXILE_ZONE_ID = 37;
const BATTLEFIELD_ZONE_ID = 41;
const GRAVEYARD_ZONE_ID = 42;
const LIMBO_ZONE_ID = 43;

function counts(list: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  list.forEach((g) => {
    out[g] = (out[g] || 0) + 1;
  });
  return out;
}

const messages = fixture.searchEvent.greToClientEvent
  .greToClientMessages as GREToClientMessage[];
const searchReq = messages.find(
  (m) => m.type === "GREMessageType_SearchReq"
)?.searchReq;
if (!searchReq) throw new Error("fixture lost its SearchReq");

function primeMatch(): {
  warped: number[];
  libraryGrpIds: number[];
} {
  resetCurrentMatch();
  resetCurrentGame();
  globalStore.currentMatch.playerSeat = 1;
  globalStore.currentMatch.oppSeat = 2;
  globalStore.currentMatch.currentDeck = new Deck({}, [...fixture.deckCards]);
  globalStore.currentMatch.originalDeck = new Deck({}, [...fixture.deckCards]);

  // Feed the event's GameStateMessages so the library objects materialize
  // exactly as they did live. The first message of an epoch resets the game
  // state, so the zones must be primed after this, not before — live, they
  // arrive with the game's first full state, which follows the same reset.
  messages
    .filter((m) => m.type === "GREMessageType_GameStateMessage")
    .forEach((m) => GREMessage(m));

  // The zones the handler consults.
  setManyZones([
    {
      zoneId: 32,
      type: "ZoneType_Library",
      visibility: "Visibility_Private",
      ownerSeatId: 1,
    },
    {
      zoneId: HAND_ZONE_ID,
      type: "ZoneType_Hand",
      visibility: "Visibility_Private",
      ownerSeatId: 1,
      objectInstanceIds: [],
    },
    {
      zoneId: EXILE_ZONE_ID,
      type: "ZoneType_Exile",
      visibility: "Visibility_Public",
      ownerSeatId: 1,
      objectInstanceIds: [],
    },
    {
      zoneId: BATTLEFIELD_ZONE_ID,
      type: "ZoneType_Battlefield",
      visibility: "Visibility_Public",
      objectInstanceIds: [],
    },
    {
      zoneId: GRAVEYARD_ZONE_ID,
      type: "ZoneType_Graveyard",
      visibility: "Visibility_Public",
      ownerSeatId: 1,
      objectInstanceIds: [],
    },
  ] as unknown as ZoneInfo[]);

  const objects = globalStore.currentMatch.gameObjects;
  const libraryGrpIds = (searchReq?.itemsToSearch || []).map((iid) => {
    const grpId = objects[iid]?.grpId;
    if (!grpId) throw new Error(`fixture library instance ${iid} unresolved`);
    return grpId;
  });

  // Choose the warped copies from real slack: cards the deck holds beyond
  // what the library shows. Everything else with slack is "seen".
  const deckCounts = counts(fixture.deckCards);
  const libCounts = counts(libraryGrpIds);
  const warped: number[] = [];
  const seen: number[] = [];
  Object.keys(deckCounts).forEach((key) => {
    const grpId = Number(key);
    let slack = deckCounts[grpId] - (libCounts[grpId] || 0);
    if (slack > 0 && warped.length < 3) {
      warped.push(grpId);
      slack -= 1;
    }
    for (let i = 0; i < slack; i += 1) seen.push(grpId);
  });
  if (warped.length === 0) throw new Error("fixture has no slack to warp");

  setPlayerCardsUsed(seen);
  forceDeckUpdate();
  return { warped, libraryGrpIds };
}

describe("warped-away deduction from a library search", () => {
  it("deduces exactly the copies missing from the searched library", () => {
    const { warped } = primeMatch();

    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);

    const missing = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(missing).toEqual([...warped].sort());
  });

  it("drops a warped card when it returns from the exile zone", () => {
    const { warped } = primeMatch();
    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);

    const returned = warped[0];
    expect(globalStore.currentMatch.missingFromLibrary).toContain(returned);

    // The warped card comes back: a zone transfer OUT OF EXILE into the
    // player's hand, exactly as the GRE reports a return from the warp.
    const returnInstance = 990001;
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: returnInstance,
            grpId: returned,
            type: "GameObjectType_Card",
            zoneId: HAND_ZONE_ID,
            visibility: "Visibility_Private",
            ownerSeatId: 1,
            controllerSeatId: 1,
            viewers: [1],
          },
        ],
        zones: [
          {
            zoneId: HAND_ZONE_ID,
            type: "ZoneType_Hand",
            visibility: "Visibility_Private",
            ownerSeatId: 1,
            objectInstanceIds: [returnInstance],
          },
        ],
        annotations: [
          {
            id: 900001,
            affectorId: 0,
            affectedIds: [returnInstance],
            type: ["AnnotationType_ZoneTransfer"],
            details: [
              {
                key: "zone_src",
                type: "KeyValuePairValueType_int32",
                valueInt32: [EXILE_ZONE_ID],
              },
              {
                key: "zone_dest",
                type: "KeyValuePairValueType_int32",
                valueInt32: [HAND_ZONE_ID],
              },
              {
                key: "category",
                type: "KeyValuePairValueType_string",
                valueString: ["Return"],
              },
            ],
          },
        ],
      },
    } as unknown as GREToClientMessage);

    const missingNow = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(missingNow).toEqual(warped.slice(1).sort());
  });

  it("keeps a warped card when another copy is fetched from the library", () => {
    const { warped } = primeMatch();
    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);

    const before = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(before).toEqual([...warped].sort());

    // A DIFFERENT copy of a warped card leaves the library for the hand — a
    // draw or fetch. The warped copy is still gone, so the list must not move.
    const fetchedInstance = 990002;
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: fetchedInstance,
            grpId: warped[0],
            type: "GameObjectType_Card",
            zoneId: HAND_ZONE_ID,
            visibility: "Visibility_Private",
            ownerSeatId: 1,
            controllerSeatId: 1,
            viewers: [1],
          },
        ],
        zones: [
          {
            zoneId: HAND_ZONE_ID,
            type: "ZoneType_Hand",
            visibility: "Visibility_Private",
            ownerSeatId: 1,
            objectInstanceIds: [fetchedInstance],
          },
        ],
        annotations: [
          {
            id: 900002,
            affectorId: 0,
            affectedIds: [fetchedInstance],
            type: ["AnnotationType_ZoneTransfer"],
            details: [
              {
                key: "zone_src",
                type: "KeyValuePairValueType_int32",
                valueInt32: [32],
              },
              {
                key: "zone_dest",
                type: "KeyValuePairValueType_int32",
                valueInt32: [HAND_ZONE_ID],
              },
              {
                key: "category",
                type: "KeyValuePairValueType_string",
                valueString: ["Draw"],
              },
            ],
          },
        ],
      },
    } as unknown as GREToClientMessage);

    const after = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(after).toEqual(before);
  });

  it("drops a warped card revealed face up on the battlefield", () => {
    const { warped } = primeMatch();
    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);
    expect(globalStore.currentMatch.missingFromLibrary).toContain(warped[0]);

    // A face-down object sits on the battlefield...
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: 990010,
            grpId: 3,
            type: "GameObjectType_Card",
            zoneId: BATTLEFIELD_ZONE_ID,
            visibility: "Visibility_Public",
            ownerSeatId: 1,
            controllerSeatId: 1,
          },
        ],
      },
    } as unknown as GREToClientMessage);

    // ...and flips up in place: same zone, new instance id, real card.
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: 990011,
            grpId: warped[0],
            type: "GameObjectType_Card",
            zoneId: BATTLEFIELD_ZONE_ID,
            visibility: "Visibility_Public",
            ownerSeatId: 1,
            controllerSeatId: 1,
          },
        ],
        annotations: [
          {
            id: 900011,
            affectorId: 0,
            affectedIds: [990011],
            type: ["AnnotationType_ObjectIdChanged"],
            details: [
              {
                key: "orig_id",
                type: "KeyValuePairValueType_int32",
                valueInt32: [990010],
              },
              {
                key: "new_id",
                type: "KeyValuePairValueType_int32",
                valueInt32: [990011],
              },
            ],
          },
        ],
      },
    } as unknown as GREToClientMessage);

    const missingNow = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(missingNow).toEqual(warped.slice(1).sort());
  });

  it("keeps a warped card when a known copy of it changes zones", () => {
    const { warped } = primeMatch();
    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);
    const before = [...globalStore.currentMatch.missingFromLibrary].sort();

    // A visible, already-identified copy of a warped card on the battlefield.
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: 990020,
            grpId: warped[0],
            type: "GameObjectType_Card",
            zoneId: BATTLEFIELD_ZONE_ID,
            visibility: "Visibility_Public",
            ownerSeatId: 1,
            controllerSeatId: 1,
          },
        ],
      },
    } as unknown as GREToClientMessage);

    // It dies: new instance id in the graveyard, id change + zone transfer.
    // A known copy moving around is NOT the warped copy coming back.
    GREMessage({
      type: "GREMessageType_GameStateMessage",
      gameStateMessage: {
        type: "GameStateType_Diff",
        gameObjects: [
          {
            instanceId: 990021,
            grpId: warped[0],
            type: "GameObjectType_Card",
            zoneId: GRAVEYARD_ZONE_ID,
            visibility: "Visibility_Public",
            ownerSeatId: 1,
            controllerSeatId: 1,
          },
        ],
        annotations: [
          {
            id: 900021,
            affectorId: 0,
            affectedIds: [990021],
            type: ["AnnotationType_ObjectIdChanged"],
            details: [
              {
                key: "orig_id",
                type: "KeyValuePairValueType_int32",
                valueInt32: [990020],
              },
              {
                key: "new_id",
                type: "KeyValuePairValueType_int32",
                valueInt32: [990021],
              },
            ],
          },
          {
            id: 900022,
            affectorId: 0,
            affectedIds: [990021],
            type: ["AnnotationType_ZoneTransfer"],
            details: [
              {
                key: "zone_src",
                type: "KeyValuePairValueType_int32",
                valueInt32: [BATTLEFIELD_ZONE_ID],
              },
              {
                key: "zone_dest",
                type: "KeyValuePairValueType_int32",
                valueInt32: [GRAVEYARD_ZONE_ID],
              },
              {
                key: "category",
                type: "KeyValuePairValueType_string",
                valueString: ["Destroy"],
              },
            ],
          },
        ],
      },
    } as unknown as GREToClientMessage);

    const after = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(after).toEqual(before);
  });

  it("does not count a card in transit through Limbo as warped", () => {
    const { warped } = primeMatch();

    // The fetchland cracked to pay for this very search: in Limbo when the
    // request arrives, with no forward id mapping yet. Beside it, a stale
    // Limbo id whose card already completed its transition — Limbo keeps
    // those forever, and they must not subtract a second copy.
    const inFlight = 990030;
    const stale = 990031;
    setManyGameObjects([
      {
        instanceId: inFlight,
        grpId: warped[0],
        type: "GameObjectType_Card",
        zoneId: LIMBO_ZONE_ID,
        visibility: "Visibility_Public",
        ownerSeatId: 1,
        controllerSeatId: 1,
      },
      {
        instanceId: stale,
        grpId: warped[0],
        type: "GameObjectType_Card",
        zoneId: LIMBO_ZONE_ID,
        visibility: "Visibility_Public",
        ownerSeatId: 1,
        controllerSeatId: 1,
      },
    ] as unknown as Parameters<typeof setManyGameObjects>[0]);
    setManyZones([
      {
        zoneId: LIMBO_ZONE_ID,
        type: "ZoneType_Limbo",
        visibility: "Visibility_Public",
        objectInstanceIds: [inFlight, stale],
      },
    ] as unknown as ZoneInfo[]);
    globalStore.currentMatch.idChanges[stale] = 990032;

    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);

    // Exactly one copy excused by transit — not two.
    const missing = [...globalStore.currentMatch.missingFromLibrary].sort();
    expect(missing).toEqual(warped.slice(1).sort());
  });

  it("bails without touching state when the library is not fully resolved", () => {
    primeMatch();
    // Wipe one searched instance: an unresolvable library must produce no
    // deduction at all rather than a wrong one.
    const firstItem = (searchReq?.itemsToSearch || [])[0];
    delete globalStore.currentMatch.gameObjects[firstItem];
    delete globalStore.currentMatch.instanceToCardIdMap[firstItem];

    const searchMessage = messages.find(
      (m) => m.type === "GREMessageType_SearchReq"
    ) as GREToClientMessage;
    GREMessage(searchMessage);

    expect(globalStore.currentMatch.missingFromLibrary).toEqual([]);
  });
});
