import _ from "lodash";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import reduxAction from "../../../redux/reduxAction";
import store from "../../../redux/stores/rendererStore";

import { DbMatch } from "../../../types/dbTypes";
import dataMigration from "../../../utils/migration/dataMigration";

import vodiFn from "../../../utils/voidfn";
import Button from "../../ui/Button";

export default function DataSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();
  const dbInputRef = useRef<HTMLInputElement>(null);
  const [dbFilePath, setDbFilePath] = useState<string | undefined>(undefined);
  const dbFileRef = useRef<Blob | null>(null);
  const [toMigrate, setToMigrate] = useState<DbMatch[]>([]);
  const [totalToMigrate, setTotalToMigrate] = useState(0);

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
      {totalToMigrate > 0 && toMigrate.length > 0 && (
        <p>
          {totalToMigrate - toMigrate.length}/{totalToMigrate}
        </p>
      )}
      <Button
        style={{ margin: "128px auto 0 auto" }}
        text="Begin migration"
        className="button-simple"
        onClick={doDataMigration}
      />
    </>
  );
}
