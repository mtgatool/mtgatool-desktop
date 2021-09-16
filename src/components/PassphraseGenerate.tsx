import { ChangeEvent, useCallback, useState } from "react";

import newResetPassphrase from "../toolDb/newResetPassphrase";
import copyToClipboard from "../utils/copyToClipboard";
import Button from "./ui/Button";

export default function PassphraseGenerate(): JSX.Element {
  const [phrase, setPhrase] = useState("-");
  const [hint, setHint] = useState("");

  const handleSetHint = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setHint(event.target.value);
      if (phrase !== "") setPhrase("");
    },
    [phrase]
  );

  return (
    <>
      <div
        className="popup-welcome"
        style={{ textAlign: "center", width: "100%", margin: "32px 0" }}
      >
        <p>
          We encourage users to generate a randomized passphrase for account
          recovery. You can use it later to gain access to the password hint
          that you enter below. Keep it somewhere safe! Its the only way you can
          recover your password if case you forget it.
        </p>
        <p className="red" style={{ marginTop: "12px" }}>
          This passphrase will not be available once you close this dialog, but
          you can always generate a new one.
        </p>
        <div className="phrase-container">
          <div className="phrase">{phrase}</div>
          <div
            className="copy-button"
            style={{ margin: "auto 8px" }}
            onClick={() => copyToClipboard(phrase)}
          />
        </div>
        <div className="form-input-container">
          <div className="hint-title">Password hint: </div>
          <input
            type="text"
            autoComplete="off"
            onChange={handleSetHint}
            style={{
              maxWidth: "600px",
              margin: "0 auto 0 0",
            }}
            value={hint}
          />
        </div>

        <Button
          text="Generate"
          style={{
            margin: "16px auto",
          }}
          disabled={hint.length < 8}
          onClick={() => {
            newResetPassphrase(hint).then(setPhrase);
          }}
        />
      </div>
    </>
  );
}
