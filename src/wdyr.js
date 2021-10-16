/* eslint-disable global-require */
import React from "react";

if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackExtraHooks: [[require("react-redux/lib"), "useSelector"]],
  });
}
