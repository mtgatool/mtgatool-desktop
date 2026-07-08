import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import { LOGIN_AUTH } from "../../../constants";
import { cloudLogout } from "../../../data/cloudAuth";
import { getData, putData } from "../../../data/store";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";
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

  const { doClose } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
          {getLocalSetting("username") || "Local profile"}
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
      <p
        style={{
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        Cross-device sync and community features are being rebuilt for v6; match
        data is currently stored on this device only.
      </p>
      <Toggle
        text="Private mode"
        value={privateMode}
        style={{ margin: "auto" }}
        callback={setPrivateMode}
      />
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
          cloudLogout().catch(console.warn);
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
