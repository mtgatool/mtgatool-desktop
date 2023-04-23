import { Chances, constants } from "mtgatool-shared";
import { useCallback } from "react";

const { CARD_TYPES } = constants;

interface SampleSizePanelProps {
  cardOdds: Chances;
  cardsLeft: number;
  setOddsCallback: (option: number) => void;
}

export default function SampleSizePanel(
  props: SampleSizePanelProps
): JSX.Element {
  const { cardOdds, cardsLeft, setOddsCallback } = props;
  const sampleSize = cardOdds.sampleSize || 1;

  const handleOddsPrev = useCallback((): void => {
    let newSampleSize = sampleSize - 1;
    if (newSampleSize < 1) {
      newSampleSize = cardsLeft - 1;
    }
    setOddsCallback(newSampleSize);
  }, [sampleSize, cardsLeft, setOddsCallback]);

  const handleOddsNext = useCallback((): void => {
    const left = cardOdds.cardsLeft || 60;
    let newSampleSize = sampleSize + 1;
    if (newSampleSize > left - 1) {
      newSampleSize = 1;
    }
    setOddsCallback(newSampleSize);
  }, [cardOdds.cardsLeft, sampleSize, setOddsCallback]);

  return (
    <div className="odds-container">
      <div className="overlay-samplesize-container">
        <div className="odds-prev click-on" onClick={handleOddsPrev} />
        <div className="odds-number">Sample size: {sampleSize}</div>
        <div
          className={`${"odds-next"} ${"click-on"}`}
          onClick={handleOddsNext}
        />
      </div>
      <div className="chance-title" />
      {CARD_TYPES.map((type) => {
        let value = 0;
        let field = "";
        switch (type) {
          case "Creatures":
            value = cardOdds.chanceCre / 100;
            field = "chanceCre";
            break;
          case "Lands":
            value = cardOdds.chanceLan / 100;
            field = "chanceLan";
            break;
          case "Instants":
            value = cardOdds.chanceIns / 100;
            field = "chanceIns";
            break;
          case "Sorceries":
            value = cardOdds.chanceSor / 100;
            field = "chanceSor";
            break;
          case "Enchantments":
            value = cardOdds.chanceEnc / 100;
            field = "chanceEnc";
            break;
          case "Artifacts":
            value = cardOdds.chanceArt / 100;
            field = "chanceArt";
            break;
          case "Planeswalkers":
            value = cardOdds.chancePla / 100;
            field = "chancePla";
            break;
          case "Battles":
            value = cardOdds.chancePla / 100;
            field = "chanceBat";
            break;
          default:
            break;
        }
        const display = value.toLocaleString([], {
          style: "percent",
          maximumSignificantDigits: 2,
        });
        return (
          <div className="chance-title" key={`chance_title_${field}`}>
            {type}: {display}
          </div>
        );
      })}
    </div>
  );
}
