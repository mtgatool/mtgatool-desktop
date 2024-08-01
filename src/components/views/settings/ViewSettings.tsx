/* eslint-disable react/jsx-props-no-spreading */
import { Fragment, useState } from "react";

import { ReactComponent as Close } from "../../../assets/images/svg/close.svg";
import isElectron from "../../../utils/electron/isElectron";
import AboutSettingsPanel from "./AboutSettingsPanel";
import AccountSettingsPanel from "./AccountSettingsPanel";
import DataSettingsPanel from "./DataSettingsPanel";
import LogsSettingsPanel from "./LogsSettingsPanel";
import NetworkSettingsPanel from "./NetworkSettingsPanel";
import OverlaySettingsPanel from "./OverlaySettingsPanel";
import ShortcutsSettingsPanel from "./ShortcutsSettingsPanel";
import VisualSettingsPanel from "./VisualSettingsPanel";

const SETTINGS_LOGS = 10;
const SETTINGS_DATA = 11;
const SETTINGS_OVERLAY = 12;
const SETTINGS_VISUAL = 13;
const SETTINGS_SHORTCUTS = 14;
const SETTINGS_NETWORK = 15;
const SETTINGS_ABOUT = 16;
const SETTINGS_ACCOUNT = 17;

export interface SettingsPanelProps {
  doClose: () => void;
}

interface SettingsNavProps {
  // eslint-disable-next-line react/no-unused-prop-types
  component: ((props: SettingsPanelProps) => JSX.Element) | typeof Fragment;
  id: number;
  title: string;
  currentTab: number;
  callback: (id: number) => void;
}

function SettingsNav(props: SettingsNavProps): JSX.Element {
  const { id, title, currentTab, callback } = props;
  const click = (): void => {
    callback(id);
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
  const [currentTab, setCurrentTab] = useState(SETTINGS_ACCOUNT);

  const defaultTab = {
    currentTab: currentTab,
    callback: setCurrentTab,
  };

  const tabs: SettingsNavProps[] = [];
  tabs[SETTINGS_LOGS] = {
    ...defaultTab,
    id: SETTINGS_LOGS,
    component: LogsSettingsPanel,
    title: "Logs",
  };
  tabs[SETTINGS_DATA] = {
    ...defaultTab,
    id: SETTINGS_DATA,
    component: DataSettingsPanel, // SectionData,
    title: "Data",
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
  tabs[SETTINGS_NETWORK] = {
    ...defaultTab,
    id: SETTINGS_NETWORK,
    component: NetworkSettingsPanel,
    title: "Network",
  };
  tabs[SETTINGS_ABOUT] = {
    ...defaultTab,
    id: SETTINGS_ABOUT,
    component: AboutSettingsPanel, // SectionAbout,
    title: "About",
  };

  tabs[SETTINGS_ACCOUNT] = {
    ...defaultTab,
    id: SETTINGS_ACCOUNT,
    component: AccountSettingsPanel,
    title: "My Account",
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
            <SettingsNav {...tabs[SETTINGS_ACCOUNT]} />
            {isElectron() && <SettingsNav {...tabs[SETTINGS_LOGS]} />}
            <SettingsNav {...tabs[SETTINGS_DATA]} />
            {isElectron() && <SettingsNav {...tabs[SETTINGS_OVERLAY]} />}
            <SettingsNav {...tabs[SETTINGS_VISUAL]} />
            {isElectron() && <SettingsNav {...tabs[SETTINGS_SHORTCUTS]} />}
            <SettingsNav {...tabs[SETTINGS_NETWORK]} />
            <SettingsNav {...tabs[SETTINGS_ABOUT]} />
          </div>
        </div>
        <div className="settings-right">
          <div className="settings-page">
            <div className="settings-title">{tabs[currentTab].title}</div>
            <CurrentSettings doClose={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}
