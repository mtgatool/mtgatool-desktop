import _ from "lodash";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import reduxAction from "../../../redux/reduxAction";
import store from "../../../redux/stores/rendererStore";

import { DbMatch } from "../../../types/dbTypes";
import { loadDbFromCache } from "../../../utils/database-wrapper";
import getLocalSetting from "../../../utils/getLocalSetting";
import dataMigration from "../../../utils/migration/dataMigration";
import setLocalSetting from "../../../utils/setLocalSetting";

import vodiFn from "../../../utils/voidfn";
import Button from "../../ui/Button";
import Select from "../../ui/Select";

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
  const dbInputRef = useRef<HTMLInputElement>(null);
  const [dbFilePath, setDbFilePath] = useState<string | undefined>(undefined);
  const dbFileRef = useRef<Blob | null>(null);
  const [toMigrate, setToMigrate] = useState<DbMatch[]>([]);
  const [totalToMigrate, setTotalToMigrate] = useState(0);

  const [dbLang, setDbLang] = useState<string>(getLocalSetting("lang") || "en");

  const doDataMigration = useCallback(() => {
    if (dbFileRef.current) {
      const FR = new FileReader();

      FR.addEventListener("load", (ev: any) => {
        dataMigration(ev.target.result).then((data) => {
          setTotalToMigrate(data.length);
          setToMigrate(data);

          const migrateIds = data.map((m) => m.matchId);
          reduxAction(dispatch, {
            type: "SET_MATCHES_INDEX",
            arg: migrateIds,
          });

          window.toolDb.putData<string[]>(
            "matchesIndex",
            store.getState().mainData.matchesIndex,
            true
          );
        });
      });

      FR.readAsText(dbFileRef.current);
    }
  }, [dbFileRef]);

  useEffect(() => {
    if (dbInputRef.current) {
      dbInputRef.current.addEventListener("change", (e: any) => {
        if (e && e.target && e.target.files && e.target.files[0]) {
          setDbFilePath(e.target.files[0].path);
          [dbFileRef.current] = e.target.files;
        }
      });
    }
  }, [dbInputRef]);

  useEffect(() => {
    if (toMigrate.length !== 0) {
      const match = toMigrate[0];

      window.toolDb
        .putData<DbMatch>(`matches-${match.matchId}`, match, true)
        .finally(() => setToMigrate(toMigrate.slice(1)));
    }
  }, [toMigrate]);

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
      <div>
        <p>
          Select a .db to migrate data from a previous MTG Arena Tool version.
        </p>
        <p>This will only migrate matches history.</p>
      </div>
      <div className="centered-setting-container">
        <p>{dbFilePath || "No file selected"}</p>
        <label htmlFor="dbInput" style={{ margin: "0" }}>
          <Button text="Select .db file" onClick={vodiFn} />
          <input
            style={{ display: "none" }}
            ref={dbInputRef}
            id="dbInput"
            type="file"
          />
        </label>
      </div>

      <div style={{ textAlign: "center", height: "48px" }}>
        {totalToMigrate > 0 && toMigrate.length > 0 && (
          <>
            <p>
              Restoring data ({totalToMigrate - toMigrate.length}/
              {totalToMigrate})
            </p>
            <b className="red" style={{ lineHeight: "28px" }}>
              Do not close this dialog!
            </b>
          </>
        )}
      </div>

      <Button
        style={{ margin: "16px auto 32px auto" }}
        text="Begin migration"
        className="button-simple"
        onClick={doDataMigration}
      />
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
    </>
  );
}
