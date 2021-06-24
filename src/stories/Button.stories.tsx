/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";

import Button, { ButtonProps } from "../components/ui/Button";
import vodiFn from "../utils/voidfn";
import "../index.scss";

export default {
  title: "MTG Arena Tool/Button",
  component: Button,
} as Meta;

const Template: Story<ButtonProps> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  text: "Button",
  style: { margin: "16px" },
  onClick: vodiFn,
};

export const Disabled = Template.bind({});
Disabled.args = {
  text: "Button",
  style: { margin: "16px" },
  onClick: vodiFn,
  disabled: true,
};
