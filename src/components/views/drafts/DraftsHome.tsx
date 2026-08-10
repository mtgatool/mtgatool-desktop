import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import deleteDraft from "../../../data/deleteDraft";
import { getData } from "../../../data/store";
import { AppState } from "../../../redux/stores/rendererStore";
import { InternalDraftv2 } from "../../../types";
import isElectron from "../../../utils/electron/isElectron";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPopupClass from "../../../utils/getPopupClass";
import timeAgo from "../../../utils/timeAgo";
import PopupComponent from "../../PopupComponent";
import ConfirmDialog from "../../popups/ConfirmDialog";
import Section from "../../ui/Section";
import ListItemDraft from "./ListItemDraft";

interface DraftRecord {
  key: string;
  draft: InternalDraftv2;
}

const voidFn = (): void => undefined;

export default function DraftsHome() {
  const history = useHistory();

  const draftsIndex = useSelector(
    (state: AppState) => state.mainData.draftsIndex
  );

  const [records, setRecords] = useState<DraftRecord[]>([]);

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

  return (
    <Section
      style={{
        marginTop: "16px",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      {records.length === 0 ? (
        <>
          <div className="wip-sign" />
          <h1>No drafts yet</h1>
          <p style={{ marginBottom: "16px" }}>
            Your drafts are recorded as you make picks — start one in Arena and
            it will show up here.
          </p>
        </>
      ) : (
        <div className="drafts-list">
          {records.map((record) => (
            <ListItemDraft
              key={record.key}
              draft={record.draft}
              deleteCallback={askDeleteDraft}
              onClick={() =>
                history.push(`/drafts/${encodeURIComponent(record.key)}`)
              }
            />
          ))}
        </div>
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
  );
}
