import { constants, Chances } from "mtgatool-shared";

import manaClasses from "../common/manaClasses";

const { BLACK, BLUE, GREEN, RED, WHITE } = constants;

export default function GroupedLandsDetails(props: Chances): JSX.Element {
  const { landW, landU, landB, landR, landG } = props;

  const manaChanceDiv = (value: number, color: number) => {
    return (
      <div className="mana-cont">
        {`${value}%`}
        <div className={`mana-s16 flex-end ${manaClasses[color]}`} />
      </div>
    );
  };
  return (
    <div
      // style={{ width: `${100 - 34 + hoverCardSize * 15}px` }}
      className="lands-div"
    >
      {!!landW && manaChanceDiv(landW, WHITE)}
      {!!landU && manaChanceDiv(landU, BLUE)}
      {!!landB && manaChanceDiv(landB, BLACK)}
      {!!landR && manaChanceDiv(landR, RED)}
      {!!landG && manaChanceDiv(landG, GREEN)}
    </div>
  );
}
