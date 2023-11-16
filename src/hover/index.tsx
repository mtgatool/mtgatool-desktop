import { BrowserWindow } from "electron";
import { Chances, constants } from "mtgatool-shared";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import NoCard from "../assets/images/nocard.png";
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import { Settings } from "../common/defaultConfig";
import { CARD_SIZE_RATIO } from "../common/static";
import useTransparentFix from "../hooks/useTransparentFix";
import GroupedLandsDetails from "../overlay/GroupedLandsDetails";
import {
  ALL_OVERLAYS,
  WINDOW_MAIN,
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
} from "../types/app";
import bcConnect from "../utils/bcConnect";
import electron from "../utils/electron/electronWrapper";
import remote from "../utils/electron/remoteWrapper";
import setTopMost from "../utils/electron/setTopMost";
import getBackUrl from "../utils/getBackUrl";
import { getCardImage } from "../utils/getCardArtCrop";
import getLocalSetting from "../utils/getLocalSetting";
import isCardDfc from "../utils/isCardDfc";
import vodiFn from "../utils/voidfn";

const { LANDS_HACK } = constants;

export default function Hover() {
  useTransparentFix();
  if (remote) {
    remote.getCurrentWindow().setFocusable(false);
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = useCallback(() => {
    if (remote && electron) {
      const allWindowNames = remote.BrowserWindow.getAllWindows().map(
        (w: BrowserWindow) => w.getTitle()
      );

      const hasOverlay =
        allWindowNames.includes(WINDOW_OVERLAY_0) ||
        allWindowNames.includes(WINDOW_OVERLAY_1) ||
        allWindowNames.includes(WINDOW_OVERLAY_2) ||
        allWindowNames.includes(WINDOW_OVERLAY_3) ||
        allWindowNames.includes(WINDOW_OVERLAY_4);

      let display = remote.screen.getPrimaryDisplay();
      remote.BrowserWindow.getAllWindows().forEach((w: BrowserWindow) => {
        if (hasOverlay) {
          if (ALL_OVERLAYS.includes(w.getTitle())) {
            const bounds = w.getBounds();
            display = remote.screen.getDisplayMatching(bounds);
          }
        } else if (w.getTitle() === WINDOW_MAIN) {
          const bounds = w.getBounds();
          display = remote.screen.getDisplayMatching(bounds);
        }
      });
      const bounds = remote.getCurrentWindow().getBounds();

      const left = display.bounds.x;
      const center =
        display.bounds.x +
        Math.round(display.bounds.width / 2 - bounds.width / 2);
      const right = display.bounds.x + display.bounds.width - bounds.width;

      const top = display.bounds.y;

      const middle =
        display.bounds.y +
        Math.round(display.bounds.height / 2) -
        bounds.height / 2;

      const bottom =
        display.bounds.y +
        Math.round(display.bounds.height - bounds.height - 32);

      const pos = settings.hoverPosition;

      let xPos = center;
      let yPos = bottom;
      switch (pos) {
        case 0:
          xPos = left;
          yPos = top;
          break;
        case 1:
          xPos = center;
          yPos = top;
          break;
        case 2:
          xPos = right;
          yPos = top;
          break;
        case 3:
          xPos = left;
          yPos = middle;
          break;
        case 4:
          xPos = center;
          yPos = middle;
          break;
        case 5:
          xPos = right;
          yPos = middle;
          break;
        case 6:
          xPos = left;
          yPos = bottom;
          break;
        case 7:
          xPos = center;
          yPos = bottom;
          break;
        case 8:
          xPos = right;
          yPos = bottom;
          break;
        default:
          break;
      }

      remote.getCurrentWindow().setBounds({
        x: xPos,
        y: yPos,
      });
    }
  }, [settings]);

  useEffect(() => {
    const size = 100 + hoverSize * 15;
    const cardWidth = size;
    const cardHeight = size / CARD_SIZE_RATIO;

    const width = Math.round(cardWidth * 2 + 64);
    const height = Math.round(cardHeight + 48);

    if (remote) {
      remote.getCurrentWindow().setBounds({ width, height });
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
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setHovering(false);
        }, 5000);
      }

      if (msg.data.type == "HOVER_OUT") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setHovering(false);
      }

      if (msg.data.type === "OVERLAY_UPDATE") {
        setCardOdds(msg.data.value.playerCardsOdds);
      }
    },
    [timeoutRef]
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
    let op = "block";
    if (!isCardDfc(grpId || 0)) {
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
      remote.getCurrentWindow().show();
    } else {
      hideRef.current = setTimeout(() => {
        if (remote) remote.getCurrentWindow().hide();
      }, 250);
    }
    if (grpId) {
      // Reset the image, begin new loading and clear state
      const front = getCardImage(grpId, quality);
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
