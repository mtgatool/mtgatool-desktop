import _ from "lodash";
import {
  COLORS_ALL,
  OVERLAY_DRAFT,
  OVERLAY_DRAFT_BREW,
  OVERLAY_DRAFT_MODES,
  OVERLAY_FULL,
  OVERLAY_LEFT,
  OVERLAY_LOG,
  OVERLAY_MIXED,
  OVERLAY_ODDS,
  OVERLAY_SEEN,
} from "mtgatool-shared/dist/shared/constants";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { defaultConfig, OverlaySettings } from "../../../common/defaultConfig";
import useColorPicker from "../../../hooks/useColorPicker";
import reduxAction from "../../../redux/reduxAction";
import store, { AppState } from "../../../redux/stores/rendererStore";
import vodiFn from "../../../utils/voidfn";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import Slider from "../../ui/Slider";
import Toggle from "../../ui/Toggle";

function backgroundColorPicker(color: string): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { overlayBackColor: color },
  });
}

function saveOverlaySettings(
  current: number,
  newSettings: Partial<OverlaySettings>
): void {
  reduxAction(store.dispatch, {
    type: "SET_OVERLAY_SETTINGS",
    arg: { id: current, settings: newSettings },
  });
}

interface OverlaysTopNavProps {
  current: number;
  setCurrent: (overlay: number) => void;
}

function OverlaysTopNav(props: OverlaysTopNavProps): JSX.Element {
  const overlays = [0, 1, 2, 3, 4];

  function setCurrentOverlaySettings(current: number): void {
    reduxAction(store.dispatch, {
      type: "SET_SETTINGS",
      arg: { settingsOverlaySection: current },
    });
  }

  return (
    <div className="overlay-section-selector-cont">
      {overlays.map((id: number) => {
        return (
          <div
            onClick={(): void => {
              setCurrentOverlaySettings(id);
              props.setCurrent(id);
            }}
            key={id}
            style={{
              borderBottomColor: `var(--color-${COLORS_ALL[id]})`,
            }}
            className={`overlay-settings-nav ${
              props.current == id ? "item-selected" : ""
            }`}
          >
            {`Overlay ${id + 1}`}
          </div>
        );
      })}
    </div>
  );
}

const modeOptions: any[] = [];
modeOptions[OVERLAY_FULL] = "Full Deck";
modeOptions[OVERLAY_LEFT] = "Library";
modeOptions[OVERLAY_ODDS] = "Next Draw";
modeOptions[OVERLAY_MIXED] = "Library and Odds";
modeOptions[OVERLAY_SEEN] = "Opponent";
modeOptions[OVERLAY_DRAFT] = "Draft Pick";
modeOptions[OVERLAY_LOG] = "Action Log";
modeOptions[OVERLAY_DRAFT_BREW] = "Draft Brew";

const modeHelp: any[] = [];
modeHelp[OVERLAY_FULL] =
  "Shows your complete deck. Usually only shown during a match.";
modeHelp[OVERLAY_LEFT] =
  "Shows your remaining library. Usually only shown during a match.";
modeHelp[OVERLAY_ODDS] =
  "Shows probabilities for your next draw. Usually only shown during a match.";
modeHelp[OVERLAY_MIXED] =
  "Shows probabilities for your next draw and your remaining library. Usually only shown during a match.";
modeHelp[OVERLAY_SEEN] =
  "Shows your Opponent's cards that you have seen. Usually only shown during a match.";
modeHelp[OVERLAY_DRAFT] =
  "Shows the cards in each draft pack/pick. Usually only shown during a draft.";
modeHelp[OVERLAY_LOG] =
  "Shows detailed play-by-play match history. Usually only shown during a match.";
modeHelp[OVERLAY_DRAFT_BREW] =
  "Shows your partially complete draft brew (all previous picks). Usually only shown during a draft.";

interface SectionProps {
  current: number;
  settings: OverlaySettings;
  show: boolean;
}

function OverlaySettingsSection(props: SectionProps): JSX.Element {
  const { settings, current, show } = props;
  const [overlayAlpha, setOverlayAlpha] = useState(0);
  const [overlayAlphaBack, setOverlayAlphaBack] = useState(0);

  // Alpha
  const overlayAlphaDebouce = useMemo(() => {
    return _.debounce((value: number) => {
      saveOverlaySettings(current, { alpha: value });
    }, 250);
  }, [current]);

  const overlayAlphaHandler = (value: number): void => {
    setOverlayAlpha(value);
    overlayAlphaDebouce(value);
  };

  // Alpha Background
  const overlayAlphaBackDebouce = useMemo(() => {
    return _.debounce((value: number) => {
      saveOverlaySettings(current, { alphaBack: value });
    }, 250);
  }, [current]);

  const overlayAlphaBackHandler = (value: number): void => {
    setOverlayAlphaBack(value);
    overlayAlphaBackDebouce(value);
  };

  useEffect(() => {
    setOverlayAlpha(settings ? settings.alpha : 0);
    setOverlayAlphaBack(settings ? settings.alphaBack : 0);
  }, [settings]);

  return show ? (
    <>
      <Toggle
        text={`Enable overlay ${current + 1}`}
        value={settings.show}
        callback={(value: boolean): void =>
          saveOverlaySettings(current, { show: value })
        }
      />
      <div className="centered-setting-container">
        <label>Mode:</label>
        <Select
          options={modeOptions}
          current={modeOptions[settings.mode]}
          callback={(filter: string): void =>
            saveOverlaySettings(current, { mode: modeOptions.indexOf(filter) })
          }
        />
      </div>
      <div className="settings-note">
        <p>
          <i>{modeHelp[settings.mode]}</i>
        </p>
      </div>
      <Toggle
        text="Always show overlay"
        value={settings.showAlways}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { showAlways: val })
        }
      />
      <div className="settings-note">
        <p>
          <i>
            Displays the overlay regardless of Arena match or draft status
            (&quot;Enable Overlay&quot; must also be checked). To adjust overlay
            position, click on its colored icon in the top left to toggle edit
            mode.
          </i>
        </p>
      </div>
      <Toggle
        text="Auto adjust size"
        value={settings.autosize}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { autosize: val })
        }
      />
      {/* <Toggle
        text="Show top bar"
        value={settings.top}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { top: val })
        }
      /> */}
      <Toggle
        text="Show title"
        value={settings.title}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { title: val })
        }
        disabled={settings.mode === OVERLAY_DRAFT}
      />
      <Toggle
        text="Show deck/lists"
        value={settings.deck}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { deck: val })
        }
        disabled={settings.mode === OVERLAY_DRAFT}
      />
      <Toggle
        text="Show sideboard"
        value={settings.sideboard}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { sideboard: val })
        }
        disabled={
          ![OVERLAY_FULL, OVERLAY_LEFT, OVERLAY_ODDS, OVERLAY_MIXED].includes(
            settings.mode
          )
        }
      />
      <Toggle
        text="Compact lands"
        value={settings.lands}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { lands: val })
        }
        disabled={
          ![OVERLAY_FULL, OVERLAY_LEFT, OVERLAY_ODDS, OVERLAY_MIXED].includes(
            settings.mode
          )
        }
      />
      <Toggle
        text="Show clock"
        value={settings.clock}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { clock: val })
        }
        disabled={OVERLAY_DRAFT_MODES.includes(settings.mode)}
      />
      <Toggle
        text="Show odds"
        value={settings.drawOdds}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { drawOdds: val })
        }
        disabled={[
          OVERLAY_FULL,
          OVERLAY_LEFT,
          OVERLAY_SEEN,
          OVERLAY_DRAFT,
          OVERLAY_LOG,
          OVERLAY_DRAFT_BREW,
        ].includes(settings.mode)}
      />
      <Toggle
        text="Show type counts"
        value={settings.typeCounts}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { typeCounts: val })
        }
        disabled={[OVERLAY_LOG, OVERLAY_DRAFT].includes(settings.mode)}
      />
      <Toggle
        text="Show mana curve"
        value={settings.manaCurve}
        callback={(val: boolean): void =>
          saveOverlaySettings(current, { manaCurve: val })
        }
        disabled={[OVERLAY_LOG, OVERLAY_DRAFT].includes(settings.mode)}
      />
      <div className="centered-setting-container">
        <label style={{ width: "400px" }}>
          {`Elements transparency: ${Math.round(overlayAlpha * 100)}%`}
        </label>
        <Slider
          key={`${current}-overlay-alpha-slider`}
          min={0}
          max={1}
          step={0.05}
          value={overlayAlpha}
          onChange={overlayAlphaHandler}
        />
      </div>
      <div className="centered-setting-container">
        <label style={{ width: "400px" }}>
          {`background transparency: ${Math.round(overlayAlphaBack * 100)}%`}
        </label>
        <Slider
          key={`${current}-overlay-alpha-back-slider`}
          min={0}
          max={1}
          step={0.05}
          value={overlayAlphaBack}
          onChange={overlayAlphaBackHandler}
        />
      </div>
      <div className="settings-note" style={{ textAlign: "center" }}>
        Position: [{settings.bounds.x},{settings.bounds.y}]
      </div>
      <div className="settings-note" style={{ textAlign: "center" }}>
        <Button
          text="Reset Position"
          onClick={(): void =>
            saveOverlaySettings(current, {
              bounds: defaultConfig.overlays[current].bounds,
            })
          }
        />
      </div>
    </>
  ) : (
    <></>
  );
}

function setOverview(checked: boolean): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { overlayOverview: checked },
  });
}

function setHoverCards(checked: boolean): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { overlayHover: checked },
  });
}

function setHoverPos(pos: number): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { hoverPosition: pos },
  });
}

function setOverlaysTransparency(checked: boolean): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { overlaysTransparency: checked },
  });
}

// function setOverlaysResizable(checked: boolean): void {
//   reduxAction(store.dispatch, {
//     type: "SET_SETTINGS",
//     arg: { overlayResizable: checked },
//   });
// }

// function setOverlaysSkipTaskbar(checked: boolean): void {
//   reduxAction(store.dispatch, {
//     type: "SET_SETTINGS",
//     arg: { overlaySkipTaskbar: checked },
//   });
// }

function setOverlaysFrame(checked: boolean): void {
  reduxAction(store.dispatch, {
    type: "SET_SETTINGS",
    arg: { overlayFrame: checked },
  });
}

// function setOverlaysAcceptFirstMouse(checked: boolean): void {
//   reduxAction(store.dispatch, {
//     type: "SET_SETTINGS",
//     arg: { overlayAcceptFirstMouse: checked },
//   });
// }

export default function OverlaySettingsPanel() {
  const dispatch = useDispatch();
  const settings = useSelector((state: AppState) => state.settings);
  const currentOverlay = settings.settingsOverlaySection;
  const [currentOverlaySettings, setCurrentOverlaySettings] = useState(
    settings.overlays[currentOverlay]
  );

  const containerRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  const setCurrentOverlay = useCallback(
    (overlay: number) => {
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { settingsOverlaySection: overlay },
      });
    },
    [dispatch]
  );

  const [pickerColor, pickerDoShow, pickerElement] = useColorPicker(
    settings.overlayBackColor,
    undefined,
    backgroundColorPicker
  );

  useEffect(() => {
    const oSettings = settings.overlays.filter(
      (_s: any, i: number) => i == currentOverlay
    )[0];
    setCurrentOverlaySettings(oSettings);
  }, [currentOverlay, settings.overlays]);

  useEffect(vodiFn, [currentOverlaySettings]);

  const hPos = settings.hoverPosition;

  return (
    <>
      <label className="centered-setting-container">
        <span>
          Background color <i>(0,0,0,0 to use default background)</i>:
        </span>
        <input
          onClick={pickerDoShow}
          ref={containerRef}
          style={{ backgroundColor: pickerColor }}
          className="color-picker"
          id="flat"
          type="text"
          defaultValue=""
        />
      </label>
      {pickerElement}

      <Toggle
        text="Show post-match overview"
        value={settings.overlayOverview}
        callback={setOverview}
      />

      <Toggle
        text="Show hover cards overlay"
        value={settings.overlayHover}
        callback={setHoverCards}
      />

      <div
        className="settings-note"
        style={{ margin: "16px auto", width: "fit-content" }}
      >
        Select where the hover cards should appear in the screen.
      </div>

      <div className="hover-position-selector">
        <div
          className={`hover-pos p0 ${hPos === 0 ? "active" : ""}`}
          onClick={() => setHoverPos(0)}
        />
        <div
          className={`hover-pos p1 ${hPos === 1 ? "active" : ""}`}
          onClick={() => setHoverPos(1)}
        />
        <div
          className={`hover-pos p2 ${hPos === 2 ? "active" : ""}`}
          onClick={() => setHoverPos(2)}
        />
        <div
          className={`hover-pos p3 ${hPos === 3 ? "active" : ""}`}
          onClick={() => setHoverPos(3)}
        />
        <div
          className={`hover-pos p4 ${hPos === 4 ? "active" : ""}`}
          onClick={() => setHoverPos(4)}
        />
        <div
          className={`hover-pos p5 ${hPos === 5 ? "active" : ""}`}
          onClick={() => setHoverPos(5)}
        />
        <div
          className={`hover-pos p6 ${hPos === 6 ? "active" : ""}`}
          onClick={() => setHoverPos(6)}
        />
        <div
          className={`hover-pos p7 ${hPos === 7 ? "active" : ""}`}
          onClick={() => setHoverPos(7)}
        />
        <div
          className={`hover-pos p8 ${hPos === 8 ? "active" : ""}`}
          onClick={() => setHoverPos(8)}
        />
      </div>

      <Toggle
        text="Use transparency effect for overlays"
        value={settings.overlaysTransparency}
        callback={setOverlaysTransparency}
      />

      {/* <Toggle
        text="Resizable overlays"
        value={settings.overlayResizable}
        callback={setOverlaysResizable}
      />

      <Toggle
        text="Skip overlays on taskbar"
        value={settings.overlaySkipTaskbar}
        callback={setOverlaysSkipTaskbar}
      /> */}

      <Toggle
        text="Show frame on overlays"
        value={settings.overlayFrame}
        callback={setOverlaysFrame}
      />

      {/* <Toggle
        text="Accept first mouse click on overlays"
        value={settings.overlayAcceptFirstMouse}
        callback={setOverlaysAcceptFirstMouse}
      /> */}

      <div
        className="settings-note"
        style={{ margin: "24px auto 0px auto", width: "fit-content" }}
      >
        You can enable up to 5 independent overlay windows. Customize each
        overlay using the settings below.
      </div>

      <OverlaysTopNav current={currentOverlay} setCurrent={setCurrentOverlay} />
      <div className="overlay-section">
        {settings.overlays.map((_settings: any, index: number) => {
          return (
            <OverlaySettingsSection
              show={index == currentOverlay}
              // eslint-disable-next-line react/no-array-index-key
              key={`overlay-settings-section-${index}`}
              current={index}
              settings={_settings}
            />
          );
        })}
      </div>
    </>
  );
}
