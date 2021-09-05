import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { constants } from "mtgatool-shared";
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import NoCard from "../assets/images/nocard.png";
import { Settings } from "../common/defaultConfig";
import bcConnect from "../utils/bcConnect";
import electron from "../utils/electron/electronWrapper";
import getBackUrl from "../utils/getBackUrl";
import getFrontUrl from "../utils/getFrontUrl";
import getLocalSetting from "../utils/getLocalSetting";
import vodiFn from "../utils/voidfn";
import isCardDfc from "../utils/isCardDfc";
import database from "../utils/database-wrapper";
import {
  ALL_OVERLAYS,
  WINDOW_MAIN,
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
} from "../types/app";

import { Chances } from "../../../mtgatool-shared/dist";
import GroupedLandsDetails from "../overlay/GroupedLandsDetails";
import { CARD_SIZE_RATIO } from "../common/static";
import useTransparentFix from "../hooks/useTransparentFix";
import setTopMost from "../utils/electron/setTopMost";

const { LANDS_HACK } = constants;

export default function Hover() {
  useTransparentFix();
  if (electron) {
    electron.remote.getCurrentWindow().setFocusable(false);
    setTopMost(true);
  }
  const [hovering, setHovering] = useState(false);
  const [cardOdds, setCardOdds] = useState<Chances>();
  const [grpId, setGrpId] = useState<number>();
  const [settings, setSettings] = useState<Settings>(
    JSON.parse(getLocalSetting("settings")) as Settings
  );
  const hideRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const quality = useMemo(() => settings?.cardsQuality || "normal", [settings]);
  const hoverSize = useMemo(
    () => settings?.cardsSizeHoverCard || 12,
    [settings]
  );

  const [frontLoaded, setFrontLoaded] = useState(0);
  const [backLoaded, setBackLoaded] = useState(0);
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");

  const calculatePosition = useCallback(() => {
    const remote = electron?.remote;
    if (remote) {
      const allWindowNames = remote.BrowserWindow.getAllWindows().map((w) =>
        w.getTitle()
      );

      const hasOverlay =
        allWindowNames.includes(WINDOW_OVERLAY_0) ||
        allWindowNames.includes(WINDOW_OVERLAY_1) ||
        allWindowNames.includes(WINDOW_OVERLAY_2) ||
        allWindowNames.includes(WINDOW_OVERLAY_3) ||
        allWindowNames.includes(WINDOW_OVERLAY_4);

      let display = remote.screen.getPrimaryDisplay();
      remote.BrowserWindow.getAllWindows().forEach((w) => {
        if (electron) {
          if (hasOverlay) {
            if (ALL_OVERLAYS.includes(w.getTitle())) {
              const bounds = w.getBounds();
              display = remote.screen.getDisplayMatching(bounds);
            }
          } else if (w.getTitle() === WINDOW_MAIN) {
            const bounds = w.getBounds();
            display = remote.screen.getDisplayMatching(bounds);
          }
        }
      });

      const bounds = remote.getCurrentWindow().getBounds();
      remote.getCurrentWindow().setBounds({
        x:
          display.bounds.x +
          Math.round(display.bounds.width / 2 - bounds.width / 2),
        y:
          display.bounds.y +
          Math.round(display.bounds.height - bounds.height - 32),
      });
    }
  }, []);

  useEffect(() => {
    const size = 100 + hoverSize * 15;
    const cardWidth = size;
    const cardHeight = size / CARD_SIZE_RATIO;

    const width = Math.round(cardWidth * 2 + 64);
    const height = Math.round(cardHeight + 48);

    if (electron) {
      electron.remote.getCurrentWindow().setBounds({ width, height });
    }
  }, [hoverSize]);

  const channelMessageHandler = useCallback(
    (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "OVERLAY_UPDATE_SETTINGS") {
        const newSettings = JSON.parse(getLocalSetting("settings")) as Settings;
        setSettings(newSettings);
      }

      if (msg.data.type == "HOVER_IN") {
        setGrpId(msg.data.value);
        setHovering(true);
      }

      if (msg.data.type == "HOVER_OUT") {
        setHovering(false);
      }

      if (msg.data.type === "OVERLAY_UPDATE") {
        setCardOdds(msg.data.value.playerCardsOdds);
      }
    },
    []
  );

  useEffect(() => {
    const channel = bcConnect() as any;
    channel.onmessage = channelMessageHandler;
  }, []);

  const styleFront = useMemo((): CSSProperties => {
    const size = 100 + hoverSize * 15;

    return {
      width: `${size}px`,
      height: `${size / CARD_SIZE_RATIO}px`,
      backgroundImage: `url(${frontLoaded == grpId ? frontUrl : NoCard})`,
    };
  }, [frontUrl, grpId, frontLoaded, hoverSize]);

  const styleDfc = useMemo((): CSSProperties => {
    const size = 100 + hoverSize * 15;
    const cardObj = database.card(grpId || 0);
    let op = "block";
    if (!(cardObj?.dfcId && isCardDfc(grpId || 0))) {
      op = "none";
    }

    return {
      width: `${size}px`,
      height: `${size / CARD_SIZE_RATIO}px`,
      backgroundImage: `url(${backLoaded == grpId ? backUrl : NoCard})`,
      display: op,
    };
  }, [backUrl, grpId, backLoaded, hoverSize]);

  useEffect(() => {
    if (!electron) return vodiFn;

    if (hideRef.current) {
      clearTimeout(hideRef.current);
    }
    if (hovering && settings?.overlayHover) {
      calculatePosition();
      electron.remote.getCurrentWindow().show();
    } else {
      hideRef.current = setTimeout(() => {
        if (electron) electron.remote.getCurrentWindow().hide();
      }, 250);
    }
    if (grpId) {
      // Reset the image, begin new loading and clear state
      const front = getFrontUrl(grpId, quality);
      const back = getBackUrl(grpId, quality);
      const img = new Image();
      img.src = front;
      img.onload = (): void => {
        setFrontUrl(front);
        setFrontLoaded(grpId);
      };
      const imgb = new Image();
      imgb.src = back;
      imgb.onload = (): void => {
        if (back) {
          setBackUrl(back);
          setBackLoaded(grpId);
        }
      };
      return (): void => {
        img.onload = vodiFn;
        imgb.onload = vodiFn;
      };
    }
    return vodiFn;
  }, [grpId, hovering, quality, settings, calculatePosition]);

  return (
    <div className="click-through hover-root">
      <div ref={wrapperRef} className="hover-cards-wrapper">
        {grpId == LANDS_HACK && cardOdds ? (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <GroupedLandsDetails {...cardOdds} />
        ) : (
          <>
            <div style={styleDfc} className="hover-overlay-dfc" />
            <div style={styleFront} className="hover-overlay-main" />
          </>
        )}
      </div>
    </div>
  );
}
