/**
 * Post-signup previously showed a 12-word recovery passphrase and a "download
 * your keys" button, both tied to tool-db's ECDSA identity. With Supabase
 * username/password auth there are no keys to save, so this is a simple welcome
 * stub kept for its existing call site.
 */
export default function PostSignupPopup(): JSX.Element {
  return (
    <div
      className="popup-welcome"
      style={{
        textAlign: "center",
        width: "calc(100% - 64px)",
        margin: "32px",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>Welcome to MTG Arena Tool!</h1>
      <p>Your account is ready. Your data will sync while you are signed in.</p>
    </div>
  );
}
