import LineAbility from "./LineAbility";
import LineAttack from "./LineAttack";
import LineCast from "./LineCast";
import LineConceded from "./LineConceded";
import LineCountered from "./LineCountered";
import LineDamageDealt from "./LineDamageDealt";
import LineDestroyed from "./LineDestroyed";
import LineDiscard from "./LineDiscard";
import LineDraw from "./LineDraw";
import LineExile from "./LineExile";
import LineModifiedLife from "./LineModifiedLife";
import LinePlay from "./LinePlay";
import LineScry from "./LineScry";
import LineTarget from "./LineTarget";
import LineTimedOut from "./LineTimedOut";
import LineTurnInfo from "./LineTurnInfo";
import LineWin from "./LineWon";
import LineZonePut from "./LineZonePut";
import LineZoneReturn from "./LineZoneReturn";
import { ActionLogLineProps, ActionLogLineType, ActionLogV2 } from "./types";

const DefaultLineComponent = (_props: ActionLogLineProps): JSX.Element => {
  return <></>;
};

function getLineComponent(type: ActionLogLineType) {
  let lineComponent = DefaultLineComponent;

  switch (type) {
    case "WIN":
      lineComponent = LineWin;
      break;
    case "CONCEDED":
      lineComponent = LineConceded;
      break;
    case "TIMED_OUT":
      lineComponent = LineTimedOut;
      break;
    case "DRAW":
      lineComponent = LineDraw;
      break;
    case "SCRY":
      lineComponent = LineScry;
      break;
    case "CAST":
      lineComponent = LineCast;
      break;
    case "PLAY":
      lineComponent = LinePlay;
      break;
    case "DISCARD":
      lineComponent = LineDiscard;
      break;
    case "ZONE_PUT":
      lineComponent = LineZonePut;
      break;
    case "ZONE_RETURN":
      lineComponent = LineZoneReturn;
      break;
    case "COUNTERED":
      lineComponent = LineCountered;
      break;
    case "EXILE":
      lineComponent = LineExile;
      break;
    case "DESTROYED":
      lineComponent = LineDestroyed;
      break;
    case "TARGET":
      lineComponent = LineTarget;
      break;
    case "TURN_INFO":
      lineComponent = LineTurnInfo;
      break;
    case "ABILITY":
      lineComponent = LineAbility;
      break;
    case "MODIFIED_LIFE":
      lineComponent = LineModifiedLife;
      break;
    case "DAMAGE_DEALT":
      lineComponent = LineDamageDealt;
      break;
    case "ATTACK":
      lineComponent = LineAttack;
      break;
    default:
      break;
  }

  return lineComponent;
}

interface ActionLogProps {
  actionLog: ActionLogV2;
}

export default function ActionLog(props: ActionLogProps): JSX.Element {
  const { actionLog } = props;

  // const logLength = actionLog.lines.length;

  return (
    <div className="action-log-v2">
      {actionLog.lines.map((line, index) => {
        const LineComponent = getLineComponent(line.type);

        // const nextLine = actionLog.lines[i + 1];

        // if (
        //   line.type === "TURN_INFO" &&
        //   line.subType !== "BEGIN" &&
        //   logLength - 1 !== i &&
        //   nextLine.type === "TURN_INFO" &&
        //   nextLine.subType === line.subType
        // ) {
        //   return <></>;
        // }

        return (
          <LineComponent
            // eslint-disable-next-line react/no-array-index-key
            key={`log-line-${index}`}
            line={line}
            timeStart={actionLog.lines[1].timestamp}
            players={actionLog.players}
          />
        );
      })}
    </div>
  );
}
