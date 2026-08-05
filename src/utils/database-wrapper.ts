/**
 * Compatibility re-export of the card database.
 *
 * This module used to own the JSON pipeline: a static import of a ~24MB
 * `database.json` bundled into every window, a second copy parsed from a cache
 * file in userData, and a periodic download of the whole thing from GitHub
 * Releases. All of it is gone — cards live in SQLite, in a worker, one copy per
 * window, and `utils/cardsDb/cardsDbClient` owns loading them.
 *
 * The file survives only because a dozen modules import `database` from here.
 * Import it from `utils/mtga/database` in new code.
 */
import database from "./mtga/database";

window.database = database;

export default database;
