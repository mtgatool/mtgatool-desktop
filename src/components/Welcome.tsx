import { useState } from "react";
import { useHistory } from "react-router-dom";

import setLocalSetting from "../utils/setLocalSetting";
import Link from "./Link";

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
                We are not your traditional deck tracker, so please, take a
                moment to read about our key features before you get started;
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
                  onClick={() => {
                    setLocalSetting("welcome", "true");
                    history.push("/auth");
                  }}
                >
                  Skip
                </div>
              </div>
            </div>
          )}
          {page === 1 && (
            <div className="welcome-page">
              <h1>Decentralization</h1>
              <p>
                Starting now, anyone (even you!) can host its own copy of the
                MTG Arena Tool server/peer and join the network to validate and
                replicate data.
              </p>

              <p>
                We created a server that can (relatively) easily be deployed
                anywhere and quickly join the network of our protocol, check it
                here;
              </p>
              <p />
              <p>
                <Link url="https://github.com/Manuel-777/chain-swarm" />
              </p>
              <div className="buttons-flex">
                <Next />
              </div>
            </div>
          )}
          {page === 2 && (
            <div className="welcome-page">
              <h1>Your keys, your data</h1>
              <p>
                MTG Arena Tool was rebuilt using a custom blockchain-like
                information verification protocol to validate every bit of users
                data.
              </p>
              <p>
                In a nutshell; No one can edit your data without your keys, and
                those belong to you only.
              </p>

              <p>You can learn more about our custom protocol, here;</p>
              <p />
              <p>
                <Link url="https://github.com/Manuel-777/tool-db" />
              </p>
              <div className="buttons-flex">
                <Next />
              </div>
            </div>
          )}
          {page === 3 && (
            <div className="welcome-page">
              <h1>Security and Privacy</h1>
              <p>
                MTG Arena Tool does not store your data in a central server like
                normal apps. Everything is stored in a peer-to-peer network.
              </p>
              <p>
                This also means we have to enforce higher security standards to
                protect your account. For this reason your password is not
                stored anywhere in the network.
              </p>
              <p>
                Losing your password means neither you or anyone else will be
                able to access your account!
              </p>
              <div className="buttons-flex">
                <Next />
              </div>
            </div>
          )}
          {page === 4 && (
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
                  onClick={() => {
                    setLocalSetting("welcome", "true");
                    history.push("/auth");
                  }}
                >
                  Get Started
                </div>
              </div>
            </div>
          )}
          <div className="page-indicator">{page + 1}/5</div>
        </div>
      </div>
    </form>
  );
}
