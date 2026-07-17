import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import reduxAction from "../../../redux/reduxAction";
import { loadDbFromCache } from "../../../utils/database-wrapper";
import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import Select from "../../ui/Select";
import Toggle from "../../ui/Toggle";

const SCRYFALL_LANGS = [
  "en",
  "de",
  "es",
  "fr",
  "it",
  "ru",
  "pt",
  "ja",
  "zhs",
  "ko",
];

function getLanguageName(lang: string): string {
  switch (lang) {
    case "en":
      return "English";
    case "es":
      return "Spanish";
    case "pt":
      return "Portuguese";
    case "de":
      return "Deutsch";
    case "fr":
      return "French";
    case "it":
      return "Italian";
    case "ja":
      return "Japanese";
    case "ru":
      return "Russian";
    case "ko":
      return "Korean";
    case "zhs":
      return "Chinese (simplified)";
    default:
      return "-";
  }
}

export default function DataSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();

  const [dbLang, setDbLang] = useState<string>(getLocalSetting("lang") || "en");
  const [importHistory, setImportHistory] = useState(
    getLocalSetting("importLogHistory") === "true"
  );

  const setCardsLanguage = useCallback(
    (lang: string) => {
      setDbLang(lang);
      setLocalSetting("lang", lang);
      loadDbFromCache(getLocalSetting("lang")).then(() => {
        reduxAction(dispatch, { type: "FORCE_COLLECTION", arg: undefined });
      });
    },
    [dispatch]
  );

  return (
    <>
      <div className="centered-setting-container">
        <label>Cards Data</label>
        <Select
          options={SCRYFALL_LANGS}
          current={dbLang}
          optionFormatter={getLanguageName}
          callback={setCardsLanguage}
        />
      </div>
      <div className="settings-note">
        <i>
          <p>
            Changes the cards data language, <b>not the interface</b>.
          </p>
          <p>Card names when exporting will also be changed.</p>
        </i>
      </div>

      <div className="centered-setting-container">
        <Toggle
          text="Import full match history from log on startup"
          value={importHistory}
          callback={(val: boolean): void => {
            setLocalSetting("importLogHistory", val ? "true" : "false");
            setImportHistory(val);
          }}
        />
      </div>
      <div className="settings-note">
        <i>
          <p>
            By default only new matches are read live. Enable this to replay
            your entire Player.log on the next startup — slower, and older
            matches have no rank data. Takes effect after a restart.
          </p>
        </i>
      </div>
    </>
  );
}
