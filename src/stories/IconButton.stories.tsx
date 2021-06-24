/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";

import IconButton, { IconButtonProps } from "../components/ui/IconButton";

import settingsIcon from "../assets/images/cog.png";

import "../index.scss";
import vodiFn from "../utils/voidfn";

export default {
  title: "MTG Arena Tool/IconButton",
  component: IconButton,
} as Meta;

const Template: Story<IconButtonProps> = (args) => <IconButton {...args} />;

export const IconButtonRegular = Template.bind({});
IconButtonRegular.args = {
  style: { margin: `auto 8px` },
  onClick: vodiFn,
  icon: settingsIcon,
};

export const IconButtonHover = Template.bind({});
IconButtonHover.args = {
  className: "__hover",
  style: { margin: `auto 8px` },
  onClick: vodiFn,
  icon: settingsIcon,
};
