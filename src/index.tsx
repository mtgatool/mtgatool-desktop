/**
 * This file basically swaps the index depending on the context
 * Mainly because for web builds we dont require anything from the overlay/background.
 *
 * See module-resolver-file.js
 */
import "./electronIndex";
import "./webIndex";
