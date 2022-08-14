import { Chances } from "mtgatool-shared";
import {
  BLACK,
  BLUE,
  GREEN,
  MANA_COLORS,
  RED,
  WHITE,
} from "mtgatool-shared/dist/shared/constants";
import { PieChart } from "react-minimal-pie-chart";
import manaClasses from "../../../common/manaClasses";

export default function LiveDeckLands(props: { cardOdds: Chances }) {
  const { cardOdds } = props;
  const { landW, landU, landB, landR, landG } = cardOdds;

  const manaChanceDiv = (value: number, color: number) => {
    return (
      <div className="mana-cont">
        {`${value}%`}
        <div className={`mana-s16 flex-end ${manaClasses[color]}`} />
      </div>
    );
  };

  const colorsPie = [
    { title: "White", value: landW, color: MANA_COLORS[0] },
    { title: "Blue", value: landU, color: MANA_COLORS[1] },
    { title: "Black", value: landB, color: MANA_COLORS[2] },
    { title: "Red", value: landR, color: MANA_COLORS[3] },
    { title: "Green", value: landG, color: MANA_COLORS[4] },
  ];

  return (
    <>
      <div className="type-icon type-lan lands-odds" />
      <div className="lands-div">
        {!!landW && manaChanceDiv(landW, WHITE)}
        {!!landU && manaChanceDiv(landU, BLUE)}
        {!!landB && manaChanceDiv(landB, BLACK)}
        {!!landR && manaChanceDiv(landR, RED)}
        {!!landG && manaChanceDiv(landG, GREEN)}
      </div>
      <div className="lands-pie-container">
        <PieChart data={colorsPie} />
      </div>
    </>
  );
}
