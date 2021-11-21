/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";

import DecksArtViewRow, {
  DecksArtViewRowProps,
} from "../components/DecksArtViewRow";
import vodiFn from "../utils/voidfn";
import "../index.scss";

export default {
  title: "MTG Arena Tool/DecksArtViewRow",
  component: DecksArtViewRow,
} as Meta;

const Template: Story<DecksArtViewRowProps> = (args) => (
  <DecksArtViewRow {...args} />
);

const TestDeck = {
  playerId: "EYERDM44IFBVLDZSYBTNYGPY2I",
  name: "Rakdos New",
  version: 0,
  deckHash: "e3d266aeb335ccda560ab77f66448a95c84ea61b",
  deckId: "4e885749-c2dd-48f6-af41-761cc051c8f9",
  colors: 44,
  tile: 71293,
  format: "TraditionalHistoric",
  mainDeck: [
    { id: 71870, quantity: 1, measurable: true },
    { id: 67922, quantity: 4, measurable: true },
    { id: 69576, quantity: 4, measurable: true },
    { id: 70732, quantity: 4, measurable: true },
    { id: 72434, quantity: 3, measurable: true },
    { id: 77514, quantity: 2, measurable: true },
    { id: 69285, quantity: 1, measurable: true },
    { id: 60981, quantity: 1, measurable: true },
    { id: 73290, quantity: 2, measurable: true },
    { id: 77516, quantity: 2, measurable: true },
    { id: 77517, quantity: 2, measurable: true },
    { id: 77510, quantity: 3, measurable: true },
    { id: 69556, quantity: 2, measurable: true },
    { id: 73905, quantity: 4, measurable: true },
    { id: 73284, quantity: 2, measurable: true },
    { id: 74013, quantity: 3, measurable: true },
    { id: 75300, quantity: 4, measurable: true },
    { id: 69393, quantity: 4, measurable: true },
    { id: 70388, quantity: 1, measurable: true },
    { id: 66483, quantity: 4, measurable: true },
    { id: 70391, quantity: 2, measurable: true },
    { id: 70504, quantity: 2, measurable: true },
    { id: 72555, quantity: 1, measurable: true },
    { id: 70503, quantity: 2, measurable: true },
  ],
  sideboard: [
    { id: 73914, quantity: 3, measurable: true },
    { id: 70141, quantity: 2, measurable: true },
    { id: 71293, quantity: 1, measurable: true },
    { id: 69636, quantity: 1, measurable: true },
    { id: 75662, quantity: 1, measurable: true },
    { id: 70748, quantity: 3, measurable: true },
    { id: 73298, quantity: 1, measurable: true },
    { id: 69895, quantity: 3, measurable: true },
    { id: 70141, quantity: 2, measurable: true },
    { id: 75662, quantity: 1, measurable: true },
    { id: 70748, quantity: 2, measurable: true },
    { id: 73298, quantity: 1, measurable: true },
  ],
  id: "4e885749-c2dd-48f6-af41-761cc051c8f9",
  lastUpdated: "2021-05-27T19:15:51.8950275",
  deckTileId: 71293,
  tags: ["TraditionalHistoric"],
  custom: false,
  commandZoneGRPIds: [],
  companionGRPId: 71293,
  type: "InternalDeck" as any,
  description: "",
  lastUsed: 0,
  lastModified: 1624567344211,
  matches: {},
  hidden: false,
  stats: {
    gameWins: 0,
    gameLosses: 0,
    matchWins: 0,
    matchLosses: 0,
  },
  totalGames: 0,
  cardWinrates: {},
  winrate: 0,
};

export const Primary = Template.bind({});
Primary.args = {
  deck: TestDeck,
  clickDeck: vodiFn,
};
