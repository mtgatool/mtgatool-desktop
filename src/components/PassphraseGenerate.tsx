import { remote } from "electron";
import { ChangeEvent, useCallback, useState } from "react";
import { ReactComponent as Close } from "../assets/images/svg/close.svg";
import newResetPassphrase from "../gun/newResetPassphrase";
import Button from "./ui/Button";

interface PassphraseGenerateProps {
  onClose: () => void;
}

export default function PassphraseGenerate(
  props: PassphraseGenerateProps
): JSX.Element {
  const { onClose } = props;

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
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="popup-welcome" style={{ color: "var(--color-back)" }}>
        <div className="title green">Welcome!</div>
        <div className="desc">
          Howdy fellow planeswalker! Before you get started you need to know one
          or two things.
        </div>
        <div className="desc">
          Since MTG Arena Tool is now a decentralized application, it does not
          have a central server storage. That means that user information is
          stored locally and across <i>all</i> peers of MTG Arena Tool.
        </div>
        <div className="desc">
          That is awesome for a lot of reasons! but it does come with extra
          security concerns you need to account for. If you lose your password{" "}
          <i>it is virtually impossible to recover access to your account</i>.
        </div>
        <div className="desc">
          Therefore, we heavily encourage users to generate a randomized
          passphrase for account recovery. You can use it later to gain access
          to the password hint that you enter below. Keep it somewhere safe!
        </div>
        <div className="desc red" style={{ marginTop: "12px" }}>
          <b>
            This key will not be available once you close this dialog, but you
            can always generate a new one.
          </b>
        </div>
        <div className="phrase-container">
          <div className="phrase">{phrase}</div>
          <div
            className="copy-button"
            style={{ margin: "auto 8px" }}
            onClick={() => {
              remote.clipboard.writeText(phrase);
            }}
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
