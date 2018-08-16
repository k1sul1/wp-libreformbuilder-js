// wp_localize_script...
export default {
  isAdmin: () => window.wplfb.isAdmin === '1',
  active: () => window.wplfb.active === '1',
  state: () => window.wplfb.state,
  stateInput: () => document.querySelector('[name="wplfb-state"]'),
  restURL: () => window.wplfb.restURL,
}
