import React from 'react'
import PropTypes from 'prop-types'

import './Button.scss'

const Button = ({ children, className, onClick, element: Element = 'button', ...props }) => (
  <Element
    className={`wplfb-button ${className || ''}`}
    onClick={(e) => {
      if (onClick) {
        onClick(e)
      }

      e.preventDefault()
    }}
    {...props}
  >
    {children}
  </Element>
)

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  element: PropTypes.string,
}

export default Button
