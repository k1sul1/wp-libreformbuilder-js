module.exports = {
  "parser": "babel-eslint",
  "root": true,
  "extends": [
    "standard",
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
    "indent": ["warn", 2, { "ignoreComments": true }],
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
