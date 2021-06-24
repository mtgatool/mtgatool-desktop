/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";

import Section, { SectionProps } from "../components/ui/Section";

import "../index.scss";

export default {
  title: "MTG Arena Tool/Section",
  component: Section,
} as Meta;

const Template: Story<SectionProps> = (args) => <Section {...args} />;

export const SectionRegular = Template.bind({});
SectionRegular.args = {
  style: { width: "300px", height: "200px" },
};
