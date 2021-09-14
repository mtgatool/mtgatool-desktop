/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";
import { Deck, loadDbFromCache } from "mtgatool-shared";
import CardTile, { CardTileProps } from "../components/CardTile";

import "../index.scss";
import database from "../utils/database-wrapper";

loadDbFromCache();

export default {
  title: "MTG Arena Tool/CardTile",
  component: CardTile,
} as Meta;

const Template: Story<CardTileProps> = (args) => <CardTile {...args} />;

const testDeck = new Deck(
  undefined,
  [
    77501, 77501, 70732, 70732, 66111, 66111, 75537, 71256, 77517, 72121, 75030,
    76476, 59677,
  ]
);

export const CardTileNormal = Template.bind({});
CardTileNormal.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[72578],
  quantity: {
    type: "NUMBER",
    quantity: 4,
  },
};

export const CardTileWildcardsMythic = Template.bind({});
CardTileWildcardsMythic.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: true,
  deck: testDeck,
  card: database.cards[70732],
  quantity: {
    type: "NUMBER",
    quantity: 2,
  },
};

export const CardTileWildcardsRare = Template.bind({});
CardTileWildcardsRare.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: true,
  deck: testDeck,
  card: database.cards[66111],
  quantity: {
    type: "NUMBER",
    quantity: 4,
  },
};

export const CardTileWildcardsHighligted = Template.bind({});
CardTileWildcardsHighligted.args = {
  indent: "a",
  isHighlighted: true,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[75537],
  quantity: {
    type: "NUMBER",
    quantity: 4,
  },
};

export const CardTileOdds = Template.bind({});
CardTileOdds.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[71256],
  quantity: {
    type: "ODDS",
    odds: "12%",
    quantity: 3,
  },
};

export const CardTileRank = Template.bind({});
CardTileRank.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[72121],
  quantity: {
    type: "RANK",
    quantity: "D",
  },
};

export const CardTileText = Template.bind({});
CardTileText.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[59677],
  quantity: {
    type: "TEXT",
    quantity: "NaN",
  },
};

export const CardTileUnknown = Template.bind({});
CardTileUnknown.args = {
  indent: "a",
  isHighlighted: false,
  isSideboard: false,
  showWildcards: false,
  deck: testDeck,
  card: database.cards[99],
  quantity: {
    type: "NUMBER",
    quantity: 3,
  },
};
