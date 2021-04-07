import LogEntry from "../../types/logDecoder";

interface Reward {
  wins: number;
  awardDescription: {
    image1: string | null;
    image2: string | null;
    image3: string | null;
    prefab: string;
    referenceId: string | null;
    headerLocKey: string;
    descriptionLocKey: string | null;
    quantity: string | null;
    locParams: { number1?: number; number2?: number; number3?: number };
    availableDate: string;
  };
}

interface EntryJson {
  dailyReset: string;
  weeklyReset: string;
  dailyRewards: Reward[];
  weeklyRewards: Reward[];
}

interface Entry extends LogEntry {
  json: EntryJson;
}

export default function GetPlayerInventoryGetRewardSchedule(
  entry: Entry
): void {
  const _json = entry.json;
}
