import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";

import settingsIcon from "../assets/images/cog.png";
import { ReactComponent as ShowIcon } from "../assets/images/svg/archive.svg";
import { ReactComponent as HideIcon } from "../assets/images/svg/unarchive.svg";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { LOGIN_AUTH, LOGIN_OK, LOGIN_WAITING } from "../constants";
import claimLocalStore from "../data/claimLocalStore";
import { cloudLogin, cloudSignup } from "../data/cloudAuth";
import { getActiveUserId } from "../data/cloudSync";
import hydrateFromCloud from "../data/hydrateFromCloud";
import localLogin from "../data/localLogin";
import {
  requestPasswordReset,
  resetPasswordWithCode,
} from "../data/passwordReset";
import syncDrafts from "../data/syncDrafts";
import syncMatches from "../data/syncMatches";
import UICheckAdmin from "../reader/uiCheckAdmin";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import { consumeLoginReturnTo } from "../utils/loginReturnTo";
import setLocalSetting from "../utils/setLocalSetting";
import voidFn from "../utils/voidfn";
import AuthSettings from "./AuthSettings";
import PopupComponent from "./PopupComponent";
import IconButton from "./ui/IconButton";

type InputChange = ChangeEvent<HTMLInputElement>;

export interface AuthProps {
  defaultPage?: number;
}

export default function Auth(props: AuthProps) {
  const { defaultPage } = props;
  // 0 = login, 1 = signup, 2 = forgot password
  const [page, setPage] = useState(defaultPage || 0);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot-password. Step 0 asks for the username, step 1 for the code and the
  // new password.
  const [resetStep, setResetStep] = useState(0);
  const [resetUsername, setResetUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [_refresh, setRefresh] = useState(1);

  useEffect(() => {
    setTimeout(() => {
      setRefresh(2);

      UICheckAdmin();
    }, 100);
  }, []);

  const history = useHistory();
  // Public pages (profiles, shared decks) send people here with a returnTo,
  // so logging in lands them back on what they were reading.
  const location = useLocation<{ returnTo?: string }>();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState("");
  // Success counterpart of errorMessage — .form-error is red and fixed-height,
  // so it can't carry these.
  const [noticeMessage, setNoticeMessage] = useState("");

  const [username, setUsername] = useState(getLocalSetting("username"));
  const [pass, setPass] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupPassConfirm, setSignupPassConfirm] = useState("");

  const loginState = useSelector(
    (state: AppState) => state.renderer.loginState
  );
  const logCompletion = useSelector(
    (state: AppState) => state.renderer.logCompletion
  );
  const loading = useSelector((state: AppState) => state.renderer.loading);

  const handleUsernameChange = useCallback((event: InputChange): void => {
    setUsername(event.target.value);
  }, []);

  const handlePassChange = useCallback((event: InputChange): void => {
    setPass(event.target.value);
  }, []);

  const handleSingupUsernameChange = useCallback((event: InputChange): void => {
    setSignupUsername(event.target.value);
  }, []);

  const handleSingupPassChange = useCallback((event: InputChange): void => {
    setSignupPass(event.target.value);
  }, []);

  const handleSingupPassConfirmChange = useCallback(
    (event: InputChange): void => {
      setSignupPassConfirm(event.target.value);
    },
    []
  );

  useEffect(() => {
    setErrorMessage("");
  }, [page]);

  const openForgotPassword = useCallback(() => {
    setResetStep(0);
    setResetUsername(username);
    setResetCode("");
    setResetPass("");
    setNoticeMessage("");
    setPage(2);
  }, [username]);

  const onRequestReset = useCallback(
    (e): void => {
      e.preventDefault();
      setErrorMessage("");
      setNoticeMessage("");
      setResetBusy(true);
      requestPasswordReset(resetUsername)
        .then(() => {
          // The server answers identically whether or not the account exists,
          // so this can't say "sent" — only what it would mean if it were.
          setNoticeMessage(
            "If that account has a confirmed recovery email, a code is on its way. Enter it below."
          );
          setResetStep(1);
        })
        .catch((err: Error) => setErrorMessage(err.message))
        .finally(() => setResetBusy(false));
    },
    [resetUsername]
  );

  const onConfirmReset = useCallback(
    (e): void => {
      e.preventDefault();
      setErrorMessage("");
      setNoticeMessage("");
      setResetBusy(true);
      resetPasswordWithCode(resetUsername, resetCode, resetPass)
        .then(() => {
          setUsername(resetUsername);
          setPass("");
          setPage(0);
          setNoticeMessage("Password updated — log in with your new password.");
        })
        .catch((err: Error) => setErrorMessage(err.message))
        .finally(() => setResetBusy(false));
    },
    [resetUsername, resetCode, resetPass]
  );

  useEffect(() => {
    if (loginState === LOGIN_OK) {
      // Router state from an in-app push wins; the sessionStorage fallback
      // covers paths where state cannot survive (boot bounces, reloads).
      history.push(
        location.state?.returnTo || consumeLoginReturnTo() || "/home"
      );
      // Data is synced by syncAll() on LOG_READ_FINISHED (account-first), so
      // no direct readCards() here.
    }
  }, [loginState, history, location.state]);

  // Shared post-auth flow: load local data and start reading the Arena log.
  const startSession = useCallback(() => {
    // Connection status now reflects the mtgatool cloud (Supabase) account, not
    // tool-db peers: "true" = signed in (online), "local" = offline mode.
    reduxAction(dispatch, {
      type: "SET_OFFLINE",
      arg: getLocalSetting("autoLogin") !== "true",
    });
    // Claim the local store BEFORE hydrating: if it belongs to another account
    // it is wiped here, and doing that after the pull would delete the data we
    // just fetched. Without it, syncMatches below would upload the previous
    // account's history to this one.
    return getActiveUserId()
      .then(claimLocalStore)
      .then(() =>
        // Pull cloud data down first (no-op offline) so a fresh device restores
        // its matches/decks/collection/rank before localLogin mirrors KV -> Redux.
        hydrateFromCloud()
      )
      .then(() => localLogin())
      .then(() => {
        // Auto-login (App.tsx) reconciles here too. Without it a manual login
        // only ever reached syncMatches via the persona-detected path, which
        // waits on the log read — so a fresh login showed every match with the
        // "not uploaded" arrow until then, and a restart appeared to fix it.
        syncMatches().catch(() => undefined);
        syncDrafts().catch(() => undefined);

        if (electron) {
          postChannelMessage({
            type: "START_LOG_READING",
          });
          reduxAction(dispatch, {
            type: "SET_LOADING",
            arg: true,
          });
          reduxAction(dispatch, {
            type: "SET_READING_LOG",
            arg: true,
          });
        } else {
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_OK,
          });
          reduxAction(dispatch, {
            type: "SET_LOADING",
            arg: false,
          });
        }
      });
  }, [dispatch]);

  const onAuthError = useCallback(
    (err: Error) => {
      reduxAction(dispatch, {
        type: "SET_LOGIN_STATE",
        arg: LOGIN_AUTH,
      });
      setErrorMessage(err.message);
    },
    [dispatch]
  );

  const onLogin = useCallback(
    (e): void => {
      e.preventDefault();
      setErrorMessage("");
      reduxAction(dispatch, {
        type: "SET_LOGIN_STATE",
        arg: LOGIN_WAITING,
      });
      cloudLogin(username, pass)
        .then(() => {
          setLocalSetting("autoLogin", "true");
          return startSession();
        })
        .catch(onAuthError);
    },
    [username, pass, dispatch, startSession, onAuthError]
  );

  const onSignup = useCallback(
    (e): void => {
      e.preventDefault();
      if (signupPass !== signupPassConfirm) {
        setErrorMessage("Passwords must match");
        return;
      }
      setErrorMessage("");
      setUsername(signupUsername);

      reduxAction(dispatch, {
        type: "SET_LOGIN_STATE",
        arg: LOGIN_WAITING,
      });
      cloudSignup(signupUsername, signupPass)
        .then(() => {
          setLocalSetting("autoLogin", "true");
          return startSession();
        })
        .catch(onAuthError);
    },
    [
      signupUsername,
      signupPass,
      signupPassConfirm,
      dispatch,
      startSession,
      onAuthError,
    ]
  );

  const onContinueOffline = useCallback(
    (e): void => {
      e.preventDefault();
      setErrorMessage("");
      reduxAction(dispatch, {
        type: "SET_LOGIN_STATE",
        arg: LOGIN_WAITING,
      });
      setLocalSetting("autoLogin", "local");
      startSession().catch(onAuthError);
    },
    [dispatch, startSession, onAuthError]
  );

  const openPopup = useRef<() => void>(() => console.log("openPopup"));
  const closePopup = useRef<() => void>(() => console.log("closePopup"));

  const isBusy =
    (loading && loginState === LOGIN_WAITING) || loginState === LOGIN_OK;

  const loadingPanel = (
    <div className="login-loading">
      <div>{`Reading player log: ${
        Math.round(logCompletion * 1000) / 10
      }%`}</div>
      <div
        style={{
          width: "240px",
          height: "6px",
          background: "var(--color-section)",
          borderRadius: "3px",
          margin: "10px auto",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(logCompletion * 100)}%`,
            height: "100%",
            background: "var(--color-g)",
            transition: "width 0.2s ease",
          }}
        />
      </div>
    </div>
  );

  const signupPanel = (
    <div className="auth-page-single">
      <label className="form-label">Username</label>
      <div className="form-input-container">
        <input
          type="text"
          onChange={handleSingupUsernameChange}
          autoComplete="off"
          value={signupUsername}
        />
      </div>
      <label className="form-label">Password</label>
      <div className="form-input-container">
        <input
          onChange={handleSingupPassChange}
          type={showPassword ? "text" : "password"}
          autoComplete="off"
          value={signupPass}
        />
        <div
          className="show-password-icon"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <HideIcon /> : <ShowIcon />}
        </div>
      </div>
      <label className="form-label">Confirm Password</label>
      <div className="form-input-container">
        <input
          onChange={handleSingupPassConfirmChange}
          type={showPassword ? "text" : "password"}
          autoComplete="off"
          value={signupPassConfirm}
        />
      </div>
      <button
        style={{ margin: "14px 0 4px 0" }}
        className="form-button"
        type="button"
        onClick={onSignup}
      >
        Sign up
      </button>
      <div className="form-error">{errorMessage}</div>
      <div className="message-small">
        Already have an account?{" "}
        <a onClick={() => setPage(0)} className="signup-link">
          Log in!
        </a>
      </div>
    </div>
  );

  const forgotPanel = (
    <div className="auth-page-single">
      {resetStep === 0 ? (
        <>
          <label className="form-label">Username</label>
          <div className="form-input-container">
            <input
              type="text"
              onChange={(ev: InputChange): void =>
                setResetUsername(ev.target.value)
              }
              autoComplete="off"
              value={resetUsername}
            />
          </div>
          <div
            className="message-small"
            style={{ margin: "12px 0 0 0", color: "var(--color-text-dark)" }}
          >
            We&apos;ll send a code to the recovery email on that account. If it
            never had one, there&apos;s no way to reset it — your local data is
            still on this device, and you can keep using the app offline.
          </div>
          <button
            style={{ margin: "14px 0 4px 0" }}
            className="form-button"
            type="submit"
            disabled={resetBusy || resetUsername.trim() === ""}
            onClick={onRequestReset}
          >
            {resetBusy ? "Sending..." : "Send reset code"}
          </button>
        </>
      ) : (
        <>
          <label className="form-label">Code from the email</label>
          <div className="form-input-container">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              onChange={(ev: InputChange): void =>
                setResetCode(ev.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="off"
              value={resetCode}
            />
          </div>
          <label className="form-label">New password</label>
          <div className="form-input-container">
            <input
              onChange={(ev: InputChange): void =>
                setResetPass(ev.target.value)
              }
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              value={resetPass}
            />
            <div
              className="show-password-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HideIcon /> : <ShowIcon />}
            </div>
          </div>
          {/* The button below is disabled until this is satisfied, so say so
              rather than leaving it inert for no visible reason. */}
          <div
            className="message-small"
            style={{ margin: "4px 0 0 0", color: "var(--color-text-dark)" }}
          >
            At least 8 characters.
          </div>
          <button
            style={{ margin: "14px 0 4px 0" }}
            className="form-button"
            type="submit"
            disabled={
              resetBusy || resetCode.length !== 6 || resetPass.length < 8
            }
            onClick={onConfirmReset}
          >
            {resetBusy ? "Setting..." : "Set new password"}
          </button>
        </>
      )}
      {noticeMessage ? (
        <div className="form-notice">{noticeMessage}</div>
      ) : null}
      <div className="form-error">{errorMessage}</div>
      <div className="form-options">
        <div className="message-small">
          <a onClick={() => setPage(0)} className="signup-link">
            Back to log in
          </a>
        </div>
      </div>
    </div>
  );

  const loginPanel = (
    <div className="auth-page-single">
      <label className="form-label">Username</label>
      <div className="form-input-container">
        <input
          type="text"
          onChange={handleUsernameChange}
          autoComplete="off"
          value={username}
        />
      </div>
      <label className="form-label">Password</label>
      <div className="form-input-container">
        <input
          onChange={handlePassChange}
          type={showPassword ? "text" : "password"}
          autoComplete="off"
          value={pass}
        />
        <div
          className="show-password-icon"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <HideIcon /> : <ShowIcon />}
        </div>
      </div>
      <button
        style={{ margin: "14px 0 4px 0" }}
        className="form-button"
        type="submit"
        onClick={onLogin}
      >
        Login
      </button>
      {noticeMessage ? (
        <div className="form-notice">{noticeMessage}</div>
      ) : null}
      <div className="form-error">{errorMessage}</div>
      <div className="form-options">
        <div className="message-small">
          Dont have an account?{" "}
          <a onClick={() => setPage(1)} className="signup-link">
            Sign up!
          </a>
        </div>
        <div className="message-small">
          <a onClick={openForgotPassword} className="signup-link">
            Forgot your password?
          </a>
        </div>
        <div className="message-small">
          <a
            onClick={onContinueOffline}
            className="signup-link"
            title="Use the app without an account; data stays on this device."
          >
            Continue offline
          </a>
        </div>
      </div>
    </div>
  );

  let panel = loginPanel;
  if (isBusy) panel = loadingPanel;
  else if (page === 1) panel = signupPanel;
  else if (page === 2) panel = forgotPanel;

  return (
    <>
      <PopupComponent
        open={false}
        width="calc(100% - 32px)"
        height="calc(100% - 32px)"
        openFnRef={openPopup}
        closeFnRef={closePopup}
      >
        <AuthSettings onClose={closePopup.current} />
      </PopupComponent>
      <form style={{ height: "100%" }}>
        <div className="form-container">
          <div className="form-authenticate">
            <div
              className="form-icon"
              style={{
                animationName: loginState === LOGIN_WAITING ? "rotate" : "",
              }}
            />
            {panel}
          </div>
        </div>
      </form>
      {electron && (
        <div className="app-settings" onClick={openPopup.current}>
          <IconButton
            style={{ margin: "auto" }}
            icon={settingsIcon}
            onClick={voidFn}
          />
        </div>
      )}
    </>
  );
}
