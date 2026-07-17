/**
 * Passphrase recovery was tied to tool-db's ECDSA identity, which has been
 * replaced by Supabase username/password auth. Password recovery is handled by
 * Supabase now, so this component is a stub kept only so its (few) call sites
 * still render something sensible.
 */
export default function PassphraseGenerate(): JSX.Element {
  return (
    <div
      className="popup-welcome"
      style={{ textAlign: "center", width: "100%", margin: "32px 0" }}
    >
      <p>
        Passphrase recovery is no longer used. Accounts now use a username and
        password; if you forget your password, reset it from the account
        options.
      </p>
    </div>
  );
}
