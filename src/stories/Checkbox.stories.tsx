/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import Checkbox, { CheckboxProps } from "../components/ui/Checkbox";
import CheckboxContainer from "../components/ui/CheckboxContainer";
import vodiFn from "../utils/voidfn";

export default {
  title: "MTG Arena Tool/Checkbox",
  component: Checkbox,
} as Meta;

const Template: Story<CheckboxProps> = (args) => <Checkbox {...args} />;

const TemplateWithContainer: Story<CheckboxProps> = (args) => (
  <CheckboxContainer>
    <Checkbox {...args} />
  </CheckboxContainer>
);

export const CheckboxRegular = Template.bind({});
CheckboxRegular.args = {
  text: "Lorem Ipsum",
  value: false,
  callback: vodiFn,
};

export const CheckboxChecked = Template.bind({});
CheckboxChecked.args = {
  text: "Lorem Ipsum",
  value: true,
  callback: vodiFn,
};

export const CheckboxCheckedDisabled = Template.bind({});
CheckboxCheckedDisabled.args = {
  text: "Lorem Ipsum",
  value: true,
  disabled: true,
  callback: vodiFn,
};

export const CheckboxContainerRegular = TemplateWithContainer.bind({});
CheckboxContainerRegular.args = {
  text: "Lorem Ipsum",
  value: false,
  callback: vodiFn,
};
