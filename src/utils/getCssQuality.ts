import getLocalSetting from "./getLocalSetting";

export type CSSQuality = "high" | "web";

export default function getCssQuality(): CSSQuality {
  return getLocalSetting("css") === "high" ? "high" : "web";
}
