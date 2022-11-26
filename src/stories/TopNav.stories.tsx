/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import TopBar from "../components/TopBar";

export default {
  title: "MTG Arena Tool/TopBar",
  component: TopBar,
} as Meta;

const Template: Story = (args) => <TopBar {...args} />;

export const TopBarWindows = Template.bind({});
TopBarWindows.args = {};

export const TopBarOSX = Template.bind({});
TopBarOSX.args = {
  forceOs: "darwin",
};
