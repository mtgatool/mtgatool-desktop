import { sha1 } from "mtgatool-shared";
import { useHistory } from "react-router-dom";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { animated, useSpring } from "react-spring";
import { LOGIN_OK, LOGIN_WAITING } from "mtgatool-shared/dist/shared/constants";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import login from "../gun/login";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import getLocalSetting from "../utils/getLocalSetting";
import setLocalSetting from "../utils/setLocalSetting";
import Checkbox from "./ui/Checkbox";
import AuthSettings from "./AuthSettings";
import IconButton from "./ui/IconButton";

import settingsIcon from "../assets/images/cog.png";
import signup from "../gun/signup";
import checkPassphrase from "../gun/checkPassphrase";
import voiFn from "../utils/voidfn";
import PopupComponent from "./PopupComponent";

type InputChange = ChangeEvent<HTMLInputElement>;

export default function Auth() {
  const [page, sePage] = useState(1);

  const history = useHistory();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState("");
  const [pass, setPass] = useState(getLocalSetting("savedPassword"));
  const [username, setUsername] = useState(getLocalSetting("username"));
  const [usernameRecover, setUsernameRecover] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupPassConfirm, setSignupPassConfirm] = useState("");

  const [passphrase, setPassphrase] = useState("");

  const [rememberme, setRememberme] = useState(
    getLocalSetting("rememberme") == "true"
  );

  const { loginState, logCompletion, loading } = useSelector(
    (state: AppState) => state.renderer
  );

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
        if (pass !== getLocalSetting("savedPassword")) {
          setLocalSetting("savedPassword", sha1(pass));
        }
      } else {
        setLocalSetting("username", "");
        setLocalSetting("savedPassword", "");
      }
      history.push("/home");
    }
  }, [loginState, username, pass, rememberme, history]);

  const onSubmit = useCallback(
    (e): void => {
      e.preventDefault();
      if (pass.length < 8) {
        setErrorMessage("Passwords must contain at least 8 characters.");
      } else {
        const pwd =
          getLocalSetting("savedPassword") == pass ? pass : sha1(pass);
        login(username, pwd)
          .then(() => {
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
          })
          .catch(setErrorMessage);
      }
    },
    [username, pass]
  );

  const onSignup = useCallback(
    (e): void => {
      e.preventDefault();
      if (signupUsername.length < 6) {
        setErrorMessage("Username must be at least 6 characters long");
      } else if (signupPass.length < 8) {
        setErrorMessage("Passwords must contain at least 8 characters.");
      } else if (signupPass !== signupPassConfirm) {
        setErrorMessage("Passwords must match");
      } else {
        setUsername(signupUsername);
        setPass(signupPass);
        const pwd = sha1(signupPass);
        signup(signupUsername, pwd)
          .then(() => {
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
          })
          .catch(setErrorMessage);
      }
    },
    [signupUsername, signupPass, signupPassConfirm]
  );

  const onRecover = useCallback(
    (e): void => {
      e.preventDefault();
      if (passphrase.split(" ").length !== 12) {
        setErrorMessage("Passphrase needs to have 12 words");
      } else {
        checkPassphrase(usernameRecover, passphrase)
          .then((hint) => setErrorMessage(`Your pasword hint is: ${hint}`))
          .catch(setErrorMessage);
      }
    },
    [passphrase, usernameRecover]
  );

  const openPopup = useRef<() => void>(voiFn);
  const closePopup = useRef<() => void>(voiFn);

  const pageProps = useSpring({
    left: `${0 - page * 33.33}%`,
  }) as any;

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
      <form>
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
                        marginBottom: "20px",
                      }}
                    >
                      <textarea
                        onChange={handlePassphraseCHange}
                        autoComplete="off"
                        style={{
                          height: "40px",
                        }}
                        value={passphrase}
                      />
                    </div>
                    <button
                      style={{
                        margin: "14px 0 4px 0",
                      }}
                      className="form-button"
                      type="submit"
                      onClick={onRecover}
                    >
                      Recover
                    </button>
                    <div className="form-error">{errorMessage}</div>
                    <div className="message-small">
                      <a onClick={() => sePage(1)} className="signup-link">
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
                        type="password"
                        autoComplete="off"
                        value={pass}
                      />
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-link)",
                        cursor: "pointer",
                        marginBottom: "16px",
                      }}
                    >
                      <a
                        onClick={(): void => sePage(0)}
                        className="forgot_link"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <button
                      className="form-button"
                      type="submit"
                      onClick={onSubmit}
                    >
                      Login
                    </button>
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
                        <a onClick={() => sePage(2)} className="signup-link">
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
                      type="submit"
                      onClick={onSignup}
                    >
                      Signup
                    </button>
                    <div className="form-error">{errorMessage}</div>
                    <div className="message-small">
                      Already have an account?{" "}
                      <a onClick={() => sePage(1)} className="signup-link">
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
      <div className="app-settings">
        <IconButton
          style={{ margin: "auto" }}
          icon={settingsIcon}
          onClick={openPopup.current}
        />
      </div>
    </>
  );
}
