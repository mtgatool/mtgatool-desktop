import { useHistory } from "react-router-dom";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { animated, useSpring } from "react-spring";
import {
  LOGIN_AUTH,
  LOGIN_OK,
  LOGIN_WAITING,
} from "mtgatool-shared/dist/shared/constants";
import { sha1 } from "mtgatool-db";

import postChannelMessage from "../broadcastChannel/postChannelMessage";

import AuthSettings from "./AuthSettings";
import PopupComponent from "./PopupComponent";

import IconButton from "./ui/IconButton";
import Checkbox from "./ui/Checkbox";

import settingsIcon from "../assets/images/cog.png";

import checkPassphrase from "../toolDb/checkPassphrase";
import signup from "../toolDb/signup";
import login from "../toolDb/login";

import voidFn from "../utils/voidfn";
import getLocalSetting from "../utils/getLocalSetting";
import setLocalSetting from "../utils/setLocalSetting";
import electron from "../utils/electron/electronWrapper";

import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import { ReactComponent as ShowIcon } from "../assets/images/svg/archive.svg";
import { ReactComponent as HideIcon } from "../assets/images/svg/unarchive.svg";
import { ReactComponent as PutKey } from "../assets/images/svg/put-key.svg";
import Button from "./ui/Button";
import keysLogin from "../toolDb/keysLogin";
import fetchCards from "../daemon/fetchCards";

type InputChange = ChangeEvent<HTMLInputElement>;

export interface AuthProps {
  defaultPage?: number;
}

export default function Auth(props: AuthProps) {
  const { defaultPage } = props;
  const [page, setPage] = useState(defaultPage || 1);
  const [showPassword, setShowPassword] = useState(false);

  const [_refresh, setRefresh] = useState(1);

  useEffect(() => {
    setTimeout(() => {
      setRefresh(2);
    }, 100);
  }, []);

  const history = useHistory();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState("");
  const keysInputRef = useRef<HTMLInputElement>(null);
  const keysFileRef = useRef<Blob | null>(null);

  const [pass, setPass] = useState(getLocalSetting("savedPass") || "");
  const [username, setUsername] = useState(getLocalSetting("username"));
  const [usernameRecover, setUsernameRecover] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupPassConfirm, setSignupPassConfirm] = useState("");

  const [passphrase, setPassphrase] = useState("");

  const [rememberme, setRememberme] = useState(
    getLocalSetting("rememberme") == "true"
  );

  const loginState = useSelector(
    (state: AppState) => state.renderer.loginState
  );
  const logCompletion = useSelector(
    (state: AppState) => state.renderer.logCompletion
  );
  const loading = useSelector((state: AppState) => state.renderer.loading);

  useEffect(() => {
    setLocalSetting("rememberme", rememberme ? "true" : "false");
  }, [rememberme]);

  const handlePassphraseCHange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      setPassphrase(event.target.value.toUpperCase());
    },
    []
  );

  const handleUsernameChange = useCallback((event: InputChange): void => {
    setUsername(event.target.value);
  }, []);

  const handleUsernameRecoverChange = useCallback(
    (event: InputChange): void => {
      setUsernameRecover(event.target.value);
    },
    []
  );

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
      if (rememberme) {
        setLocalSetting("username", username);
        setLocalSetting("savedPass", pass);
      } else {
        setLocalSetting("username", "");
        setLocalSetting("savedPass", "");
      }
      history.push("/home");
      fetchCards();
    }
  }, [loginState, username, pass, rememberme, history]);

  const onLogin = useCallback(
    (e): void => {
      e.preventDefault();
      if (pass.length < 8) {
        setErrorMessage("Passwords must contain at least 8 characters.");
      } else {
        setErrorMessage("");
        reduxAction(dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_WAITING,
        });
        login(username, sha1(pass))
          .then(() => {
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
          })
          .catch((err: Error) => {
            reduxAction(dispatch, {
              type: "SET_LOGIN_STATE",
              arg: LOGIN_AUTH,
            });
            setErrorMessage(err.message);
          });
      }
    },
    [username, pass]
  );

  const onKeyLogin = useCallback((): void => {
    if (keysFileRef.current) {
      const FR = new FileReader();
      setErrorMessage("");
      FR.addEventListener("load", (ev: any) => {
        const keys = JSON.parse(ev.target.result);
        reduxAction(dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_WAITING,
        });
        keysLogin(username, keys)
          .then(() => {
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
          })
          .catch((err: Error) => {
            reduxAction(dispatch, {
              type: "SET_LOGIN_STATE",
              arg: LOGIN_AUTH,
            });
            setErrorMessage(err.message);
          });
      });

      FR.readAsText(keysFileRef.current);
    }
  }, [username, keysFileRef]);

  const onKeysChange = useCallback(
    (e: any) => {
      if (e && e.target && e.target.files && e.target.files[0]) {
        [keysFileRef.current] = e.target.files;
        onKeyLogin();
        e.target.value = null;
        e.target.files = null;
      }
    },
    [onKeyLogin, keysFileRef]
  );

  const onSignup = useCallback(
    (e): void => {
      e.preventDefault();
      if (signupUsername.length < 5) {
        setErrorMessage("Username must be at least 5 characters long");
      } else if (signupPass.length < 8) {
        setErrorMessage("Passwords must contain at least 8 characters.");
      } else if (signupPass !== signupPassConfirm) {
        setErrorMessage("Passwords must match");
      } else {
        setErrorMessage("");
        setUsername(signupUsername);
        setPass(signupPass);

        reduxAction(dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_WAITING,
        });
        signup(signupUsername, sha1(signupPass))
          .then(() => {
            reduxAction(dispatch, {
              type: "SHOW_POST_SIGNUP",
              arg: signupPass,
            });
            if (electron) {
              postChannelMessage({
                type: "START_LOG_READING",
              });
              reduxAction(dispatch, {
                type: "SET_LOADING",
                arg: true,
              });
              reduxAction(dispatch, {
                type: "SET_LOGIN_STATE",
                arg: LOGIN_WAITING,
              });
            } else {
              history.push("/home");
              reduxAction(dispatch, {
                type: "SET_LOGIN_STATE",
                arg: LOGIN_OK,
              });
              reduxAction(dispatch, {
                type: "SET_LOADING",
                arg: false,
              });
              fetchCards();
            }
          })
          .catch((err: Error) => {
            reduxAction(dispatch, {
              type: "SET_LOGIN_STATE",
              arg: LOGIN_AUTH,
            });
            setErrorMessage(err.message);
          });
      }
    },
    [history, signupUsername, signupPass, signupPassConfirm]
  );

  const onRecover = useCallback(
    (e): void => {
      e.preventDefault();
      if (passphrase.split(" ").length !== 12) {
        setErrorMessage("Passphrase needs to have 12 words");
      } else {
        checkPassphrase(usernameRecover, passphrase)
          .then((hint) => {
            if (hint) {
              setPass(hint);
              setPage(1);
            }
          })
          .catch((err: Error) => setErrorMessage(err.message));
      }
    },
    [passphrase, usernameRecover]
  );

  const openPopup = useRef<() => void>(() => console.log("openPopup"));
  const closePopup = useRef<() => void>(() => console.log("closePopup"));

  useEffect(() => {
    setPage(defaultPage || 1);
  }, [defaultPage]);

  const pageProps = useSpring({
    left: `${0 - page * 33.33}%`,
  }) as any;

  return (
    <>
      <div
        style={{
          width: "100%",
          color: "var(--color-w)",
          display: "flex",
          position: "absolute",
          bottom: "8px",
        }}
      >
        <div
          style={{
            maxWidth: "calc(100% - 16px)",
            margin: "auto",
            lineHeight: "20px",
            padding: "12px",
            borderRadius: "4px",
            textAlign: "center",
            backgroundColor: "var(--color-section)",
            width: "600px",
          }}
        >
          Due to an api protocol and storage upgrade in v6.1.0 all users will
          have to sign up again, sorry for the inconvenience! -Manwë
        </div>
      </div>
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
            {(loading && loginState === LOGIN_WAITING) ||
            loginState === LOGIN_OK ? (
              <div className="login-loading">
                <div>{`Reading player log: ${
                  Math.round(logCompletion * 1000) / 10
                }%`}</div>
              </div>
            ) : (
              <div className="auth-pages-container-main">
                <div className="auth-pages-container">
                  <animated.div className="auth-page" style={pageProps}>
                    <label className="form-label">Username</label>
                    <div className="form-input-container">
                      <input
                        type="text"
                        onChange={handleUsernameRecoverChange}
                        autoComplete="off"
                        value={usernameRecover}
                      />
                    </div>
                    <label className="form-label">{`12 word passphrase (${
                      passphrase.split(" ").length
                    }/12)`}</label>
                    <div
                      className="form-input-container"
                      style={{
                        marginBottom: "48px",
                      }}
                    >
                      <textarea
                        onChange={handlePassphraseCHange}
                        autoComplete="off"
                        style={{
                          height: "64px",
                        }}
                        value={passphrase}
                      />
                    </div>
                    <button
                      style={{
                        margin: "14px 0 4px 0",
                      }}
                      className="form-button"
                      type="button"
                      onClick={onRecover}
                    >
                      Recover
                    </button>
                    <div className="form-error">{errorMessage}</div>
                    <div className="message-small">
                      <a onClick={() => setPage(1)} className="signup-link">
                        Log in!
                      </a>
                    </div>
                  </animated.div>
                  <animated.div className="auth-page" style={pageProps}>
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
                    <div
                      style={{
                        color: "var(--color-text-link)",
                        cursor: "pointer",
                        marginBottom: "16px",
                      }}
                    >
                      <a
                        onClick={(): void => setPage(0)}
                        className="forgot_link"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <div style={{ display: "flex" }}>
                      <button
                        className="form-button"
                        type="submit"
                        onClick={onLogin}
                      >
                        Login
                      </button>

                      <label htmlFor="keysInput" style={{ margin: "0" }}>
                        <Button
                          className="keys-button auth"
                          onClick={voidFn}
                          text=""
                        >
                          <PutKey />
                          <div>Use key</div>
                        </Button>
                        <input
                          style={{ display: "none" }}
                          onChange={onKeysChange}
                          ref={keysInputRef}
                          id="keysInput"
                          type="file"
                        />
                      </label>
                    </div>
                    <div className="form-error">{errorMessage}</div>
                    <div className="form-options">
                      <Checkbox
                        style={{
                          width: "max-content",
                          margin: "auto auto 12px auto",
                        }}
                        text="Remember me?"
                        value={rememberme}
                        callback={setRememberme}
                      />
                      <div className="message-small">
                        Dont have an account?{" "}
                        <a onClick={() => setPage(2)} className="signup-link">
                          Sign up!
                        </a>
                      </div>
                    </div>
                  </animated.div>
                  <animated.div className="auth-page" style={pageProps}>
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
                        type="password"
                        autoComplete="off"
                        value={signupPass}
                      />
                    </div>
                    <label className="form-label">Confirm Password</label>
                    <div className="form-input-container">
                      <input
                        onChange={handleSingupPassConfirmChange}
                        type="password"
                        autoComplete="off"
                        value={signupPassConfirm}
                      />
                    </div>
                    <button
                      style={{
                        margin: "14px 0 4px 0",
                      }}
                      className="form-button"
                      type="button"
                      onClick={onSignup}
                    >
                      Signup
                    </button>
                    <div className="form-error">{errorMessage}</div>
                    <div className="message-small">
                      Already have an account?
                      <a onClick={() => setPage(1)} className="signup-link">
                        Log in!
                      </a>
                    </div>
                  </animated.div>
                </div>
              </div>
            )}
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
