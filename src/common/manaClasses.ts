import { BLACK, BLUE, COLORLESS, GREEN, RED, WHITE } from "../constants";

const manaClasses: string[] = [];
manaClasses[WHITE] = "mana-w";
manaClasses[BLUE] = "mana-u";
manaClasses[BLACK] = "mana-b";
manaClasses[RED] = "mana-r";
manaClasses[GREEN] = "mana-g";
manaClasses[COLORLESS] = "mana-c";

export default manaClasses;
