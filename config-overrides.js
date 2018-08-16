const rewireMobX = require('react-app-rewire-mobx')
const rewireSass = require('react-app-rewire-scss')
// const { injectBabelPlugin } = require('react-app-rewired')

module.exports = function override (config, env) {
  // config = injectBabelPlugin('transform-decorators', config)
  config = rewireMobX(config, env)
  config = rewireSass(config, env)

  return config
}
