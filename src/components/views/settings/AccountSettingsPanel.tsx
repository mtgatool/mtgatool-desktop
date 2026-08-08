import _ from "lodash";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { ReactComponent as ShowIcon } from "../../../assets/images/svg/archive.svg";
import { ReactComponent as HideIcon } from "../../../assets/images/svg/unarchive.svg";
import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import { LOGIN_AUTH } from "../../../constants";
import { cloudLogout, cloudUpdatePassword } from "../../../data/cloudAuth";
import { isCloudActive } from "../../../data/cloudSync";
import { TIER_NAMES } from "../../../data/entitlement";
import {
  setProfilePrivate,
  updateUsername,
  uploadAvatar,
} from "../../../data/profile";
import {
  confirmRecoveryEmail,
  getRecoveryEmail,
  requestRecoveryEmail,
} from "../../../data/recoveryEmail";
import { getData, LOCAL_KEY, putData } from "../../../data/store";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import useSupporter from "../../../hooks/useSupporter";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";
import SupporterTierIcon, { TIERS } from "../../SupporterTierIcon";
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
  const avatarKey = LOCAL_KEY;
  const privateMode = useSelector(
    (state: AppState) => state.settings.privateMode
  );
  const fetchAvatar = useFetchAvatar();
  const supporter = useSupporter();
  const isLoggedIn = useIsLoggedIn();

  const { doClose } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [newAlias, setNewAlias] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  // Recovery email. Cloud accounts only — there is no account to attach one to
  // in offline/local mode.
  const [hasCloudAccount, setHasCloudAccount] = useState(false);
  const [recoveryEmail, setRecoveryEmailInput] = useState("");
  const [savedRecoveryEmail, setSavedRecoveryEmail] = useState<string | null>(
    null
  );
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [recoveryIsError, setRecoveryIsError] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  const showRecoveryStatus = useCallback((text: string, isError = false) => {
    setRecoveryStatus(text);
    setRecoveryIsError(isError);
  }, []);

  useEffect(() => {
    isCloudActive().then((active) => {
      setHasCloudAccount(active);
      if (!active) return;
      getRecoveryEmail().then((stored) => {
        if (stored) {
          setSavedRecoveryEmail(stored.email);
          setRecoveryEmailInput(stored.email);
        }
      });
    });
  }, []);

  const handleSetRecoveryEmail = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setRecoveryEmailInput(event.target.value);
      showRecoveryStatus("");
    },
    [showRecoveryStatus]
  );

  const handleSetRecoveryCode = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      // Digits only, so pasting "123 456" or a stray space still works.
      setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6));
      showRecoveryStatus("");
    },
    [showRecoveryStatus]
  );

  // Step 1: mail a code. Nothing is stored against the account until it comes
  // back — an address nobody can read is worse than none, since it looks like
  // recovery is set up when it isn't.
  const sendRecoveryCode = useCallback(() => {
    setRecoveryBusy(true);
    showRecoveryStatus("");
    requestRecoveryEmail(recoveryEmail)
      .then(() => {
        setAwaitingCode(true);
        setRecoveryCode("");
        showRecoveryStatus(`Code sent to ${recoveryEmail.trim()}.`);
      })
      .catch((e: Error) => showRecoveryStatus(e.message, true))
      .finally(() => setRecoveryBusy(false));
  }, [recoveryEmail, showRecoveryStatus]);

  // Step 2: hand the code back; the server writes the row.
  const confirmRecoveryCode = useCallback(() => {
    setRecoveryBusy(true);
    showRecoveryStatus("");
    confirmRecoveryEmail(recoveryCode)
      .then((saved) => {
        setSavedRecoveryEmail(saved);
        setRecoveryEmailInput(saved);
        setAwaitingCode(false);
        setRecoveryCode("");
        showRecoveryStatus("Recovery email confirmed.");
      })
      .catch((e: Error) => showRecoveryStatus(e.message, true))
      .finally(() => setRecoveryBusy(false));
  }, [recoveryCode, showRecoveryStatus]);

  const cancelRecoveryCode = useCallback(() => {
    setAwaitingCode(false);
    setRecoveryCode("");
    showRecoveryStatus("");
    setRecoveryEmailInput(savedRecoveryEmail || "");
  }, [savedRecoveryEmail, showRecoveryStatus]);

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
            updateUsername(newAlias); // keep the public profile display name in sync
            setNewAlias("");
          });
        }
      });
    }
  }, [newAlias]);

  const changePassword = useCallback((newPassword: string) => {
    // Supabase stores/hashes the password itself, so we pass it raw (no sha1).
    cloudUpdatePassword(newPassword)
      .then(() => setNewPass(""))
      .catch((e: Error) => console.error("Password change failed:", e.message));
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
            putData("avatar", img, true); // local cache (offline-safe)
            uploadAvatar(img); // push to Supabase (one avatar per login)
            fetchAvatar(avatarKey);
          });
        });

        FR.readAsDataURL(e.target.files[0]);
      }
    },
    [fetchAvatar, avatarKey]
  );

  const setPrivateMode = useCallback(
    (value: boolean) => {
      if (value) {
        putData(`rank-${avatarKey}`, null, false);
      }
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: {
          privateMode: value,
        },
      });
      putData("privateMode", value, true);
      setProfilePrivate(value); // exclude/include from the public feed + lookups
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
              arg: { key: avatarKey, avatar: av },
            });
          }
        })
        .catch(console.warn);
      avatarInputRef.current.addEventListener("change", changeAvatar);
    }
  }, [changeAvatar, avatarKey, avatarInputRef]);

  return (
    <>
      <div className="centered-setting-container">
        {/* The wrapper exists because .avatar-med clips to a circle
            (overflow: hidden) — a badge inside it would be cut off. */}
        <div className="avatar-badge-wrap">
          <div
            className="avatar-med"
            style={{
              backgroundImage: `url(${avatars[avatarKey]})`,
            }}
          />
          {supporter.isSupporter && (
            <div
              className="avatar-tier-badge"
              title={`${TIER_NAMES[supporter.tier]} supporter`}
            >
              <SupporterTierIcon tier={supporter.tier} />
            </div>
          )}
        </div>
        <div style={{ marginLeft: "32px", marginRight: "auto" }}>
          <h2 style={{ margin: 0 }}>{getLocalSetting("username") || "???"}</h2>
          <div
            className="account-tier-label"
            style={{
              color: supporter.isSupporter
                ? TIERS[supporter.tier]?.top
                : "var(--color-text-dark)",
            }}
          >
            {supporter.isSupporter
              ? `${TIER_NAMES[supporter.tier]} tier`
              : "Free tier"}
          </div>
        </div>
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
      <p
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--color-line-sep)",
          paddingTop: "24px",
          marginBottom: "16px",
        }}
      >
        Setting a new password signs you out of other devices; they will need to
        log in again with the new password.
      </p>
      <div className="form-input-container" style={{ height: "36px" }}>
        <label>New Password:</label>
        <div
          style={{
            display: "flex",
            position: "relative",
            margin: "auto 16px",
            width: "calc(100% - 160px)",
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
        <Button
          disabled={newPass.length < 8}
          onClick={() => changePassword(newPass)}
          text="Save"
        />
      </div>

      {hasCloudAccount && (
        <>
          <p
            style={{
              textAlign: "center",
              borderTop: "1px solid var(--color-line-sep)",
              paddingTop: "24px",
              marginBottom: "16px",
            }}
          >
            Your account signs in with your username, not an email, so there is
            no way to reach you if you lose your password. Add an address here
            and we can send you a reset code. We&apos;ll mail you a confirmation
            code first — the address is only saved once you enter it. If you
            back us on Patreon, use the same address as your Patreon account and
            your supporter benefits link up automatically. It is used for
            nothing beyond that: no newsletters, no sharing, and you can remove
            it at any time.
          </p>
          {awaitingCode ? (
            <div className="form-input-container" style={{ height: "36px" }}>
              <label>Confirmation code:</label>
              <input
                type="text"
                id="recovery-code"
                autoComplete="off"
                inputMode="numeric"
                placeholder="000000"
                onChange={handleSetRecoveryCode}
                style={{
                  margin: "auto 16px",
                  width: "calc(100% - 320px)",
                  letterSpacing: "4px",
                }}
                value={recoveryCode}
              />
              {/* Two buttons in one flex row: .button-simple is 200px wide, so
                  they need narrowing or they squeeze the input out. */}
              <Button
                className="button-simple-dark"
                style={{ width: "120px", minWidth: "120px" }}
                onClick={cancelRecoveryCode}
                text="Cancel"
              />
              <Button
                style={{ width: "120px", minWidth: "120px" }}
                disabled={recoveryCode.length !== 6 || recoveryBusy}
                onClick={confirmRecoveryCode}
                text={recoveryBusy ? "Checking..." : "Confirm"}
              />
            </div>
          ) : (
            <div className="form-input-container" style={{ height: "36px" }}>
              <label>Recovery email:</label>
              <input
                type="email"
                id="recovery-email"
                autoComplete="off"
                placeholder="you@example.com"
                onChange={handleSetRecoveryEmail}
                style={{
                  margin: "auto 16px",
                  width: "calc(100% - 160px)",
                }}
                value={recoveryEmail}
              />
              <Button
                disabled={
                  recoveryEmail.trim() === "" ||
                  recoveryEmail.trim() === savedRecoveryEmail ||
                  recoveryBusy
                }
                onClick={sendRecoveryCode}
                text={recoveryBusy ? "Sending..." : "Send code"}
              />
            </div>
          )}
          {/*
            Rendered only when there is something to say: an always-present
            paragraph would reserve its margins as dead space, and an empty one
            sitting right on the separator's border-top is what made this feel
            cramped.
          */}
          {recoveryStatus ? (
            <p
              className={recoveryIsError ? "form-error" : "form-notice"}
              style={{ width: "100%", height: "auto", margin: "12px 0 0 0" }}
            >
              {recoveryStatus}
            </p>
          ) : null}
          {!savedRecoveryEmail && !awaitingCode && !recoveryStatus ? (
            <p
              style={{
                textAlign: "center",
                margin: "12px 0 0 0",
                color: "var(--color-text-dark)",
              }}
            >
              No confirmed address on file — a forgotten password can&apos;t be
              reset.
            </p>
          ) : null}
        </>
      )}

      <p
        style={{
          borderTop: "1px solid var(--color-line-sep)",
          marginTop: "24px",
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
          cloudLogout().catch(() => undefined);
          setLocalSetting("savedPass", "");
          setLocalSetting("autoLogin", "false");
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_AUTH,
          });
          // Back to "offline" until the next sign-in (clears the cloud-connected
          // indicator).
          reduxAction(dispatch, {
            type: "SET_OFFLINE",
            arg: true,
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
