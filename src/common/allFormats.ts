import formatsJson from "../assets/resources/formats.json";

export interface Format {
  name: string;
  sets: string[];
  bannedTitleIds: number[];
  suspendedTitleIds: number[];
  allowedTitleIds: number[];
  cardCountRestriction?: string;
}

const allFormats: Record<string, Format> = {};
formatsJson.Formats.forEach((format) => {
  allFormats[format.name] = format;
});

export default allFormats;
