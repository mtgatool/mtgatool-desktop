/* eslint-disable react/jsx-props-no-spreading */
import { Story, Meta } from "@storybook/react";

import Auth, { AuthProps } from "../components/Auth";
import App from "../components/App";

import "../index.scss";

export default {
  title: "MTG Arena Tool/App",
  component: Auth,
} as Meta;

const Template: Story<AuthProps> = (args) => <Auth {...args} />;
const AppTemplate: Story = () => <App />;

export const AppComponent = AppTemplate.bind({});

export const AuthComponentLogin = Template.bind({});
AuthComponentLogin.args = {
  defaultPage: 1,
};

export const AuthComponentSignup = Template.bind({});
AuthComponentSignup.args = {
  defaultPage: 2,
};

export const AuthComponentForgot = Template.bind({});
AuthComponentForgot.args = {
  defaultPage: 0,
};
