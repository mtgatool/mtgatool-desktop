import { Format } from "mtgatool-shared/dist";
import formatsJson from "../assets/resources/formats.json";

const allFormats: Record<string, Format> = {};
formatsJson.Formats.forEach((format) => {
  allFormats[format.name] = format;
});

export default allFormats;
