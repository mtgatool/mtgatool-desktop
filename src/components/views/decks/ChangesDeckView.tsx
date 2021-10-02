/* eslint-disable react/no-array-index-key */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Section from "../../ui/Section";
import Button from "../../ui/Button";
import { StatsDeck } from "../../../types/dbTypes";
import { AppState } from "../../../redux/stores/rendererStore";

interface ChangesDeckViewProps {
  setRegularView: () => void;
}

export default function ChangesDeckView(
  props: ChangesDeckViewProps
): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setRegularView } = props;
  const [allDecksData, _setAllDecksData] = useState<StatsDeck[]>([]);
  const _params = useParams<{ page: string; id: string }>();
  const _fullStats = useSelector((state: AppState) => state.mainData.fullStats);

  useEffect(() => {
    //
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
          return <p key={`change${d?.id}-${d.deckHash}`}>{d.deckHash}</p>;
        })}
      </Section>
    </div>
  );
}
