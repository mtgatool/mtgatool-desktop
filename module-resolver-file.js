/* eslint-disable */
const webpack = require("webpack");

module.exports = function (modules = { webIndex: true, electronIndex: true }) {
  // The modules which can be toggled.
  // Eg. This config can be exported from db. For now its static.
  const replacements = [];

  for (const moduleName in modules) {
    if (modules.hasOwnProperty(moduleName)) {
      (function (name) {
        replacements.push(
          new webpack.NormalModuleReplacementPlugin(
            // Match module name on runtime just before compilation.
            new RegExp(`(.*)${name}(\\.*)`),
            function (resource) {
              resource.request = resource.request.replace(
                new RegExp(name),
                // Replace its resource path by adding .empty.js suffix.
                modules[name] === true ? name : `${name}.empty.js`
              );
            }
          )
        );
      })(moduleName);
    }
  }

  return replacements;
};
