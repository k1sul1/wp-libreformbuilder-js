import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import parser from 'html-react-parser'

const options = (element) => ({
  replace: (node) => {
    if (!node.attribs) return

    if (node.attribs.class) {
      if (node.attribs.class.includes('field-container')) {
        return element
      }
    }
  },
})

const HTML = ({ children, element }) => <Fragment>{parser(children, options(element))}</Fragment>
HTML.propTypes = {
  children: PropTypes.node.isRequired,
  element: PropTypes.node,
}

export default HTML
