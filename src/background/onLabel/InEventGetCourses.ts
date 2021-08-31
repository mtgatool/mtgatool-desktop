import { v2cardsList } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Course {
  CourseId: string;
  InternalEventName: string;
  CurrentModule: number;
  ModulePayload: string;
  CourseDeckSummary: {
    DeckId: string;
    Attributes: {
      name: string;
      value: string;
    }[];
    DeckTileId: number;
    FormatLegalities: Record<string, string>;
    DeckValidationSummaries: [];
    UnownedCards: Record<string, string>;
  };
  CourseDeck: {
    MainDeck: v2cardsList;
    ReducedSideboard: [];
    Sideboard: [];
    CommandZone: [];
    Companions: [];
    CardSkins: [];
  };
  CurrentLosses: number;
  CardPool: number[];
  JumpStart: {
    CurrentChoices: [];
    PacketsChosen: [
      {
        packetName: string;
        displayArtId: number;
        displayGrpId: number;
        colors: string[];
      }[]
    ];
  };
}

interface CoursesEvent {
  Courses: Course[];
}

interface Entry extends LogEntry {
  json: CoursesEvent;
}

export default function InEventGetCourses(entry: Entry): void {
  const _json = entry.json;
}
