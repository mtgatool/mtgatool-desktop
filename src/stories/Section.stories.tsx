/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import Section, { SectionProps } from "../components/ui/Section";

export default {
  title: "MTG Arena Tool/Section",
  component: Section,
} as Meta;

const Template: Story<SectionProps> = (args) => <Section {...args} />;

export const SectionRegular = Template.bind({});
SectionRegular.args = {
  style: { width: "300px", height: "200px" },
};
