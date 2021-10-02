/* eslint-disable react/no-array-index-key */
import { useEffect, useState } from "react";
import Section from "../../ui/Section";
import Button from "../../ui/Button";
import { DbDeck } from "../../../types/dbTypes";

interface ChangesDeckViewProps {
  deck: DbDeck;
  setRegularView: () => void;
}

export default function ChangesDeckView(
  props: ChangesDeckViewProps
): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deck, setRegularView } = props;

  const [allDecksData, setAllDecksData] = useState<(DbDeck | null)[]>([]);

  useEffect(() => {
    const versions = deck.version;
    const promises = new Array(versions + 1).fill(true).map((_v, index) => {
      console.log(`request decks-${deck.id}-v${index}`);
      return window.toolDb.getData<DbDeck>(`decks-${deck.id}-v${index}`, true);
    });

    Promise.all(promises).then(setAllDecksData);
  }, []);

  return (
    <div className="changes-view-grid">
      <Section style={{ padding: "16px", gridArea: "controls" }}>
        <Button
          style={{ margin: "auto" }}
          text="Normal View"
          onClick={setRegularView}
        />
      </Section>
      <Section style={{ padding: "16px", gridArea: "deck" }}>
        <p>Text</p>
      </Section>
      <Section style={{ padding: "16px", gridArea: "changes" }}>
        <p>Changes</p>
        {allDecksData.map((d) => {
          return (
            <p key={`change${d?.id}-v-${d?.version}`}>
              {d ? d.version : "null"}
            </p>
          );
        })}
      </Section>
    </div>
  );
}
