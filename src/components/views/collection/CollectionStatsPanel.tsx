/* eslint-disable prefer-destructuring */
import { constants } from "mtgatool-shared";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { InBoolFilter } from "../../../types/filterTypes";
import { Filters } from "../../../types/genericFilterTypes";
import formatNumber from "../../../utils/formatNumber";
import openExternal from "../../../utils/openExternal";
import Flex from "../../Flex";
import InputContainer from "../../InputContainer";
import RaritySymbol from "../../RaritySymbol";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import { removeFilterFromQuery } from "./collectionQuery";
import {
  ALL_CARDS,
  CollectionStats,
  FULL_SETS,
  SINGLETONS,
} from "./collectionStats";
import CompletionProgressBar from "./CompletionProgressBar";
import SetCompletionBar from "./SetCompletionBar";

const { CARD_RARITIES } = constants;

const getRarityKey = (
  rarity: string
): "rare" | "common" | "uncommon" | "mythic" | undefined => {
  const rarityCode = rarity.toLowerCase();
  if (["rare", "common", "uncommon", "mythic"].includes(rarityCode))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rarityCode as any;
  return undefined;
};

const inBoostersMode = ["All Cards", "In boosters", "Not in boosters"];

export default function CollectionStatsPanel({
  stats,
  boosterMath,
  clickCompletionCallback,
  setQuery,
  defaultFilters,
}: {
  stats?: CollectionStats;
  boosterMath: boolean;
  clickCompletionCallback: () => void;
  setQuery: (query: string) => void;
  defaultFilters: Filters<CardsData>;
}): JSX.Element {
  const {
    countMode,
    rareDraftFactor,
    mythicDraftFactor,
    boosterWinFactor,
    futureBoosters,
  } = useSelector((state: AppState) => state.collection);
  const dispatch = useDispatch();

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const userData = uuidData[currentUUID];

  const query = useSelector(
    (state: AppState) => state.renderer.collectionQuery
  );

  let boostersMode = inBoostersMode[0];

  defaultFilters.forEach((f: any) => {
    if (f.id == "boosters") {
      const filter: InBoolFilter = f.value;
      if (filter.not == false) boostersMode = inBoostersMode[1];
      if (filter.not == true) boostersMode = inBoostersMode[0];
    }
  });

  const setBoostersCallback = useCallback(
    // Update old query with new set, removing all other sets from it
    (boosters: boolean | undefined) => {
      let newQuery = removeFilterFromQuery(query, ["in"]);
      if (boosters !== undefined) {
        newQuery += ` ${boosters ? "" : "-"}in:boosters`;
      }
      setQuery(newQuery);
    },
    [setQuery, query]
  );

  if (!stats) {
    return <></>;
  }
  const setStats = stats.complete;
  const wanted: { [key: string]: number } = {};
  const missing: { [key: string]: number } = {};
  const filteredRarities = CARD_RARITIES.filter((rarity) => {
    const key = getRarityKey(rarity);
    return !!key && setStats[key].total > 0;
  });
  filteredRarities.forEach((rarity) => {
    const key = getRarityKey(rarity);
    if (key) {
      const countStats = setStats[key];
      wanted[key] = countStats.wanted;
      missing[key] = countStats.total - countStats.owned;
    }
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          maxWidth: "400px",
          width: "-webkit-fill-available",
          margin: "0px auto 16px auto",
          justifyContent: "space-between",
        }}
      >
        <div className="economy-wc wc-common" />
        <div>{formatNumber(userData.inventory.WildCardCommons)}</div>
        <div className="economy-wc wc-uncommon" />
        <div>{formatNumber(userData.inventory.WildCardUnCommons)}</div>
        <div className="economy-wc wc-rare" />
        <div>{formatNumber(userData.inventory.WildCardRares)}</div>
        <div className="economy-wc wc-mythic" />
        <div>{formatNumber(userData.inventory.WildCardMythics)}</div>
      </div>
      <i
        style={{
          color: "var(--color-text-dark)",
          textAlign: "center",
          fontSize: "14px",
          marginBottom: "16px",
          padding: "0px 16px",
        }}
      >
        MTG Arena now displays set stats as &quot;In boosters&quot; and
        &quot;Singleton (at least one)&quot;.
      </i>
      <div style={{ textAlign: "center" }}>
        <Flex
          style={{
            display: "flex",
            margin: "8px auto 16px auto",
            lineHeight: "32px",
          }}
        >
          <div style={{ marginRight: "auto" }}>In Boosters:</div>
          <Select
            options={inBoostersMode}
            current={boostersMode}
            callback={(mode: string): void => {
              if (mode == inBoostersMode[1]) {
                setBoostersCallback(true);
              } else if (mode == inBoostersMode[2]) {
                setBoostersCallback(false);
              } else {
                setBoostersCallback(undefined);
              }
            }}
          />
        </Flex>
        <Flex
          style={{
            display: "flex",
            margin: "8px auto 16px auto",
            lineHeight: "32px",
          }}
        >
          <div style={{ marginRight: "auto" }}>Count:</div>
          <Select
            options={[ALL_CARDS, SINGLETONS, FULL_SETS]}
            current={countMode}
            callback={(mode: string): void => {
              reduxAction(dispatch, { type: "SET_COUNT_MODE", arg: mode });
            }}
          />
        </Flex>
        <SetCompletionBar
          countMode={countMode}
          setStats={setStats}
          setIconCode=""
          setName="Total cards filtered"
        />
        {filteredRarities.map((rarityCode) => {
          const rarity = getRarityKey(rarityCode);
          if (rarity) {
            const countStats = setStats[rarity];
            const capitalizedRarity = `${
              rarity[0].toUpperCase() + rarity.slice(1)
            }s`;
            const globalStyle = getComputedStyle(document.body);
            return (
              <CompletionProgressBar
                countMode={countMode}
                key={rarity}
                countStats={countStats}
                image={globalStyle.getPropertyValue(`--wc_${rarity}_png`)}
                title={capitalizedRarity}
              />
            );
          }
          return <></>;
        })}
        {boosterMath ? (
          <>
            <div
              style={{ width: "100%", marginTop: "16px" }}
              title="set completion estimator"
            >
              Completion by draft calculator*:
            </div>
            <Flex
              style={{
                lineHeight: "32px",
                justifyContent: "space-between",
                margin: "8px auto 0 auto",
                maxWidth: "600px",
              }}
            >
              <Flex>
                <RaritySymbol rarity="rare" />
                <div>Rares per draft:</div>
              </Flex>
              <InputContainer style={{ width: "60px" }}>
                <input
                  value={rareDraftFactor}
                  placeholder="3"
                  title="rare picks per draft"
                  type="number"
                  onChange={(ev): void => {
                    reduxAction(dispatch, {
                      type: "SET_RARE_DRAFT_FACTOR",
                      arg: parseFloat(ev.target.value),
                    });
                  }}
                />
              </InputContainer>
            </Flex>
            <Flex
              style={{
                lineHeight: "32px",
                justifyContent: "space-between",
                margin: "8px auto 0 auto",
                maxWidth: "600px",
              }}
            >
              <Flex>
                <RaritySymbol rarity="mythic" />
                <div>Mythics per draft:</div>
              </Flex>
              <InputContainer style={{ width: "60px" }}>
                <input
                  value={mythicDraftFactor}
                  placeholder="0.14"
                  title="mythic picks per draft"
                  type="number"
                  onChange={(ev): void => {
                    reduxAction(dispatch, {
                      type: "SET_MYTHIC_DRAFT_FACTOR",
                      arg: parseFloat(ev.target.value),
                    });
                  }}
                />
              </InputContainer>
            </Flex>
            <Flex
              style={{
                lineHeight: "32px",
                justifyContent: "space-between",
                margin: "8px auto 0 auto",
                maxWidth: "600px",
              }}
            >
              <Flex>
                <div className="bo-explore-cost" /> Boosters per draft:
              </Flex>
              <InputContainer style={{ width: "60px" }}>
                <input
                  value={boosterWinFactor}
                  placeholder="1.2"
                  title="prize boosters awarded per draft"
                  type="number"
                  onChange={(ev): void => {
                    reduxAction(dispatch, {
                      type: "SET_BOOSTER_WIN_FACTOR",
                      arg: parseFloat(ev.target.value),
                    });
                  }}
                />
              </InputContainer>
            </Flex>
            <Flex
              style={{
                lineHeight: "32px",
                justifyContent: "space-between",
                margin: "8px auto 0 auto",
                maxWidth: "600px",
              }}
            >
              <Flex>
                <div className="bo-explore-cost" /> Future boosters:
              </Flex>
              <InputContainer style={{ width: "60px" }}>
                <input
                  value={futureBoosters}
                  placeholder="0"
                  title="expected additional boosters, e.g. seasonal rewards"
                  type="number"
                  onChange={(ev): void => {
                    reduxAction(dispatch, {
                      type: "SET_FUTURE_BOOSTERS",
                      arg: parseFloat(ev.target.value),
                    });
                  }}
                />
              </InputContainer>
            </Flex>
            <div
              style={{
                marginTop: "16px",
                cursor: "pointer",
                textDecoration: "underline",
                color: "var(--color-text-link)",
              }}
              onClick={() =>
                openExternal(
                  "https://www.mtggoldfish.com/articles/collecting-mtg-arena-part-1-of-2"
                )
              }
            >
              * original by caliban on mtggoldfish
            </div>
          </>
        ) : (
          <Button onClick={clickCompletionCallback} text="Completion Stats" />
        )}
      </div>
    </>
  );
}
