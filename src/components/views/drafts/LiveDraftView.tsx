/**
 * Live draft voting was a tool-db p2p feature (shared CRDT of votes keyed by
 * each viewer's ECDSA pubkey). tool-db is removed, so this view is a stub until
 * the feature is rebuilt on the new backend.
 */
export default function LiveDraftView(): JSX.Element {
  return (
    <div className="live-draft-container">
      <div className="title">
        <h2>Live drafts are temporarily unavailable</h2>
      </div>
    </div>
  );
}
