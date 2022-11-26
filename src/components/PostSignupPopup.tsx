import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { ReactComponent as KeysIcon } from "../assets/images/svg/keys.svg";
import { AppState } from "../redux/stores/rendererStore";
import newResetPassphrase from "../toolDb/newResetPassphrase";
import saveKeysCallback from "../toolDb/saveKeysCallback";
import copyToClipboard from "../utils/copyToClipboard";
import Button from "./ui/Button";

export default function PostSignupPopup(): JSX.Element {
  const [phrase, setPhrase] = useState("-");

  const hint = useSelector((state: AppState) => state.renderer.showPostSignup);

  useEffect(() => {
    if (hint) {
      newResetPassphrase(hint).then(setPhrase);
    }
  }, [hint]);

  return (
    <>
      <div
        className="popup-welcome"
        style={{
          textAlign: "center",
          width: "calc(100% - 64px)",
          margin: "32px",
        }}
      >
        <h1 style={{ marginBottom: "16px" }}>Secure your account</h1>
        <p>
          You can recover your password later using this 12-word passphrase.
        </p>
        <p>
          You can generate a new one but only if you have haccess to your
          account.
        </p>
        <p className="red" style={{ marginTop: "12px" }}>
          This passphrase will not be available once you close this dialog!
        </p>
        <div className="phrase-container">
          <div className="phrase">{phrase}</div>
          <div
            className="copy-button"
            style={{ margin: "auto 8px" }}
            onClick={() => copyToClipboard(phrase)}
          />
        </div>

        <Button
          text="Generate new"
          style={{
            margin: "16px auto",
          }}
          onClick={() => {
            if (hint) {
              newResetPassphrase(hint).then(setPhrase);
            }
          }}
        />

        <p
          style={{
            borderTop: "1px solid var(--color-line-sep)",
            paddingTop: "24px",
            marginBottom: "16px",
          }}
        >
          You can also download your keys for password-less access:
        </p>
        <Button
          className="keys-button"
          onClick={saveKeysCallback}
          text=""
          style={{ margin: "8px auto" }}
        >
          <KeysIcon />
          <div>Save</div>
        </Button>
      </div>
    </>
  );
}
