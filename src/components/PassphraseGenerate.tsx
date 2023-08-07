import { sha1, sha256 } from "mtgatool-db";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

import { ReactComponent as ShowIcon } from "../assets/images/svg/archive.svg";
import { ReactComponent as HideIcon } from "../assets/images/svg/unarchive.svg";
import newResetPassphrase from "../toolDb/newResetPassphrase";
import { getData } from "../toolDb/worker-wrapper";
import copyToClipboard from "../utils/copyToClipboard";
import getLocalSetting from "../utils/getLocalSetting";
import Button from "./ui/Button";

export default function PassphraseGenerate(): JSX.Element {
  const [phrase, setPhrase] = useState("-");
  const [isValid, setIsValid] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [hint, setHint] = useState("");

  useEffect(() => {
    getData(`==${getLocalSetting("username")}`).then((userData) => {
      if (userData) {
        if (userData) {
          setIsValid(sha256(sha1(hint)) === userData.pass);
        } else {
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
    });
  }, [hint]);

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
          recovery. You can use it later to gain access to the password that you
          enter below. Keep it safe! Its the only way you can recover your
          password in case you forget it.
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
          <div className="hint-title">Password: </div>
          <div
            style={{
              display: "flex",
              position: "relative",
              margin: "0 auto 0 0",
              width: "calc(100% - 65px)",
              maxWidth: "600px",
            }}
          >
            <input
              type={showPass ? "text" : "password"}
              autoComplete="off"
              onChange={handleSetHint}
              style={{
                maxWidth: "600px",
                margin: "0",
              }}
              value={hint}
            />
            <div
              className="show-password-icon"
              style={{ margin: "-4px 0" }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <HideIcon /> : <ShowIcon />}
            </div>
          </div>
        </div>
        {isValid ? (
          <p className="green">Password is OK</p>
        ) : (
          <p className="red">Password is not valid</p>
        )}

        <Button
          text="Generate"
          style={{
            margin: "16px auto",
          }}
          disabled={!isValid}
          onClick={() => {
            newResetPassphrase(hint).then(setPhrase);
          }}
        />
      </div>
    </>
  );
}
