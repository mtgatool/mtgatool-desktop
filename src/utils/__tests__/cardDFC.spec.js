import { loadDbFromCache } from "mtgatool-shared";
import isCardDfc from "../isCardDfc";

loadDbFromCache();

it("Can guess if card has two faces", () => {
  expect(isCardDfc(75155)).toBeTruthy();
  expect(isCardDfc(73470)).toBeTruthy();
  expect(isCardDfc(66109)).toBeTruthy();
  expect(isCardDfc(66111)).toBeTruthy();
  expect(isCardDfc(75156)).toBeTruthy();
  expect(isCardDfc(0)).toBeFalsy();

  // Adventures
  expect(isCardDfc(70471)).toBeFalsy();
  expect(isCardDfc(70312)).toBeFalsy();

  // Split cards
  expect(isCardDfc(68684)).toBeFalsy();
  expect(isCardDfc(68682)).toBeFalsy();
  expect(isCardDfc(68691)).toBeFalsy();
  expect(isCardDfc(68692)).toBeFalsy();
});
