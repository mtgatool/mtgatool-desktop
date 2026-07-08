import { useSelector } from "react-redux";

import { AppState } from "../../../redux/stores/rendererStore";

export default function DraftsHome() {
  const draftInProgress = useSelector(
    (state: AppState) => state.renderer.draftInProgress
  );

  return (
    <>
      {draftInProgress ? (
        <p style={{ marginBottom: "16px" }}>
          Live draft sharing is being rebuilt for v6 and is temporarily
          unavailable.
        </p>
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
