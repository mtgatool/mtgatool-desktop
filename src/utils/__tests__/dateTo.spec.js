import { toHHMM, toHHMMSS, toMMSS } from "../dateTo";

it("Converts to MM:SS", () => {
  expect(toMMSS(9600)).toBe("2:40:00");
  expect(toMMSS(120)).toBe("02:00");
  expect(toMMSS(7)).toBe("00:07");
});

it("Converts to HH:MM:SS", () => {
  expect(toHHMMSS(9600)).toBe("02:40:00");
  expect(toHHMMSS(13576)).toBe("03:46:16");
  expect(toHHMMSS(67)).toBe("00:01:07");
});

it("Converts to HH:MM", () => {
  expect(toHHMM(9600)).toBe("02:40");
  expect(toHHMM(13576)).toBe("03:46");
  expect(toHHMM(120)).toBe("00:02");
  expect(toHHMM(35)).toBe("00:00");
  expect(toHHMM(67)).toBe("00:01");
});
