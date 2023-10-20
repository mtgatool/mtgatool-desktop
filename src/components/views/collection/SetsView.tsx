import { database } from "mtgatool-shared";
import { useSelector } from "react-redux";

import notFound from "../../../assets/images/notfound.png";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import Flex from "../../Flex";
import Section from "../../ui/Section";
import { CollectionStats } from "./collectionStats";
import CollectionStatsPanel from "./CollectionStatsPanel";
import CompletionHeatMap from "./CompletionHeatMap";
import SetCompletionStats from "./SetCompletionStats";

interface SetsViewProps {
  stats: CollectionStats;
  filters: Filters<CardsData>;
  setQuery: (query: string) => void;
}

export default function SetsView(props: SetsViewProps): JSX.Element {
  const { stats, filters, setQuery } = props;

  const {
    futureBoosters,
    rareDraftFactor,
    mythicDraftFactor,
    boosterWinFactor,
  } = useSelector((state: AppState) => state.collection);

  const setsFiltered: string[] = [];
  filters.forEach((f) => {
    if (f.type === "array" && f.id === "setCode") {
      f.value.arr.forEach((setCode) => setsFiltered.push(setCode));
    }
  });

  const firstSet = setsFiltered.sort()[0] ?? "";

  const setsSelectedNum = setsFiltered.length;

  const currentSetName = Object.keys(database.sets).filter(
    (s) => database.sets[s].arenacode.toLowerCase() == firstSet
  )[0];

  const iconSvg =
    database.sets[currentSetName]?.svg ?? database.metadata?.sets[""].svg;

  const setIcon = iconSvg
    ? `url(data:image/svg+xml;base64,${iconSvg})`
    : `url(${notFound})`;

  return (
    <div className="sets-view-grid">
      <Section showIf={setsSelectedNum > 1} style={{ gridArea: "set" }}>
        <div className="message">
          Select only one set to see per-set statistics
        </div>
      </Section>

      <Section
        showIf={stats[firstSet] && setsSelectedNum === 1}
        style={{
          flexDirection: "column",
          gridArea: "set",
          padding: "16px",
        }}
      >
        <Flex style={{ margin: "0 auto", lineHeight: "24px" }}>
          <div
            className="stats-set-icon"
            style={{ backgroundImage: setIcon }}
          />
          <div>{currentSetName}</div>
        </Flex>
        {database.sets[currentSetName]?.collation !== -1 ? (
          <SetCompletionStats
            setStats={stats[firstSet]}
            boosterMath
            rareDraftFactor={rareDraftFactor}
            mythicDraftFactor={mythicDraftFactor}
            boosterWinFactor={boosterWinFactor}
            futureBoosters={futureBoosters}
          />
        ) : (
          <div className="message">This set is not available for draft</div>
        )}
      </Section>

      <Section
        showIf={stats[firstSet] && setsSelectedNum === 1}
        style={{
          flexDirection: "column",
          gridArea: "chart",
          padding: "16px",
        }}
      >
        <CompletionHeatMap key={firstSet} cardData={stats[firstSet]?.cards} />
      </Section>

      <Section showIf={setsSelectedNum == 0} style={{ gridArea: "set" }}>
        <div className="message">Select a set to see detailed statistics.</div>
      </Section>

      <Section
        style={{ flexDirection: "column", gridArea: "stats", padding: "16px" }}
      >
        <CollectionStatsPanel
          setQuery={setQuery}
          stats={stats}
          boosterMath
          clickCompletionCallback={(): void => {
            //
          }}
          defaultFilters={filters}
        />
      </Section>
    </div>
  );
}
