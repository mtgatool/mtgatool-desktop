/**
 * Seed the card database from the bundled metadata JSON. Tests only.
 *
 * The app reads its cards from SQLite in a worker and never loads this JSON —
 * that was the whole point of the migration. The unit tests that assert things
 * about real card data still need real card data, though, and they run in jsdom
 * where the wasm engine is awkward to start, so they seed the client's cache
 * from the JSON fixture directly.
 *
 * Nothing outside `src/utils/__tests__` should import this: doing so would pull
 * the ~24MB JSON back into the app bundle.
 */
import cachedJson from "../assets/resources/database.json";
import cardsDb from "./cardsDb/cardsDbClient";

export default function testSeedDatabase(): void {
  cardsDb.seedForTests(cachedJson as unknown);
}
