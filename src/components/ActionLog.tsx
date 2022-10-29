/* eslint-disable react/no-array-index-key */
/* eslint-disable radix */

import { database } from "mtgatool-shared";
import { Fragment } from "react";
import useHoverCard from "../hooks/useHoverCard";

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

function LogCard(props: LogCardProps): JSX.Element {
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

function LogAbility(props: LogAbilityProps): JSX.Element {
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
  logStr: string;
}

interface LogLine {
  seat: number;
  time: string;
  groups: RegExpMatchArray[];
  strings: string[];
}

export default function ActionLog(props: ActionLogProps): JSX.Element {
  const { logStr } = props;
  const actionLog = logStr.split("\n");

  const logP = ["log-player0", "log-player1", "log-player2"];

  const elements: LogLine[] = [];
  for (let line = 1; line < actionLog.length - 1; line += 3) {
    const seat = `${actionLog[line]}`.trim();
    const time = actionLog[line + 1];
    const str = actionLog[line + 2];

    const regex = new RegExp(
      /<log-(card|ability) id="(?<id>.*?)">.*?<\/log-(card|ability)>/,
      "g"
    );

    const groups = [...str.matchAll(regex)];
    const list = str.replace(regex, "\n").split("\n");

    const newObj: LogLine = {
      seat: parseInt(seat),
      time: time,
      groups: groups,
      strings: list,
    };

    elements.push(newObj);
  }

  return (
    <>
      {elements.map((line, i) => {
        return (
          <div key={i} className={`${"actionlog"} ${logP[line.seat]}`}>
            <div key={`log-time-${i + 1}`} className="actionlog-time">
              {line.time}
            </div>
            <div key={`log-test-${i}${2}`} className="actionlog-text">
              {line.strings.map((str, ii) => {
                if (line.groups.length == ii && str !== "") {
                  return <LogText key={`${i}text${ii}`}>{str}</LogText>;
                }
                if (line.groups[ii][1] == "card") {
                  return (
                    <LogCard
                      key={`${i}card${ii}`}
                      grpId={parseInt(line.groups[ii][2])}
                    >
                      {str}
                    </LogCard>
                  );
                }
                if (line.groups[ii][1] == "ability") {
                  return (
                    <LogAbility
                      key={`${i}ability${ii}`}
                      abId={parseInt(line.groups[ii][2])}
                    >
                      {str}
                    </LogAbility>
                  );
                }
                return <Fragment key={`log-fragment-${i + 1}`} />;
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
