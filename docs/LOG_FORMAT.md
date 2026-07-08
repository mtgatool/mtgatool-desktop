# MTGA Player.log format (2026 re-alignment)

Log path: `%USERPROFILE%\AppData\LocalLow\Wizards Of The Coast\MTGA\Player.log`
(needs **Detailed Logs** enabled in MTGA → Settings → Account; the log prints
`DETAILED LOGS: ENABLED` when it is).

## Two entry formats

**API request/response** (deck/rank/event/etc. calls):
```
[UnityCrossThreadLogger]==> GraphGetGraphState {"id":"...","request":"{...}"}
[UnityCrossThreadLogger]<timestamp>
<== GraphGetGraphState(<uuid>)
{ ...response json... }
```
The response label + json now sit on the two lines *after* an
`[UnityCrossThreadLogger]<timestamp>` line. `arena-log-decoder.ts` already
handles both via `LABEL_ARROW_JSON_PATTERN` / `_NEW`.

**In-match GRE stream** (unchanged shape):
```
[UnityCrossThreadLogger]<timestamp>: Match to <personaId>: GreToClientEvent
{ ...json... }
```

## What changed

Wizards dropped the `Namespace_Method` / `Namespace.Method` separators on the
API-call labels (and bumped some versions / renamed some methods). The GRE
match-stream labels were unchanged. The decoder regexes still work — only the
label strings in `logEntrySwitch.ts` needed updating.

### Label mapping

CONFIRMED = observed in a live 2026-07 log. UNVERIFIED = not exercised in the
captured sessions (no draft / pack open / deck submit / AI practice); the new
name is inferred from the observed convention and should be checked against a
live log when that action is performed.

| Old label | Current label | Status |
|---|---|---|
| `Graph_GetGraphState` | `GraphGetGraphState` | CONFIRMED |
| `Rank_GetCombinedRankInfo` | `RankGetCombinedRankInfo` | CONFIRMED |
| `Event.GetSeasonAndRankDetail` | `RankGetSeasonAndRankDetails` | CONFIRMED |
| `Deck.GetDeckListsV3` | `DeckGetDeckSummariesV3` | CONFIRMED |
| `Deck.GetPreconDecks` | `DeckGetAllPreconDecksV3` | CONFIRMED |
| `Deck.UpdateDeckV3` | `DeckUpsertDeckV3` | CONFIRMED |
| `Event_SetDeckV2` | `EventSetDeckV3` | CONFIRMED |
| `Event.GetPlayerCoursesV2` | `EventGetCoursesV2` | CONFIRMED |
| `PlayerInventory.GetFormats` | `GetFormats` | CONFIRMED |
| `StartHook` | `StartHook` | CONFIRMED (unchanged) |
| `Client.SceneChange` | `Client.SceneChange` | CONFIRMED (unchanged) |
| `GreToClientEvent` | `GreToClientEvent` | CONFIRMED (unchanged) |
| `MatchGameRoomStateChangedEvent` | `MatchGameRoomStateChangedEvent` | CONFIRMED (unchanged) |
| `AuthenticateResponse` | `AuthenticateResponse` | CONFIRMED (unchanged) |
| `ClientToMatchServiceMessageType_ClientToGREMessage` | `ClientToGremessage` | CONFIRMED |
| `Event.GetPlayerCourseV2` | `EventGetCourseV2` | UNVERIFIED |
| `Event_GetCourses` | `EventGetCourses` | UNVERIFIED |
| `Event_GetActiveEvents` | `EventGetActiveEvents` | UNVERIFIED |
| `Event.DeckSubmitV3` | `EventDeckSubmitV3` | UNVERIFIED |
| `Event.AIPractice` | `EventAIPractice` | UNVERIFIED |
| `DirectGame.Challenge` | `DirectGameChallenge` | UNVERIFIED |
| `Progression.GetPlayerProgress` | `ProgressionGetPlayerProgress` | UNVERIFIED |
| `PlayerInventory.GetRewardSchedule` | `PlayerInventoryGetRewardSchedule` | UNVERIFIED |
| `Draft.Notify` | `DraftNotify` | UNVERIFIED |
| `Draft.MakeHumanDraftPick` | `DraftMakeHumanDraftPick` | UNVERIFIED |
| `Event_PlayerDraftMakePick` | `EventPlayerDraftMakePick` | UNVERIFIED |
| `BotDraft_DraftStatus` | `BotDraftDraftStatus` | UNVERIFIED |
| `BotDraft_DraftPick` | `BotDraftDraftPick` | UNVERIFIED |
| `Event.CompleteDraft` | `EventCompleteDraft` | UNVERIFIED |
| `Draft_CompleteDraft` | `DraftCompleteDraft` | UNVERIFIED |
| `Event.JoinPodmaking` | `EventJoinPodmaking` | UNVERIFIED |

### Gone from the log (read from memory instead)

These labels had **0 occurrences** even after a full match. Their data is now
sourced from the mtga-reader memory readers, which are more complete than what
the log carried:

| No longer in log | Memory source |
|---|---|
| `PlayerInventory.GetPlayerCardsV3` (collection) | `readCollection` |
| `Inventory.Updated` (wallet/wildcards) | `readInventory` |
| `PostMatch.Update` (post-match summary) | (derive from GRE stream + memory) |
| full `Rank.GetCombinedRankInfo` payload | `readRanks` (log now only carries `{seasonOrdinal, level}` per format) |
| account identity | `readAccount` |

### Still uniquely from the log

The in-match GRE stream (`GreToClientEvent`, `MatchGameRoomStateChangedEvent`,
`ClientToGremessage`) — game actions, mulligans, results, and which deck was
set (`EventSetDeckV3`). Memory reading does not cleanly replace this.

## To finish verifying the UNVERIFIED labels

Play/interact so each surfaces in the log, then re-grep it:
- **Drafts** (quick/premier/bot): `Draft*`, `BotDraft*`, `EventCompleteDraft`.
- **Open the Decks page**: confirm `DeckGetDeckSummariesV3`.
- **Submit a deck for a match / AI practice / direct challenge**:
  `EventDeckSubmitV3`, `EventAIPractice`, `DirectGameChallenge`.
- **Open packs / progression**: `ProgressionGetPlayerProgress`,
  `PlayerInventoryGetRewardSchedule`.

Quick check (PowerShell):
```powershell
$c = Get-Content "$env:USERPROFILE\AppData\LocalLow\Wizards Of The Coast\MTGA\Player.log" -Raw
[regex]::Matches($c, '[<=]=[=>] ([A-Za-z0-9_.]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
```
