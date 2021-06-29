/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";
import { Deck } from "mtgatool-shared";

import WildcardsCost, { WildcardsCostProps } from "../components/WildcardsCost";

import "../index.scss";

export default {
  title: "MTG Arena Tool/WildcardsCost",
  component: WildcardsCost,
} as Meta;

const Template: Story<WildcardsCostProps> = (args) => (
  <WildcardsCost {...args} />
);

const TestDeck = {
  mainDeck: [
    { id: 71870, quantity: 1 },
    { id: 67922, quantity: 4 },
    { id: 69576, quantity: 4 },
    { id: 70732, quantity: 4 },
    { id: 72434, quantity: 3 },
    { id: 77514, quantity: 2 },
    { id: 69285, quantity: 1 },
    { id: 60981, quantity: 1 },
    { id: 73290, quantity: 2 },
    { id: 77516, quantity: 2 },
    { id: 77517, quantity: 2 },
    { id: 77510, quantity: 3 },
    { id: 69556, quantity: 2 },
    { id: 73905, quantity: 4 },
    { id: 73284, quantity: 2 },
    { id: 74013, quantity: 3 },
    { id: 75300, quantity: 4 },
    { id: 69393, quantity: 4 },
    { id: 70388, quantity: 1 },
    { id: 66483, quantity: 4 },
    { id: 70391, quantity: 2 },
    { id: 70504, quantity: 2 },
    { id: 72555, quantity: 1 },
    { id: 70503, quantity: 2 },
  ],
  sideboard: [
    { id: 73914, quantity: 3 },
    { id: 70141, quantity: 2 },
    { id: 71293, quantity: 1 },
    { id: 69636, quantity: 1 },
    { id: 75662, quantity: 1 },
    { id: 70748, quantity: 3 },
    { id: 73298, quantity: 1 },
    { id: 69895, quantity: 3 },
    { id: 70141, quantity: 2 },
    { id: 75662, quantity: 1 },
    { id: 70748, quantity: 2 },
    { id: 73298, quantity: 1 },
  ],
  name: "Rakdos New",
  id: "4e885749-c2dd-48f6-af41-761cc051c8f9",
  lastUpdated: "2021-05-27T19:15:51.8950275",
  deckTileId: 71293,
  colors: [3, 4, 6],
  tags: ["TraditionalHistoric"],
  custom: false,
  commandZoneGRPIds: [],
  companionGRPId: 71293,
  format: "TraditionalHistoric",
};

export const WildcardsCostRegular = Template.bind({});
WildcardsCostRegular.args = {
  deck: new Deck(TestDeck),
};

export const WildcardsCostShrink = Template.bind({});
WildcardsCostShrink.args = {
  deck: new Deck(TestDeck),
  shrink: true,
};
