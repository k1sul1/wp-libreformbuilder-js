const rewireMobX = require('react-app-rewire-mobx')
const rewireCss = require('react-app-rewire-css-modules')
// const { injectBabelPlugin } = require('react-app-rewired')

module.exports = function override (config, env) {
  // config = injectBabelPlugin('transform-decorators', config)
  config = rewireMobX(config, env)
  config = rewireCss(config, env)

  return config
}
