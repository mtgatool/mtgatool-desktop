import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { AppState } from "../../../redux/stores/rendererStore";
import createLiveDraft from "../../../toolDb/createLiveDraft";

import Button from "../../ui/Button";

export default function DraftsHome() {
  const history = useHistory();
  const draftInProgress = useSelector(
    (state: AppState) => state.renderer.draftInProgress
  );

  const currentDraft = useSelector(
    (state: AppState) => state.renderer.currentDraft
  );

  const beginLiveDraft = useCallback(() => {
    if (currentDraft) {
      createLiveDraft(currentDraft);

      history.push(`drafts/live/v1-${currentDraft.id}`);
    }
  }, [history, currentDraft]);

  return (
    <>
      {draftInProgress ? (
        <Button onClick={beginLiveDraft} text="Start" />
      ) : (
        <></>
      )}
      <p style={{ marginBottom: "16px" }}>Start Live Draft session</p>
    </>
  );
}
