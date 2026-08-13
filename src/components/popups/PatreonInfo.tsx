import { useCallback, useEffect, useState } from "react";

import openExternal from "../../utils/openExternal";
import PatreonLogo from "../PatreonLogo";
import { TIERS } from "../SupporterTierIcon";

interface DialogProps {
  closeCallback?: () => void;
}

/**
 * Perk list. `accent` picks a dot colour from the tier palette for variety —
 * it is decoration, NOT the tier that unlocks the perk (the profile perks
 * unlock at Standard).
 */
const PERKS = [
  { text: "Browse the full match history on player profiles", accent: 3 },
  { text: "See other players' decks and their records", accent: 4 },
  { text: "Access global cards winrate statistics", accent: 2 },
  { text: "Get priority support", accent: 1 },
];

/** Patreon marks floating around the header band. */
const FLOATERS: React.CSSProperties[] = [
  { width: "42px", top: "-10px", left: "24px", transform: "rotate(-16deg)" },
  { width: "26px", top: "34px", left: "84px", transform: "rotate(12deg)" },
  { width: "58px", top: "10px", right: "-14px", transform: "rotate(20deg)" },
  { width: "22px", top: "-6px", right: "92px", transform: "rotate(-24deg)" },
  { width: "30px", bottom: "-12px", left: "180px", transform: "rotate(8deg)" },
];

export default function PatreonInfo(props: DialogProps): JSX.Element {
  const { closeCallback } = props;
  const [open, setOpen] = useState(0);

  const handleClose = useCallback(
    (e) => {
      setOpen(0);
      e.stopPropagation();
      if (closeCallback) {
        closeCallback();
      }
    },
    [closeCallback]
  );

  useEffect(() => {
    // React doesnt give css time to know there was a change
    // in the properties, adding a timeout solves that.
    setTimeout(() => {
      setOpen(1);
    }, 1);
  }, []);

  return (
    <div
      className="popup-background"
      style={{
        opacity: open * 2,
        backgroundColor: `rgba(0, 0, 0, ${0.5 * open})`,
      }}
      onClick={handleClose}
    >
      <div
        className="popup-div-nopadding"
        style={{
          height: `${open * 470}px`,
          maxHeight: "92vh",
          width: `${open * 520}px`,
          overflowY: "auto",
          overflowX: "hidden",
        }}
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        <div className="patreon-info-pop-top">
          {FLOATERS.map((style, i) => (
            <PatreonLogo
              // eslint-disable-next-line react/no-array-index-key
              key={`patreon-float-${i}`}
              className="patreon-float"
              style={style}
            />
          ))}
          <div
            style={{ color: "var(--color-text-hover)" }}
            className="message-sub"
          >
            You discovered a Patreon exclusive feature!
          </div>
        </div>
        <div className="patreon-info-pop-bottom">
          {PERKS.map((perk) => (
            <div className="patreon-perk" key={perk.text}>
              <div
                className="patreon-perk-dot"
                style={{ backgroundColor: TIERS[perk.accent].top }}
              />
              <div>{perk.text}</div>
            </div>
          ))}
          <div className="patreon-desc-text">
            Supporting also helps us develop new amazing features! See our
            Patreon page to learn more about upcoming and planned perks:
          </div>
          <button
            type="button"
            className="patreon_link_thin"
            title="Open on browser"
            aria-label="Become a patron on Patreon"
            onClick={(): void =>
              openExternal("https://www.patreon.com/cw/mtgatool")
            }
          />
        </div>
      </div>
    </div>
  );
}
