import { useState, useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import Toggle from "../../ui/Toggle";
import Button from "../../ui/Button";
import EditKey from "../../popups/EditKey";
import electron from "../../../utils/electron/electronWrapper";
import registerShortcuts from "../../../utils/registerShortcuts";

const SHORTCUT_NAMES = {
  shortcutOverlay1: "Toggle Overlay 1",
  shortcutOverlay2: "Toggle Overlay 2",
  shortcutOverlay3: "Toggle Overlay 3",
  shortcutOverlay4: "Toggle Overlay 4",
  shortcutOverlay5: "Toggle Overlay 5",
  shortcutDevtoolsMain: "Toggle Developer Tools",
};

function ShortcutsRow({
  code,
  index,
}: {
  code: keyof typeof SHORTCUT_NAMES;
  index: number;
}): JSX.Element {
  const dispatch = useDispatch();
  const settings = useSelector((state: AppState) => state.settings);
  const [openDialog, setOpenDialog] = useState(false);
  const ld = index % 2 ? "line-dark" : "line-light";

  function openKeyCombinationDialog(): void {
    if (electron) {
      electron.remote.globalShortcut.unregisterAll();
    }
    setOpenDialog(true);
  }

  const closeKeyCombDialog = useCallback(
    (key: string): void => {
      setOpenDialog(false);
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { ...settings, [code]: key },
      });

      registerShortcuts(settings);
    },
    [code, dispatch, settings]
  );

  return (
    <>
      <div
        className={`${ld} shortcuts-line`}
        style={{ gridArea: `${index + 2} / 1 / auto / 2` }}
      >
        {SHORTCUT_NAMES[code]}
      </div>
      <div
        className={`${ld} shortcuts-line`}
        style={{ gridArea: `${index + 2} / 2 / auto / 3` }}
      >
        {(settings as unknown as Record<string, string>)[code]}
      </div>
      <div
        className={`${ld} shortcuts-line`}
        style={{ gridArea: `${index + 2} / 3 / auto / 4` }}
      >
        <Button
          text="Edit"
          className="button-simple button-edit"
          onClick={openKeyCombinationDialog}
        />
      </div>
      {openDialog ? <EditKey closeCallback={closeKeyCombDialog} /> : <></>}
    </>
  );
}

export default function ShortcutsSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();
  const enableKeyboardShortcuts = useSelector(
    (state: AppState) => state.settings.enableKeyboardShortcuts
  );

  const setKeyboardShortcuts = useCallback(
    (checked: boolean): void => {
      reduxAction(dispatch, {
        type: "SET_SETTINGS",
        arg: { enableKeyboardShortcuts: checked },
      });
    },
    [dispatch]
  );

  return (
    <>
      <Toggle
        text="Enable keyboard shortcuts"
        value={enableKeyboardShortcuts}
        callback={setKeyboardShortcuts}
      />
      <div className="settings-note" style={{ margin: "24px 16px 16px" }}>
        Click Edit to change a shortcut
      </div>
      <div className="shortcuts-grid">
        <div
          className={`${"line-dark"} ${"line-bottom-border"} ${"shortcuts-line"}`}
          style={{ gridArea: "1 / 0 / auto / 3" }}
        >
          Action
        </div>
        <div
          className={`${"line-dark"} ${"line-bottom-border"} ${"shortcuts-line"}`}
          style={{ gridArea: "1 / 2 / auto / 4" }}
        >
          Shortcut
        </div>
        {Object.keys(SHORTCUT_NAMES).map((key, index: number) => (
          <ShortcutsRow key={key} code={key as any} index={index} />
        ))}
      </div>
    </>
  );
}
