import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import mainBackground from "../../../assets/images/main-background.jpg";
import { ReactComponent as ShuffleIcon } from "../../../assets/images/svg/shuffle.svg";
import {
  loadArtSource,
  saveArtSource,
  saveLocalBackground,
  toDescriptor,
} from "../../../data/backgroundStore";
import { setProfileBackground } from "../../../data/profile";
import fetchRandomArt from "../../../data/randomArt";
import reduxAction from "../../../redux/reduxAction";
import { CustomBackground } from "../../../redux/slices/rendererSlice";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardQuality } from "../../../types";
import database from "../../../utils/database-wrapper";
import isElectron from "../../../utils/electron/isElectron";
import { getCardImage } from "../../../utils/getCardArtCrop";
import getLocalSetting from "../../../utils/getLocalSetting";
import openExternal from "../../../utils/openExternal";
import setLocalSetting from "../../../utils/setLocalSetting";
import CardTile from "../../CardTile";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Slider from "../../ui/Slider";

function BackgroundSetting(): JSX.Element {
  const dispatch = useDispatch();
  const customBackground = useSelector(
    (state: AppState) => state.renderer.customBackground
  );
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore the remembered "Art source" (scopes the shuffle).
  useEffect(() => {
    loadArtSource()
      .then((s) => s && setSource(s))
      .catch(() => undefined);
  }, []);

  const onSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSource(e.target.value);
      saveArtSource(e.target.value);
    },
    []
  );

  // Apply a background everywhere: Redux (visible now), local KV (restored on
  // next boot before login) and the cloud profile (follows the account, as a
  // compact descriptor — local-file picks stay on the device only).
  const applyBackground = useCallback(
    (bg: CustomBackground | null) => {
      reduxAction(dispatch, { type: "SET_CUSTOM_BACKGROUND", arg: bg });
      saveLocalBackground(bg);
      setProfileBackground(toDescriptor(bg));
    },
    [dispatch]
  );

  // An /art/… source is an exact pick; anything else (set/artist page, or empty)
  // shuffles. Empty = across all sets.
  const isExactPick = /\/art\/[a-z0-9-]+/i.test(source);

  const shuffle = useCallback(() => {
    setLoading(true);
    fetchRandomArt(source.trim() || undefined)
      .then((art) => {
        if (art) {
          applyBackground({
            url: art.url,
            source: "artofmtg",
            title: art.title,
            artist: art.artist,
            set: art.set,
            page: art.page,
            imageUrl: art.imageUrl,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [applyBackground, source]);

  const pickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result;
        if (typeof url === "string") {
          applyBackground({ url, source: "local" });
        }
      };
      reader.readAsDataURL(file);
      // Allow re-picking the same file later.
      e.target.value = "";
    },
    [applyBackground]
  );

  const reset = useCallback(() => {
    applyBackground(null);
  }, [applyBackground]);

  const preview = customBackground?.url || mainBackground;
  const meta =
    customBackground?.source === "artofmtg" ? customBackground : null;

  let sourceHint = "Empty — the button shuffles across every set.";
  if (isExactPick) {
    sourceHint = "Exact art — the button below sets this piece.";
  } else if (source.trim()) {
    sourceHint = "Scoped — the button shuffles within this set / artist.";
  }

  let shuffleLabel = "Shuffle random MtG art";
  if (loading) {
    shuffleLabel = "Loading…";
  } else if (isExactPick) {
    shuffleLabel = "Use this art";
  }

  return (
    <div
      className="centered-setting-container"
      style={{ flexDirection: "column", alignItems: "stretch" }}
    >
      <label style={{ marginBottom: "12px" }}>App background</label>

      <div
        style={{
          width: "100%",
          height: "160px",
          borderRadius: "4px",
          border: "1px solid var(--color-line-sep)",
          backgroundImage: `url("${preview}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {meta && (
        <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
          <div style={{ color: "var(--color-text-hover)" }}>
            {meta.title}
            {meta.artist ? ` — ${meta.artist}` : ""}
          </div>
          <div style={{ fontSize: "12px", marginTop: "2px" }}>
            {meta.set}
            {meta.page && (
              <>
                {meta.set ? " · " : ""}
                <span
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                    color: "var(--color-text-link)",
                  }}
                  onClick={() => openExternal(meta.page as string)}
                >
                  View on artofmtg.com
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <input
          type="text"
          value={source}
          onChange={onSourceChange}
          placeholder="Optional: paste an artofmtg.com art, set or artist URL"
          style={{ flex: 1, margin: 0 }}
        />
        <Button
          text="Browse ↗"
          onClick={() => openExternal("https://www.artofmtg.com/mtg-sets/")}
        />
      </div>
      <div style={{ fontSize: "12px", marginTop: "6px", opacity: 0.8 }}>
        {sourceHint}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          marginTop: "16px",
        }}
      >
        <Button
          text=""
          disabled={loading}
          onClick={shuffle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "220px",
          }}
        >
          <ShuffleIcon style={{ width: "18px", height: "18px" }} />
          {shuffleLabel}
        </Button>

        {isElectron() && (
          <Button
            text="Choose from computer"
            onClick={() => fileInputRef.current?.click()}
          />
        )}

        {customBackground && (
          <Button
            text="Reset to default"
            className="button-simple-red"
            onClick={reset}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        onChange={pickFile}
      />
    </div>
  );
}

export default function VisualSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();
  const settings = useSelector((state: AppState) => state.settings);
  const cardSize = 100 + settings.cardsSize * 15;
  const card = database.card(70344);

  // Hover card size slider
  const [hoverCardSize, setHoverCardSize] = useState(
    settings.cardsSizeHoverCard
  );

  const hoverCardSizeDebouce = useMemo(() => {
    return _.debounce((value: number) => {
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { cardsSizeHoverCard: value },
      });
    }, 500);
  }, [dispatch]);

  const hoverCardSizeHandler = (value: number): void => {
    setHoverCardSize(value);
    hoverCardSizeDebouce(value);
  };

  // Collection card size slider
  const [collectionCardSize, setCollectionCardSize] = useState(
    settings.cardsSize
  );

  const collectionCardSizeDebouce = useMemo(() => {
    return _.debounce((value: number) => {
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { cardsSize: value },
      });
    }, 500);
  }, [dispatch]);

  const collectionCardSizeHandler = (value: number): void => {
    setCollectionCardSize(value);
    collectionCardSizeDebouce(value);
  };

  const setCardQuality = useCallback(
    (filter: CardQuality) => {
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { cardsQuality: filter },
      });
    },
    [dispatch]
  );

  return (
    <>
      <BackgroundSetting />

      <div
        style={{
          borderTop: "1px solid var(--color-line-sep)",
          margin: "16px 0 4px",
        }}
      />

      <div className="centered-setting-container">
        {!!card && (
          <CardTile
            card={card}
            indent="a"
            isHighlighted={false}
            isSideboard={false}
            quantity={{ type: "NUMBER", quantity: 4 }}
            showWildcards={false}
          />
        )}
      </div>
      <div className="centered-setting-container">
        <label>Cards image quality:</label>
        <Select
          options={["small", "normal", "large"]}
          current={settings.cardsQuality}
          callback={setCardQuality}
        />
      </div>
      <div className="centered-setting-container">
        <label>UI effects</label>
        <Select
          options={["web", "high"]}
          current={getLocalSetting("css")}
          optionFormatter={(mode) => {
            if (mode === "web") return "Low";
            if (mode === "high") return "High";
            return "";
          }}
          callback={(mode) => setLocalSetting("css", mode)}
        />
      </div>
      <div className="centered-setting-container">
        <label style={{ width: "400px" }}>
          {`Hover card size: ${100 + Math.round(hoverCardSize) * 15}px`}
        </label>
        <Slider
          min={0}
          max={20}
          step={1}
          value={settings.cardsSizeHoverCard}
          onChange={hoverCardSizeHandler}
        />
      </div>

      <div className="centered-setting-container">
        <label style={{ width: "400px" }}>
          {`Collection card size: ${
            100 + Math.round(collectionCardSize) * 15
          }px`}
        </label>
        <Slider
          min={0}
          max={20}
          step={1}
          value={settings.cardsSize}
          onChange={collectionCardSizeHandler}
        />
      </div>

      <label>
        Example collection card:
        <div
          className="inventory-card-settings"
          style={{
            marginTop: "16px",
            width: `${cardSize}px`,
            alignSelf: "flex-start",
          }}
        >
          {card && (
            <img
              className="inventory-card-settings-img"
              style={{ width: `${cardSize}px` }}
              src={getCardImage(card, settings.cardsQuality)}
            />
          )}
        </div>
      </label>
    </>
  );
}
