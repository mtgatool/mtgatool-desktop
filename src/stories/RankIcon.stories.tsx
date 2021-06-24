/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";
import Flex from "../components/Flex";

import RankIcon, { RankIconProps } from "../components/RankIcon";

import "../index.scss";

export default {
  title: "MTG Arena Tool/RankIcon",
  component: RankIcon,
} as Meta;

const Template: Story<RankIconProps> = (args) => (
  <Flex>
    <RankIcon {...args} />
  </Flex>
);

export const RankIconBronze = Template.bind({});
RankIconBronze.args = {
  rank: "Bronze",
  tier: 1,
  format: "constructed",
};

export const RankIconSilverBullets = Template.bind({});
RankIconSilverBullets.args = {
  rank: "Silver",
  tier: 1,
  step: 4,
  format: "limited",
};

export const RankIconGold = Template.bind({});
RankIconGold.args = {
  rank: "Gold",
  tier: 4,
  format: "constructed",
};

export const RankIconPlatinum = Template.bind({});
RankIconPlatinum.args = {
  rank: "Platinum",
  tier: 2,
  format: "limited",
};

export const RankIconDiamond = Template.bind({});
RankIconDiamond.args = {
  rank: "Diamond",
  tier: 1,
  format: "constructed",
};

export const RankIconMythic = Template.bind({});
RankIconMythic.args = {
  rank: "Mythic",
  tier: 1,
  format: "constructed",
};

export const RankIconMythicRated = Template.bind({});
RankIconMythicRated.args = {
  rank: "Mythic",
  tier: 2,
  percentile: 1,
  leaderboardPlace: 366,
  format: "constructed",
};
