/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import ManaCost, { ManaCostProps } from "../components/ManaCost";

export default {
  title: "MTG Arena Tool/ManaCost",
  component: ManaCost,
} as Meta;

const Template: Story<ManaCostProps> = (args) => (
  <div style={{ display: "flex" }}>
    <ManaCost {...args} />
  </div>
);

export const ManaCostRegular = Template.bind({});
ManaCostRegular.args = {
  // Adding colorless too, it should not show up
  colors: [6, 1, 2, 3, 4, 5],
};

export const ManaCostColorless = Template.bind({});
ManaCostColorless.args = {
  colors: [6],
};
