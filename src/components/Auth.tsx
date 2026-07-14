import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import settingsIcon from "../assets/images/cog.png";
import { ReactComponent as ShowIcon } from "../assets/images/svg/archive.svg";
import { ReactComponent as HideIcon } from "../assets/images/svg/unarchive.svg";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { LOGIN_AUTH, LOGIN_OK, LOGIN_WAITING } from "../constants";
import { cloudLogin, cloudSignup } from "../data/cloudAuth";
import localLogin from "../data/localLogin";
import UICheckAdmin from "../reader/uiCheckAdmin";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
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
  // 0 = login, 1 = signup
  const [page, setPage] = useState(defaultPage || 0);
  const [showPassword, setShowPassword] = useState(false);

  const [_refresh, setRefresh] = useState(1);

  useEffect(() => {
    setTimeout(() => {
      setRefresh(2);

      UICheckAdmin().catch((err) => {
        console.error("UICheckAdmin error:", err);
      });
    }, 100);
  }, []);

  const history = useHistory();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    if (loginState === LOGIN_OK) {
      history.push("/home");
      // Data is synced by syncAll() on LOG_READ_FINISHED (account-first), so
      // no direct readCards() here.
    }
  }, [loginState, history]);

  // Shared post-auth flow: load local data and start reading the Arena log.
  const startSession = useCallback(() => {
    return localLogin().then(() => {
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
      <div className="form-error">{errorMessage}</div>
      <div className="form-options">
        <div className="message-small">
          Dont have an account?{" "}
          <a onClick={() => setPage(1)} className="signup-link">
            Sign up!
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
