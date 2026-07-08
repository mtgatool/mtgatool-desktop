/**
 * Community live-draft voting relied on the p2p network and is disabled
 * until the Supabase realtime backend lands. The legacy data shapes are
 * documented in docs/LEGACY_TOOLDB_DATA_MODEL.md (DbliveDraftV1).
 */
export default function LiveDraftView() {
  return (
    <>
      <div className="wip-sign" />
      <h1>Live drafts are being rebuilt</h1>
      <p style={{ marginBottom: "16px" }}>
        Shared live drafts are temporarily unavailable while we move to the new
        v6 backend.
      </p>
    </>
  );
}
