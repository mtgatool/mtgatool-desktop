import { useSelector } from "react-redux";

import notFound from "../../../assets/images/notfound.png";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import database from "../../../utils/mtga/database";
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

  // A set has two codes and they are not always the same one — Dominaria is
  // DOM on paper and DAR to Arena. The filter carries the paper code (that is
  // what the set icons set), while the collection stats are keyed by the Arena
  // one, so matching on either is what connects the two. Comparing only against
  // the Arena code left every mismatched set without a name, an icon or any
  // statistics at all.
  const currentSetName = Object.keys(database.sets).filter((s) => {
    const set = database.sets[s];
    return (
      set.arenacode.toLowerCase() === firstSet ||
      set.code.toLowerCase() === firstSet
    );
  })[0];

  // Stats are keyed by the Arena code; see getCollectionStats.
  const statsKey =
    database.sets[currentSetName]?.arenacode.toLowerCase() ?? firstSet;
  const setStats = stats[statsKey];

  const iconSvg = database.sets[currentSetName]?.svg ?? database.sets[""]?.svg;

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
        showIf={!!setStats && setsSelectedNum === 1}
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
            setStats={setStats}
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
        showIf={!!setStats && setsSelectedNum === 1}
        style={{
          flexDirection: "column",
          gridArea: "chart",
          padding: "16px",
        }}
      >
        <CompletionHeatMap key={firstSet} cardData={setStats?.cards} />
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
