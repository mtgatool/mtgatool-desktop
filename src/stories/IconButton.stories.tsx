/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import settingsIcon from "../assets/images/cog.png";
import IconButton, { IconButtonProps } from "../components/ui/IconButton";
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
