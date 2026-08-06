// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";

// jsdom ships no TextEncoder/TextDecoder. Every browser has had them for years,
// so app code reasonably assumes they exist — and sha1() calls TextEncoder at
// *import* time, down the chain that reaches local settings and the card
// database. The failure is therefore not a failing assertion but a suite that
// never loads ("Test suite failed to run"), which is easy to skim past: the
// summary still reports every remaining test as passing. Eight suites were dark
// this way, the GRE parser's own regression tests among them.
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}
