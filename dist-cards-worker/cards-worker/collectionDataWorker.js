"use strict";
/* eslint-disable no-restricted-globals */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getCollectionData_1 = __importDefault(require("./getCollectionData"));
/*
  Im wrapping up this into a web worker for performance.
  This is a loop that will only get worse and worse as more cards and formats are added to MTGA,
  Therefore I am isolating its execution in another "thread", to avoid it blocking
  React from rendering and causing lots of blocks in the UI.
  Ideally some other things like Automerge should be in a separate thread, but that
  requires isolating ToolDb as well.
*/
self.onmessage = (e) => {
    const { cards, cardsList, allCards, setNames, sets } = e.data;
    const cardsData = (0, getCollectionData_1.default)(cards, cardsList, allCards, setNames, sets);
    self.postMessage(cardsData);
};
