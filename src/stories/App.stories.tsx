/* eslint-disable react/jsx-props-no-spreading */
import "../index.scss";

import { Meta, Story } from "@storybook/react";

import App, { AppProps } from "../components/App";
import Auth, { AuthProps } from "../components/Auth";

export default {
  title: "MTG Arena Tool/App",
  component: Auth,
} as Meta;

const Template: Story<AuthProps> = (args) => <Auth {...args} />;
const AppTemplate: Story<AppProps> = (args) => <App {...args} />;

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

export const AppWindows = AppTemplate.bind({});
AppWindows.args = {
  forceOs: "windows",
};

export const AppOSX = AppTemplate.bind({});
AppOSX.args = {
  forceOs: "darwin",
};

export const AppLinux = AppTemplate.bind({});
AppLinux.args = {
  forceOs: "linux",
};
