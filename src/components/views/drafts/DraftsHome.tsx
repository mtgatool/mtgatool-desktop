/* eslint-disable react/jsx-props-no-spreading */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import deleteDraft from "../../../data/deleteDraft";
import { getData } from "../../../data/store";
import usePagingControls from "../../../hooks/usePagingControls";
import {
  DateOption,
  dateOptions,
  selectCurrentFilterDate,
  setDateOption,
} from "../../../redux/slices/FilterSlice";
import { AppState } from "../../../redux/stores/rendererStore";
import { InternalDraftv2 } from "../../../types";
import isElectron from "../../../utils/electron/isElectron";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPopupClass from "../../../utils/getPopupClass";
import timeAgo from "../../../utils/timeAgo";
import InputContainer from "../../InputContainer";
import PagingControls from "../../PagingControls";
import PopupComponent from "../../PopupComponent";
import ConfirmDialog from "../../popups/ConfirmDialog";
import Section from "../../ui/Section";
import Select from "../../ui/Select";
import { MatchData } from "../history/convertDbMatchData";
import ListItemDraft from "./ListItemDraft";

interface DraftRecord {
  key: string;
  draft: InternalDraftv2;
}

interface DraftsHomeProps {
  matchesData: MatchData[];
  datePickerDoShow: () => void;
}

const voidFn = (): void => undefined;

const draftTypeNames: Record<string, string> = {
  QuickDraft: "Quick Drafts",
  PremierDraft: "Premier Drafts",
  TradDraft: "Traditional Drafts",
  CompDraft: "Competitive Drafts",
  Sealed: "Sealed",
};

function draftTypeOf(eventId: string): string | null {
  const type = Object.keys(draftTypeNames).find((t) =>
    eventId.startsWith(`${t}_`)
  );
  return type ?? null;
}

/**
 * The dropdown speaks three languages: "type:QuickDraft" (every quick draft),
 * "set:MSH" (every draft of a set) and a bare eventId (one exact queue).
 * Matches only carry the eventId, so the set test falls back to the "_MSH_"
 * segment the queue names embed.
 */
function eventFilterFn(
  filter: string
): (eventId: string, draftSet?: string) => boolean {
  if (!filter) return () => true;
  if (filter.startsWith("type:")) {
    const type = filter.slice("type:".length);
    return (eventId) => eventId.startsWith(`${type}_`);
  }
  if (filter.startsWith("set:")) {
    const set = filter.slice("set:".length);
    return (eventId, draftSet) =>
      draftSet ? draftSet === set : eventId.indexOf(`_${set}_`) !== -1;
  }
  return (eventId) => eventId === filter;
}

export default function DraftsHome(props: DraftsHomeProps) {
  const { matchesData, datePickerDoShow } = props;
  const history = useHistory();
  const dispatch = useDispatch();

  const draftsIndex = useSelector(
    (state: AppState) => state.mainData.draftsIndex
  );
  // Same date filter the matches tab uses — one "From" setting for the app.
  const filterDate = useSelector(selectCurrentFilterDate);
  const datePickerDate = useSelector(
    (state: AppState) => state.filter.startDate
  );
  const fromDateOption = useSelector(
    (state: AppState) => state.filter.dateOption
  );

  const [records, setRecords] = useState<DraftRecord[]>([]);
  const [eventFilter, setEventFilter] = useState("");

  const os = isElectron() ? process.platform : "";
  const openDeleteDraft = useRef<() => void>(voidFn);
  const closeDeleteDraft = useRef<() => void>(voidFn);
  const [draftToDelete, setDraftToDelete] = useState<InternalDraftv2 | null>(
    null
  );

  const askDeleteDraft = useCallback((draft: InternalDraftv2) => {
    setDraftToDelete(draft);
    openDeleteDraft.current();
  }, []);

  // deleteDraft dispatches the shrunken draftsIndex, which re-runs the loader
  // effect below — nothing else to refresh.
  const confirmDeleteDraft = useCallback(() => {
    if (draftToDelete?.id) deleteDraft(draftToDelete.id);
  }, [draftToDelete]);

  useEffect(() => {
    Promise.all(
      draftsIndex.map((key) =>
        getData<InternalDraftv2>(key).then((draft) =>
          draft ? { key, draft } : null
        )
      )
    ).then((results) => {
      const loaded = results.filter((r): r is DraftRecord => r !== null);
      // Newest first; records without a date sink to the bottom.
      loaded.sort(
        (a, b) =>
          new Date(b.draft.date || 0).getTime() -
          new Date(a.draft.date || 0).getTime()
      );
      setRecords(loaded);
    });
  }, [draftsIndex]);

  // Grouped options assembled from the drafts we actually have.
  const eventOptions = useMemo(() => {
    const types = new Set<string>();
    const sets = new Set<string>();
    const events = new Set<string>();
    records.forEach(({ draft }) => {
      const type = draftTypeOf(draft.eventId);
      if (type) types.add(type);
      if (draft.draftSet) sets.add(draft.draftSet);
      events.add(draft.eventId);
    });
    const options = [""];
    if (types.size > 0) {
      options.push(
        "%%Draft Types",
        ...[...types].sort().map((t) => `type:${t}`)
      );
    }
    if (sets.size > 0) {
      options.push("%%Sets", ...[...sets].sort().map((s) => `set:${s}`));
    }
    options.push("%%Events", ...[...events].sort());
    return options;
  }, [records]);

  const formatEventOption = useCallback((option: string) => {
    if (option === "") return "All Drafts";
    if (option.startsWith("type:")) {
      const type = option.slice("type:".length);
      return draftTypeNames[type] ?? type;
    }
    if (option.startsWith("set:")) return option.slice("set:".length);
    return getEventPrettyName(option);
  }, []);

  const filteredRecords = useMemo(() => {
    const matchesEvent = eventFilterFn(eventFilter);
    const minTime = filterDate.getTime();
    return records.filter(({ draft }) => {
      const time = draft.date ? new Date(draft.date).getTime() : 0;
      if (time < minTime) return false;
      return matchesEvent(draft.eventId, draft.draftSet);
    });
  }, [records, eventFilter, filterDate]);

  // Event winrate across the drafts on screen. Matches don't record which
  // draft they came from, but they keep the queue's eventId — so every match
  // in one of the filtered drafts' queues (inside the date window) counts.
  const stats = useMemo(() => {
    const eventIds = new Set(filteredRecords.map((r) => r.draft.eventId));
    const minTime = filterDate.getTime();
    let wins = 0;
    let losses = 0;
    matchesData.forEach((match) => {
      if (!eventIds.has(match.eventId)) return;
      if (match.timestamp < minTime) return;
      if (match.win) wins += 1;
      else losses += 1;
    });
    return { wins, losses, matches: wins + losses };
  }, [filteredRecords, matchesData, filterDate]);

  const pagingControlProps = usePagingControls(filteredRecords.length, 25);
  const { pageIndex, pageCount, pageSize, gotoPage } = pagingControlProps;

  // Deleting the last draft on the last page (or narrowing the filter) would
  // otherwise leave us stranded on a page that no longer exists.
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) {
      gotoPage(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount, gotoPage]);

  const winrate =
    stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : null;

  return (
    <>
      <div className="FilterSection">
        <Section style={{ marginTop: "16px", marginBottom: "16px" }}>
          <Select
            style={{ width: "280px" }}
            options={eventOptions}
            optionFormatter={formatEventOption}
            current={eventFilter}
            callback={setEventFilter}
          />
          <div style={{ lineHeight: "32px", marginLeft: "16px" }}>From:</div>
          <InputContainer style={{ width: "auto" }} title="">
            <input
              onClick={datePickerDoShow}
              style={{
                backgroundColor: "var(--color-base)",
                width: "140px",
                cursor: "pointer",
              }}
              readOnly
              type="date"
              value={datePickerDate.toISOString().substring(0, 10)}
            />
          </InputContainer>
          <Select
            options={dateOptions}
            current={fromDateOption}
            callback={(opt: DateOption) => {
              dispatch(setDateOption(opt));
            }}
          />
        </Section>
      </div>

      <Section
        style={{
          marginBottom: "16px",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        {records.length === 0 ? (
          <>
            <div className="wip-sign" />
            <h1>No drafts yet</h1>
            <p style={{ marginBottom: "16px" }}>
              Your drafts are recorded as you make picks — start one in Arena
              and it will show up here.
            </p>
          </>
        ) : (
          <>
            <div className="drafts-stats-bar">
              <div>
                <span>{filteredRecords.length}</span>
                {filteredRecords.length === 1 ? " draft" : " drafts"}
              </div>
              <div>
                <span>{stats.matches}</span>
                {stats.matches === 1 ? " match" : " matches"}
              </div>
              <div>
                <span>{`${stats.wins} - ${stats.losses}`}</span>
              </div>
              {winrate !== null && (
                <div>
                  <span>{`${winrate}%`}</span> winrate
                </div>
              )}
            </div>
            {filteredRecords.length === 0 ? (
              <p style={{ margin: "16px 0" }}>
                No drafts match the current filters.
              </p>
            ) : (
              <div className="drafts-list">
                {filteredRecords
                  .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
                  .map((record) => (
                    <ListItemDraft
                      key={record.key}
                      draft={record.draft}
                      deleteCallback={askDeleteDraft}
                      onClick={() =>
                        history.push(
                          `/drafts/${encodeURIComponent(record.key)}`
                        )
                      }
                    />
                  ))}
                <div style={{ marginTop: "10px" }}>
                  <PagingControls
                    {...pagingControlProps}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <PopupComponent
          open={false}
          className={getPopupClass(os)}
          width="480px"
          height="auto"
          openFnRef={openDeleteDraft}
          closeFnRef={closeDeleteDraft}
          persistent={false}
          onClose={(): void => setDraftToDelete(null)}
        >
          <ConfirmDialog
            title="Delete draft?"
            danger
            confirmText="Delete"
            onConfirm={confirmDeleteDraft}
            onClose={(): void => closeDeleteDraft.current()}
            text={
              draftToDelete ? (
                <div style={{ color: "var(--color-text)" }}>
                  <div>{getEventPrettyName(draftToDelete.eventId)}</div>
                  <div style={{ color: "var(--color-text-dark)" }}>
                    {draftToDelete.draftSet}
                    {draftToDelete.date
                      ? ` · ${timeAgo(new Date(draftToDelete.date).getTime())}`
                      : ""}
                  </div>
                </div>
              ) : (
                <></>
              )
            }
          />
        </PopupComponent>
      </Section>
    </>
  );
}
