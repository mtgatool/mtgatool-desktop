import { v4cardsList } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

export interface Course {
  CourseId: string;
  InternalEventName: string;
  CurrentModule: number;
  ModulePayload: string;
  CourseDeckSummary: {
    DeckId: string;
    Name?: string;
    Description?: string;
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
    MainDeck: v4cardsList;
    ReducedSideboard: v4cardsList;
    Sideboard: v4cardsList;
    CommandZone: v4cardsList;
    Companions: v4cardsList;
    CardSkins: v4cardsList;
  };
  CardPool?: number[];
  JumpStart?: {
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
  CurrentWins?: number;
  CurrentLosses?: number;
}

interface CoursesEvent {
  Courses: Course[];
}

interface Entry extends LogEntry {
  json: CoursesEvent;
}

export default function InEventGetCourses(entry: Entry): void {
  const { json } = entry;

  json.Courses.forEach((course) => {
    globalStore.currentCourses[course.InternalEventName] = course;
  });
}
