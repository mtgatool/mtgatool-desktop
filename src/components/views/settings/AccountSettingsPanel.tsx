import _ from "lodash";
import { LOGIN_AUTH } from "mtgatool-shared/dist/shared/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import { SettingsPanelProps } from "./ViewSettings";

import reduxAction from "../../../redux/reduxAction";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";

import PassphraseGenerate from "../../PassphraseGenerate";
import Button from "../../ui/Button";

import { ReactComponent as KeysIcon } from "../../../assets/images/svg/keys.svg";

import saveKeysCallback from "../../../toolDb/saveKeysCallback";

function resizeBase64Img(
  base64: string,
  newWidth: number,
  newHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    canvas.width = newWidth;
    canvas.height = newHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      reject();
    } else {
      const img = document.createElement("img");
      img.src = base64;
      img.onload = () => {
        context.scale(newWidth / img.width, newHeight / img.height);
        context.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
    }
  });
}

export default function AccountSettingsPanel(
  props: SettingsPanelProps
): JSX.Element {
  const { doClose } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState("");
  // const [_accountInfo, setAccountInfo] = useState<DbAccount>({
  //   displayName: "",
  //   bio: "",
  // });

  const changeAvatar = useCallback((e) => {
    if (e && e.target.files && e.target.files[0]) {
      const FR = new FileReader();

      FR.addEventListener("load", (ev: any) => {
        resizeBase64Img(ev.target.result, 128, 128).then((img) => {
          setAvatar(img);
          window.toolDb.putData("avatar", img, true);
        });
      });

      FR.readAsDataURL(e.target.files[0]);
    }
  }, []);

  useEffect(() => {
    if (avatarInputRef.current) {
      window.toolDb
        .getData<string>("avatar", true)
        .then((av) => {
          if (av) setAvatar(av);
        })
        .catch(console.warn);
      avatarInputRef.current.addEventListener("change", changeAvatar);
    }
  }, [changeAvatar, avatarInputRef]);

  return (
    <>
      <div className="centered-setting-container">
        <div
          className="avatar-med"
          style={{ backgroundImage: `url(${avatar})` }}
        />
        <label htmlFor="avatarInput" style={{ margin: "0" }}>
          <Button text="Edit Avatar" onClick={vodiFn} />
          <input
            style={{ display: "none" }}
            ref={avatarInputRef}
            id="avatarInput"
            type="file"
          />
        </label>
      </div>
      <PassphraseGenerate />
      <p
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--color-line-sep)",
          paddingTop: "24px",
          marginBottom: "16px",
        }}
      >
        Download your keys for password-less access:
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
      <Button
        style={{ margin: "128px auto 0 auto" }}
        text="Logout"
        className="button-simple-red"
        onClick={() => {
          window.toolDb.user = undefined;
          doClose();
          setLocalSetting("savedPass", "");
          setLocalSetting("autoLogin", "false");
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_AUTH,
          });
          history.push("/auth");
        }}
      />
    </>
  );
}
