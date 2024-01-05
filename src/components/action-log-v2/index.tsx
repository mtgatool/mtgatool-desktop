/* eslint-disable react/no-array-index-key */
/* eslint-disable radix */

import { database } from "mtgatool-shared";
import { Fragment } from "react";

import useHoverCard from "../../hooks/useHoverCard";
import { ActionLogV2 } from "./types";

interface LogTextProps {
  children: string;
}

function LogText(props: LogTextProps): JSX.Element {
  const { children } = props;
  return <div className="log-text">{children}</div>;
}

interface LogCardProps {
  children: string;
  grpId: number;
}

function _LogCard(props: LogCardProps): JSX.Element {
  const { children, grpId } = props;
  const cardObj = database.card(grpId);
  const cardName = cardObj?.Name;

  const [hoverIn, hoverOut] = useHoverCard(grpId);

  return (
    <>
      {children !== "" ? <LogText>{children}</LogText> : <></>}
      <div onMouseEnter={hoverIn} onMouseLeave={hoverOut} className="log-card">
        {cardName}
      </div>
    </>
  );
}

interface LogAbilityProps {
  children: string;
  abId: number;
}

function _LogAbility(props: LogAbilityProps): JSX.Element {
  const { children, abId } = props;
  const desc = database.ability(abId);

  return (
    <>
      {children !== "" ? <LogText>{children}</LogText> : <></>}
      <div title={desc} className="log-ability">
        ability
      </div>
    </>
  );
}

interface ActionLogProps {
  actionLog: ActionLogV2;
}

export default function ActionLog(props: ActionLogProps): JSX.Element {
  const { actionLog } = props;

  return (
    <>
      {actionLog.lines.map((line, i) => {
        return (
          <div key={i} className={`${"actionlog"}`}>
            {JSON.stringify(line)}
          </div>
        );
      })}
    </>
  );
}
