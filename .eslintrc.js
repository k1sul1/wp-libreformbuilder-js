// Only used by editors, CRA uses it's own template

module.exports = {
  "parser": "babel-eslint",
  "root": true,
  "extends": [
    // "standard", // can't use standard with CRA because eslint config https://github.com/facebook/create-react-app/issues/3886
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/warnings",
    "plugin:import/errors"
  ],
  "plugins": [
    "react",
    "jsx-a11y",
    "import",
  ],
  "rules": {
    "comma-dangle": [0],
    // "indent": ["warn", 2, { "ignoreComments": true }], // standard rule
  },
  "env": {
    "browser": true,
    "jest": true,
    // "node": true,
  },
  "parserOptions": {
    "sourceType": "module",
    "allowImportExportEverywhere": true,
    "ecmaFeatures": {
      "jsx": true,
    },
  },
}
