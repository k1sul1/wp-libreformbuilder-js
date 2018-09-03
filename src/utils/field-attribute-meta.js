/*
 * Get metadata that helps decide on how to render the HTML or attribute inputs
 */
export const getFieldAttributeMeta = (name, overrides = {}) => ({
  type: ['required'].indexOf(name) > -1 ? 'checkbox' : 'text', // Default checkbox attributes
  readOnly: null,
  hidden: ['type'].indexOf(name) > -1, // Default blacklisted attributes
  ...overrides[name],
})
