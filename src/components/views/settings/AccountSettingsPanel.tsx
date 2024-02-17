import _ from "lodash";
import { LOGIN_AUTH } from "mtgatool-shared/dist/shared/constants";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { ReactComponent as ShowIcon } from "../../../assets/images/svg/archive.svg";
import { ReactComponent as KeysIcon } from "../../../assets/images/svg/keys.svg";
import { ReactComponent as HideIcon } from "../../../assets/images/svg/unarchive.svg";
import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import saveKeysCallback from "../../../toolDb/saveKeysCallback";
import { getData, putData } from "../../../toolDb/worker-wrapper";
import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";
import PassphraseGenerate from "../../PassphraseGenerate";
import Button from "../../ui/Button";
import Toggle from "../../ui/Toggle";
import { SettingsPanelProps } from "./ViewSettings";

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
  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const pubKey = useSelector((state: AppState) => state.renderer.pubKey);
  const privateMode = useSelector(
    (state: AppState) => state.settings.privateMode
  );
  const fetchAvatar = useFetchAvatar();
  const isLoggedIn = useIsLoggedIn();

  const { doClose } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [newAlias, setNewAlias] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  const handleSetAlias = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewAlias(event.target.value);
    },
    []
  );

  const changeAlias = useCallback(() => {
    if (isLoggedIn) {
      getData(`==${getLocalSetting("username")}`).then((userData) => {
        if (userData) {
          putData(`==${newAlias}`, userData).then(() => {
            putData("username", newAlias, true);
            setLocalSetting("username", newAlias);
            setNewAlias("");
          });
        }
      });
    }
  }, [newAlias]);

  const changePassword = useCallback((newPassword: string) => {
    window.toolDbWorker.postMessage({
      type: "SET_PASSWORD",
      password: newPassword,
    });
  }, []);

  const handleSetNewPass = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewPass(event.target.value);
    },
    []
  );

  const changeAvatar = useCallback(
    (e) => {
      if (e && e.target.files && e.target.files[0]) {
        const FR = new FileReader();

        FR.addEventListener("load", (ev: any) => {
          resizeBase64Img(ev.target.result, 128, 128).then((img) => {
            putData("avatar", img, true);
            fetchAvatar(pubKey);
          });
        });

        FR.readAsDataURL(e.target.files[0]);
      }
    },
    [fetchAvatar, pubKey]
  );

  const setPrivateMode = useCallback(
    (value: boolean) => {
      if (value) {
        putData(`rank-${pubKey}`, null, false);
      }
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: {
          privateMode: value,
        },
      });
      putData("privateMode", value, true);
    },
    [dispatch]
  );

  useEffect(() => {
    if (avatarInputRef.current) {
      getData<string>("avatar", true)
        .then((av) => {
          if (av) {
            reduxAction(dispatch, {
              type: "SET_AVATAR",
              arg: { pubKey, avatar: av },
            });
          }
        })
        .catch(console.warn);
      avatarInputRef.current.addEventListener("change", changeAvatar);
    }
  }, [changeAvatar, pubKey, avatarInputRef]);

  return (
    <>
      <div className="centered-setting-container">
        <div
          className="avatar-med"
          style={{
            backgroundImage: `url(${avatars[pubKey]})`,
          }}
        />
        <h2 style={{ marginLeft: "32px", marginRight: "auto" }}>
          {getLocalSetting("username") || "???"}
        </h2>
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
      <div className="form-input-container" style={{ height: "36px" }}>
        <label style={{ marginRight: "32px" }}>
          Change alias <i>(old alias will still work)</i>
        </label>
        <input
          type="text"
          id="new-alias"
          autoComplete="off"
          onChange={handleSetAlias}
          style={{
            margin: "auto",
          }}
          value={newAlias}
        />
        <Button
          style={{ minWidth: "200px", marginLeft: "32px" }}
          text="Change"
          onClick={changeAlias}
        />
      </div>
      <Toggle
        text="Private mode"
        value={privateMode}
        style={{ margin: "auto" }}
        callback={setPrivateMode}
      />
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
      <p
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--color-line-sep)",
          paddingTop: "24px",
          marginBottom: "16px",
        }}
      >
        Setting a new password will make your old password invalid, and other
        devices will need to login again. You can always use your keys to login
        if you forget your password.
      </p>
      <div className="form-input-container">
        <label>New Password:</label>
        <div
          style={{
            display: "flex",
            position: "relative",
            margin: "auto 16px",
            width: "calc(100% - 140px)",
          }}
        >
          <input
            type={showPass ? "text" : "password"}
            autoComplete="off"
            onChange={handleSetNewPass}
            style={{
              width: "100%",
              margin: "auto",
            }}
            value={newPass}
          />
          <div
            className="show-password-icon"
            style={{ margin: "-4px 0" }}
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <HideIcon /> : <ShowIcon />}
          </div>
        </div>
        <Button onClick={() => changePassword(newPass)} text="Save" />
      </div>
      <p
        style={{
          borderTop: "1px solid var(--color-line-sep)",
          paddingTop: "24px",
          marginBottom: "24px",
        }}
      />
      <Button
        style={{
          margin: "24px auto",
        }}
        text="Logout"
        className="button-simple-red"
        onClick={() => {
          doClose();
          setLocalSetting("savedPass", "");
          setLocalSetting("autoLogin", "false");
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_AUTH,
          });
          postChannelMessage({
            type: "STOP_LOG_READING",
          });

          history.push("/auth");
        }}
      />
    </>
  );
}
