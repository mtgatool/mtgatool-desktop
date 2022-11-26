import { database } from "mtgatool-shared";

import notFound from "../../../assets/images/notfound.png";
import CompletionProgressBar from "./CompletionProgressBar";
import SetStats from "./SetsStats";

export default function SetCompletionBar({
  countMode,
  setStats,
  setIconCode,
  setName,
}: {
  countMode: string;
  setStats: SetStats;
  setIconCode: string;
  setName: string;
}): JSX.Element {
  const iconSvg =
    database.sets[setIconCode]?.svg ?? database.metadata?.sets[""];
  const setIcon = iconSvg
    ? `url(data:image/svg+xml;base64,${iconSvg})`
    : `url(${notFound})`;
  return (
    <CompletionProgressBar
      countMode={countMode}
      countStats={setStats.all}
      image={setIcon}
      title={setName}
    />
  );
}
