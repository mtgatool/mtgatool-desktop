import { useSelector } from "react-redux";

import { database } from "mtgatool-shared";
import { CollectionStats } from "./collectionStats";
import CompletionHeatMap from "./CompletionHeatMap";

import notFound from "../../../assets/images/notfound.png";
import { AppState } from "../../../redux/stores/rendererStore";

import Section from "../../ui/Section";

import Flex from "../../Flex";
import SetCompletionStats from "./SetCompletionStats";
import CollectionStatsPanel from "./CollectionStatsPanel";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";

interface SetsViewProps {
  stats: CollectionStats;
  filterSets: string[];
  filters: Filters<CardsData>;
  setQuery: (query: string) => void;
}

export default function SetsView(props: SetsViewProps): JSX.Element {
  const { stats, filterSets, filters, setQuery } = props;

  const {
    futureBoosters,
    rareDraftFactor,
    mythicDraftFactor,
    boosterWinFactor,
  } = useSelector((state: AppState) => state.collection);

  // const currentSetData = database.sets[currentSetName];
  const currentSetName = Object.keys(database.sets).filter(
    (s) => database.sets[s].code.toLowerCase() == filterSets[0]
  )[0];

  const iconSvg =
    database.sets[currentSetName]?.svg ?? database.metadata?.sets[""].svg;

  const setIcon = iconSvg
    ? `url(data:image/svg+xml;base64,${iconSvg})`
    : `url(${notFound})`;

  return (
    <div className="sets-view-grid">
      {stats[currentSetName] ? (
        <>
          <Section
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
                setStats={stats[currentSetName]}
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
            style={{
              flexDirection: "column",
              gridArea: "chart",
              padding: "16px",
            }}
          >
            <CompletionHeatMap
              key={currentSetName}
              cardData={stats[currentSetName]?.cards}
            />
          </Section>
        </>
      ) : (
        <Section style={{ gridArea: "set" }}>
          <div className="message">Select a set to see detailed statistics</div>
        </Section>
      )}
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
