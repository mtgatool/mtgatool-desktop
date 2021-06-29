/* eslint-disable react/jsx-props-no-spreading */
import { Fragment, useState } from "react";
import { ReactComponent as Close } from "../../../assets/images/svg/close.svg";
import isElectron from "../../../utils/electron/isElectron";
import AboutSettingsPanel from "./AboutSettingsPanel";
import OverlaySettingsPanel from "./OverlaySettingsPanel";
import VisualSettingsPanel from "./VisualSettingsPanel";
import ShortcutsSettingsPanel from "./ShortcutsSettingsPanel";

const SETTINGS_BEHAVIOUR = 10;
const SETTINGS_ARENA_DATA = 11;
const SETTINGS_OVERLAY = 12;
const SETTINGS_VISUAL = 13;
const SETTINGS_SHORTCUTS = 14;
const SETTINGS_PRIVACY = 15;
const SETTINGS_ABOUT = 16;

interface SettingsNavProps {
  // eslint-disable-next-line react/no-unused-prop-types
  component: (() => JSX.Element) | typeof Fragment;
  id: number;
  title: string;
  currentTab: number;
  callback: (id: number) => void;
}

function SettingsNav(props: SettingsNavProps): JSX.Element {
  const { id, title, currentTab, callback } = props;
  const click = (): void => {
    callback(props.id);
  };

  return (
    <div
      className={`${"settings-nav"} ${currentTab == id ? "nav-selected" : ""}`}
      onClick={click}
    >
      {title}
    </div>
  );
}

interface ViewSettingsProps {
  onClose: () => void;
}

export default function ViewSettings(props: ViewSettingsProps) {
  const { onClose } = props;
  const [currentTab, setCurrentTab] = useState(SETTINGS_BEHAVIOUR);

  const defaultTab = {
    currentTab: currentTab,
    callback: setCurrentTab,
  };

  const tabs: SettingsNavProps[] = [];
  tabs[SETTINGS_BEHAVIOUR] = {
    ...defaultTab,
    id: SETTINGS_BEHAVIOUR,
    component: Fragment, // SectionBehaviour,
    title: "Behaviour",
  };
  tabs[SETTINGS_ARENA_DATA] = {
    ...defaultTab,
    id: SETTINGS_ARENA_DATA,
    component: Fragment, // SectionData,
    title: "Arena Data",
  };
  tabs[SETTINGS_OVERLAY] = {
    ...defaultTab,
    id: SETTINGS_OVERLAY,
    component: OverlaySettingsPanel, // SectionOverlay,
    title: "Overlays",
  };
  tabs[SETTINGS_VISUAL] = {
    ...defaultTab,
    id: SETTINGS_VISUAL,
    component: VisualSettingsPanel, // SectionVisual,
    title: "Visual",
  };
  tabs[SETTINGS_SHORTCUTS] = {
    ...defaultTab,
    id: SETTINGS_SHORTCUTS,
    component: ShortcutsSettingsPanel, // SectionShortcuts,
    title: "Shortcuts",
  };
  tabs[SETTINGS_PRIVACY] = {
    ...defaultTab,
    id: SETTINGS_PRIVACY,
    component: Fragment, // SectionPrivacy,
    title: "Privacy",
  };
  tabs[SETTINGS_ABOUT] = {
    ...defaultTab,
    id: SETTINGS_ABOUT,
    component: AboutSettingsPanel, // SectionAbout,
    title: "About",
  };

  const CurrentSettings = tabs[currentTab].component;

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="settings-view">
        <div className="settings-left">
          <div
            style={{ marginTop: "16px", marginLeft: "auto", maxWidth: "200px" }}
          >
            {isElectron() && <SettingsNav {...tabs[SETTINGS_BEHAVIOUR]} />}
            <SettingsNav {...tabs[SETTINGS_ARENA_DATA]} />
            {isElectron() && <SettingsNav {...tabs[SETTINGS_OVERLAY]} />}
            <SettingsNav {...tabs[SETTINGS_VISUAL]} />
            <SettingsNav {...tabs[SETTINGS_SHORTCUTS]} />
            <SettingsNav {...tabs[SETTINGS_PRIVACY]} />
            <SettingsNav {...tabs[SETTINGS_ABOUT]} />
          </div>
        </div>
        <div className="settings-right">
          <div className="settings-page">
            <div className="settings-title">{tabs[currentTab].title}</div>
            <CurrentSettings />
          </div>
        </div>
      </div>
    </>
  );
}
