import { useCallback, useState } from "react";
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
  const [liveDraftUrl, setLiveDraftUrl] = useState<string | undefined>(
    undefined
  );

  const currentDraft = useSelector(
    (state: AppState) => state.renderer.currentDraft
  );

  const beginLiveDraft = useCallback(() => {
    if (currentDraft) {
      createLiveDraft(currentDraft);
      setLiveDraftUrl(
        `https://app.mtgatool.com/drafts/live/v1-${currentDraft.id}`
      );
    }
  }, [history, currentDraft]);

  return (
    <>
      {draftInProgress ? (
        <>
          {liveDraftUrl === undefined ? (
            <>
              <Button onClick={beginLiveDraft} text="Start" />
              <p style={{ marginBottom: "16px" }}>Start Live Draft session</p>
            </>
          ) : (
            <div className="input-container" style={{ height: "40px" }}>
              <label className="label">
                Use this link to share your draft in real time:
              </label>
              <div
                style={{
                  display: "flex",
                  maxWidth: "80%",
                  width: "-webkit-fill-available",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{ marginLeft: "16px" }}
                  className="form-input-container"
                >
                  <input autoComplete="off" readOnly value={liveDraftUrl} />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="wip-sign" />
          <h1>Working on it</h1>
          <p style={{ marginBottom: "16px" }}>
            Our team of expert Goblins are working here.
          </p>
        </>
      )}
    </>
  );
}
