import cachedJson from "../assets/resources/database.json";
import database from "./mtga/database";

export default function loadDbFromCache(): void {
  const json = cachedJson as unknown;
  database.setDatabaseUnsafely(json as any);
}
