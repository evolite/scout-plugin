import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

// Redirect bundled require() calls to the host libraries Stash already loaded.
// NEVER bundle React/Bootstrap/etc — version conflicts + bloat.
const banner = `window.require = function(name) {
  switch (name) {
    case "react":               return window.PluginApi.React;
    case "react-dom":           return window.PluginApi.ReactDOM;
    case "@apollo/client":      return window.PluginApi.libraries.Apollo;
    case "react-bootstrap":     return window.PluginApi.libraries.Bootstrap;
    case "react-router-dom":    return window.PluginApi.libraries.ReactRouterDOM;
    case "react-select":        return window.PluginApi.libraries.ReactSelect;
    case "react-intl":          return window.PluginApi.libraries.Intl;
    case "@fortawesome/free-solid-svg-icons":   return window.PluginApi.libraries.FontAwesomeSolid;
    case "@fortawesome/free-regular-svg-icons": return window.PluginApi.libraries.FontAwesomeRegular;
    case "mousetrap":           return window.PluginApi.libraries.Mousetrap;
  }
};`;

// STASH_PLUGIN_DEST=. builds straight into the (symlinked) plugin dir.
const dest = process.env.STASH_PLUGIN_DEST || "dist";

export default {
  input: "src/index.tsx",
  output: {
    dir: dest,
    format: "cjs",
    entryFileNames: "scout-plugin.js",
    banner,
  },
  plugins: [
    peerDepsExternal(),
    postcss({ extract: "styles.css", minimize: true }),
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(),
  ],
  external: ["react", "react-dom"],
};
