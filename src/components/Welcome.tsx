import { useState } from "react";
import { useHistory } from "react-router-dom";

import setLocalSetting from "../utils/setLocalSetting";

export default function Welcome() {
  const [page, setPage] = useState(0);
  const history = useHistory();

  const Next = () => (
    <div
      style={{
        height: "36px",
        width: "120px",
        margin: "auto",
      }}
      className="button-simple"
      onClick={() => setPage(page + 1)}
    >
      Next
    </div>
  );

  const finish = () => {
    setLocalSetting("welcome", "true");
    history.push("/auth");
  };

  return (
    <form style={{ height: "100%" }}>
      <div className="form-container">
        <div
          className="form-authenticate"
          style={{ height: "280px", maxWidth: "650px", width: "650px" }}
        >
          <div className="form-icon" />
          {page === 0 && (
            <div className="welcome-page">
              <h1>Welcome!</h1>
              <p>We are glad to see you here!</p>
              <p>
                Looks like this is your first time around. Thanks for joining
                MTG Arena Tool!
              </p>
              <p>
                Take a moment to read about our key features before you get
                started;
              </p>
              <div className="buttons-flex">
                <div
                  style={{
                    height: "36px",
                    width: "120px",
                    margin: "auto 0 0 0",
                  }}
                  className="button-simple"
                  onClick={() => setPage(1)}
                >
                  Ok!
                </div>
                <div
                  style={{
                    height: "36px",
                    width: "120px",
                    margin: "auto 0 0 0",
                  }}
                  className="button-simple-dark"
                  onClick={finish}
                >
                  Skip
                </div>
              </div>
            </div>
          )}
          {page === 1 && (
            <div className="welcome-page">
              <h1>Your data, on your device</h1>
              <p>
                MTG Arena Tool reads your Arena log (and, on Windows, the game
                itself) to track your matches, decks, collection and drafts.
              </p>
              <p>
                Everything is stored locally first, so the tracker works even
                when you are offline.
              </p>
              <div className="buttons-flex">
                <Next />
              </div>
            </div>
          )}
          {page === 2 && (
            <div className="welcome-page">
              <h1>Optional account</h1>
              <p>
                Creating an account only requires a username and a password — no
                email, no personal data.
              </p>
              <p>
                Accounts will power cross-device sync and community features as
                v6 rolls out, but you can also use the app fully offline without
                one.
              </p>
              <div className="buttons-flex">
                <Next />
              </div>
            </div>
          )}
          {page === 3 && (
            <div className="welcome-page">
              <h1>Enjoy Magic</h1>
              <p>
                Our goal is to enhance your MTG Arena experience as much as
                possible, while providing the best experience we can.
              </p>
              <p>
                We are passionate about Magic, and love developing software for
                such an amazing community.
              </p>
              <p>Go ahead and play some Magic!</p>
              <div className="buttons-flex">
                <div
                  style={{
                    height: "36px",
                    width: "120px",
                    margin: "auto",
                  }}
                  className="button-simple"
                  onClick={finish}
                >
                  Get Started
                </div>
              </div>
            </div>
          )}
          <div className="page-indicator">{page + 1}/4</div>
        </div>
      </div>
    </form>
  );
}
