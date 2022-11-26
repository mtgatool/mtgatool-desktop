/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import RankSmall, { RankSmallProps } from "../components/RankSmall";

export default {
  title: "MTG Arena Tool/RankSmall",
  component: RankSmall,
} as Meta;

const Template: Story<RankSmallProps> = (args) => <RankSmall {...args} />;

const TestRank = {
  rank: "Bronze",
  tier: 1,
  step: 1,
  won: 0,
  lost: 0,
  drawn: 0,
  percentile: 0,
  leaderboardPlace: 0,
  seasonOrdinal: 0,
};

const MythicRank = {
  rank: "Mythic",
  tier: 1,
  step: 1,
  won: 0,
  lost: 0,
  drawn: 0,
  percentile: 10,
  leaderboardPlace: 150,
  seasonOrdinal: 0,
};

export const RankSmallBronze = Template.bind({});
RankSmallBronze.args = {
  rank: TestRank,
};

export const RankSmallMythic = Template.bind({});
RankSmallMythic.args = {
  rank: MythicRank,
};

export const RankSmallSilver = Template.bind({});
RankSmallSilver.args = {
  rankTier: "Silver",
};

export const RankSmallPlatinum = Template.bind({});
RankSmallPlatinum.args = {
  rankTier: "Platinum",
};

export const RankSmallDiamond = Template.bind({});
RankSmallDiamond.args = {
  rankTier: "Diamond",
};

export const RankSmallUnranked = Template.bind({});
RankSmallUnranked.args = {
  rankTier: "Unranked",
};
